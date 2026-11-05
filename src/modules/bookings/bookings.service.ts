import { Injectable } from '@nestjs/common';
import { ResourceNotFoundException, ValidationException } from '../common/exceptions/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

const HOLD_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async hold(userId: number, dto: CreateBookingDto) {
    const { auditoriumId } = await this.assertScreeningBookable(dto.screeningId);
    await this.assertSeatsBookable(dto.seatIds, auditoriumId);
    return this.createHold(userId, dto);
  }

  private async assertScreeningBookable(screeningId: number) {
    const screening = await this.prisma.screening.findUnique({
      where: { id: screeningId },
      select: { auditoriumId: true, startsAt: true },
    });
    if (!screening) throw new ResourceNotFoundException('Screening', screeningId);
    if (screening.startsAt <= new Date()) {
      throw new ValidationException('Screening has already started');
    }
    return screening;
  }

  private async assertSeatsBookable(seatIds: number[], auditoriumId: number) {
    const seats = await this.prisma.seat.findMany({
      where: { id: { in: seatIds }, auditoriumId, status: { not: 'DELETED' } },
      select: { status: true },
    });
    if (seats.length !== seatIds.length) {
      throw new ValidationException('One or more seats do not belong to this auditorium');
    }
    if (seats.some((s) => s.status !== 'ACTIVE')) {
      throw new ValidationException('One or more seats are out of service');
    }
  }

  private async createHold(userId: number, dto: CreateBookingDto) {
    const expiresAt = new Date(Date.now() + HOLD_TTL_MS);

    // A racing request for the same seat violates @@unique([screeningId, seatId]);
    // PrismaExceptionFilter turns that P2002 into a 409.
    return this.prisma.$transaction(async (tx) => {
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
  }
}
