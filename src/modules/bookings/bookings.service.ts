import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async hold(userId: number, dto: CreateBookingDto) {
    const screening = await this.prisma.screening.findUnique({
      where: { id: dto.screeningId },
      select: { auditoriumId: true, startsAt: true },
    });
    if (!screening) throw new NotFoundException(`Screening #${dto.screeningId} not found`);
    if (screening.startsAt <= new Date()) throw new BadRequestException('Screening has already started');

    const validSeats = await this.prisma.seat.findMany({
      where: { id: { in: dto.seatIds }, auditoriumId: screening.auditoriumId },
      select: { id: true },
    });
    if (validSeats.length !== dto.seatIds.length) {
      throw new BadRequestException('One or more seats do not belong to this auditorium');
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const booking = await tx.booking.create({
          data: { userId, screeningId: dto.screeningId, status: 'HOLD', expiresAt },
          select: { id: true, status: true, expiresAt: true, screeningId: true },
        });

        await tx.bookingSeat.createMany({
          data: dto.seatIds.map((seatId) => ({
            bookingId: booking.id,
            seatId,
            screeningId: dto.screeningId,
          })),
        });

        return booking;
      });
    } catch (e: unknown) {
      // DB unique constraint on (screeningId, seatId) fires when two requests race for the same seat
      if (typeof e === 'object' && e !== null && 'code' in e && e.code === 'P2002') {
        throw new ConflictException('One or more seats are already booked');
      }
      throw e;
    }
  }
}
