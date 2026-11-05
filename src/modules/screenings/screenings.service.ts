import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ScreeningsService {
  constructor(private readonly prisma: PrismaService) {}

  async findTheatresForMovie(movieId: number) {
    const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) throw new NotFoundException(`Movie #${movieId} not found`);

    const screenings = await this.prisma.screening.findMany({
      where: { movieId, startsAt: { gt: new Date() } },
      select: {
        auditorium: {
          select: {
            theatre: { select: { id: true, name: true, address: { select: { line1: true, city: true } } } },
          },
        },
      },
    });

    // Deduplicate theatres by id
    const seen = new Set<number>();
    return screenings
      .map((s) => s.auditorium.theatre)
      .filter((t) => (seen.has(t.id) ? false : seen.add(t.id)));
  }

  async findScreeningsForMovieAtTheatre(movieId: number, theatreId: number) {
    const [movie, theatre] = await Promise.all([
      this.prisma.movie.findUnique({ where: { id: movieId } }),
      this.prisma.theatre.findUnique({ where: { id: theatreId } }),
    ]);
    if (!movie) throw new NotFoundException(`Movie #${movieId} not found`);
    if (!theatre) throw new NotFoundException(`Theatre #${theatreId} not found`);

    return this.prisma.screening.findMany({
      where: {
        movieId,
        startsAt: { gt: new Date() },
        auditorium: { theatreId },
      },
      orderBy: { startsAt: 'asc' },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        price: true,
        auditorium: { select: { id: true, name: true } },
      },
    });
  }

  async findSeats(screeningId: number) {
    const screening = await this.prisma.screening.findUnique({
      where: { id: screeningId },
      select: { auditoriumId: true },
    });
    if (!screening) throw new NotFoundException(`Screening #${screeningId} not found`);

    const takenSeatIds = await this.prisma.bookingSeat
      .findMany({
        where: {
          screeningId,
          booking: { status: { in: ['HOLD', 'CONFIRMED'] } },
        },
        select: { seatId: true },
      })
      .then((rows) => new Set(rows.map((r) => r.seatId)));

    const seats = await this.prisma.seat.findMany({
      where: { auditoriumId: screening.auditoriumId },
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
      select: { id: true, row: true, number: true, type: true },
    });

    return seats.map((s) => ({ ...s, available: !takenSeatIds.has(s.id) }));
  }
}
