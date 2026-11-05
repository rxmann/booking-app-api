import { Injectable, HttpStatus } from '@nestjs/common';
import { AppException, ResourceNotFoundException } from '../common/exceptions/index.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAuditoriumDto } from './dto/create-auditorium.dto.js';
import { CreateSeatsDto } from './dto/create-seats.dto.js';
import { UpdateAuditoriumDto } from './dto/update-auditorium.dto.js';
import { UpdateSeatStatusDto } from './dto/update-seat-status.dto.js';
import { SeatStatus } from './enums/seat-status.enum.js';

@Injectable()
export class AuditoriumsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTheatre(theatreId: number) {
    const theatre = await this.prisma.theatre.findUnique({ where: { id: theatreId } });
    if (!theatre) throw new ResourceNotFoundException('Theatre', theatreId);

    return this.prisma.auditorium.findMany({
      where: { theatreId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, _count: { select: { seats: true } } },
    });
  }

  async create(theatreId: number, dto: CreateAuditoriumDto) {
    const theatre = await this.prisma.theatre.findUnique({ where: { id: theatreId } });
    if (!theatre) throw new ResourceNotFoundException('Theatre', theatreId);

    return this.prisma.auditorium.create({
      data: { name: dto.name, theatreId },
      select: { id: true, name: true, theatreId: true },
    });
  }

  async update(id: number, dto: UpdateAuditoriumDto) {
    const auditorium = await this.prisma.auditorium.findUnique({ where: { id } });
    if (!auditorium) throw new ResourceNotFoundException('Auditorium', id);

    return this.prisma.auditorium.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, theatreId: true },
    });
  }

  async remove(id: number) {
    const auditorium = await this.prisma.auditorium.findUnique({
      where: { id },
      select: { _count: { select: { screenings: true } } },
    });
    if (!auditorium) throw new ResourceNotFoundException('Auditorium', id);
    if (auditorium._count.screenings > 0) {
      throw new AppException('Remove all screenings before deleting the auditorium', HttpStatus.CONFLICT);
    }

    await this.prisma.auditorium.delete({ where: { id } });
  }

  async createSeats(id: number, dto: CreateSeatsDto) {
    const auditorium = await this.prisma.auditorium.findUnique({ where: { id } });
    if (!auditorium) throw new ResourceNotFoundException('Auditorium', id);

    const incoming = dto.seats.map((s) => ({
      row: s.row.toUpperCase(),
      number: s.number,
      type: s.type,
    }));

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.seat.findMany({
        where: { auditoriumId: id },
        select: { id: true, row: true, number: true, status: true },
      });
      const byKey = new Map(existing.map((s) => [`${s.row}${s.number}`, s]));

      const toCreate: typeof incoming = [];
      let restored = 0;
      for (const seat of incoming) {
        const found = byKey.get(`${seat.row}${seat.number}`);
        if (!found) {
          toCreate.push(seat);
        } else if (found.status === SeatStatus.DELETED) {
          await tx.seat.update({
            where: { id: found.id },
            data: { status: SeatStatus.ACTIVE, type: seat.type },
          });
          restored++;
        }
      }

      const created = await tx.seat.createMany({
        data: toCreate.map((s) => ({ ...s, auditoriumId: id })),
        skipDuplicates: true,
      });
      return { created: created.count, restored };
    });
  }

  async findSeats(id: number) {
    const auditorium = await this.prisma.auditorium.findUnique({ where: { id } });
    if (!auditorium) throw new ResourceNotFoundException('Auditorium', id);

    return this.prisma.seat.findMany({
      where: { auditoriumId: id, status: { not: SeatStatus.DELETED } },
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
      select: { id: true, row: true, number: true, type: true, status: true },
    });
  }

  async updateSeatStatus(auditoriumId: number, seatId: number, dto: UpdateSeatStatusDto) {
    await this.findLiveSeat(auditoriumId, seatId);
    if (dto.status === SeatStatus.INACTIVE) {
      await this.assertNoUpcomingBookings({ id: seatId });
    }

    return this.prisma.seat.update({
      where: { id: seatId },
      data: { status: dto.status },
      select: { id: true, row: true, number: true, type: true, status: true },
    });
  }

  async removeSeat(auditoriumId: number, seatId: number) {
    await this.findLiveSeat(auditoriumId, seatId);
    await this.assertNoUpcomingBookings({ id: seatId });

    await this.prisma.seat.update({
      where: { id: seatId },
      data: { status: SeatStatus.DELETED },
    });
  }

  async clearSeats(id: number) {
    const auditorium = await this.prisma.auditorium.findUnique({ where: { id } });
    if (!auditorium) throw new ResourceNotFoundException('Auditorium', id);
    await this.assertNoUpcomingBookings({ auditoriumId: id });

    const { count } = await this.prisma.seat.updateMany({
      where: { auditoriumId: id, status: { not: SeatStatus.DELETED } },
      data: { status: SeatStatus.DELETED },
    });
    return { deleted: count };
  }

  private async findLiveSeat(auditoriumId: number, seatId: number) {
    const seat = await this.prisma.seat.findFirst({
      where: { id: seatId, auditoriumId, status: { not: SeatStatus.DELETED } },
      select: { id: true },
    });
    if (!seat) throw new ResourceNotFoundException('Seat', seatId);
    return seat;
  }

  // Past screenings, cancelled/expired bookings and lapsed holds never block a removal.
  private async assertNoUpcomingBookings(seat: Prisma.SeatWhereInput) {
    const now = new Date();
    const blocking = await this.prisma.bookingSeat.count({
      where: {
        seat,
        booking: {
          screening: { startsAt: { gt: now } },
          OR: [{ status: 'CONFIRMED' }, { status: 'HOLD', expiresAt: { gt: now } }],
        },
      },
    });
    if (blocking > 0) {
      throw new AppException('Seats have upcoming bookings; cancel them first', HttpStatus.CONFLICT);
    }
  }
}
