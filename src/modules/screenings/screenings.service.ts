import { Injectable, HttpStatus } from '@nestjs/common';
import { AppException, ResourceNotFoundException, ValidationException } from '../common/exceptions/index.js';
import { pageArgs, paginated } from '../common/pagination/paginated.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateScreeningDto } from './dto/create-screening.dto.js';
import { ListScreeningsQueryDto } from './dto/list-screenings-query.dto.js';
import { UpdateScreeningDto } from './dto/update-screening.dto.js';

@Injectable()
export class ScreeningsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListScreeningsQueryDto) {
    const where = query.movieId ? { movieId: query.movieId } : undefined;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.screening.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          price: true,
          movie: { select: { id: true, title: true } },
          auditorium: { select: { id: true, name: true, theatre: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.screening.count({ where }),
    ]);
    return paginated(items, total, query);
  }

  async findOne(id: number) {
    const screening = await this.prisma.screening.findUnique({
      where: { id },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        price: true,
        createdAt: true,
        movie: { select: { id: true, title: true, durationMin: true } },
        auditorium: { select: { id: true, name: true, theatre: { select: { id: true, name: true } } } },
      },
    });
    if (!screening) throw new ResourceNotFoundException('Screening', id);
    return screening;
  }

  async create(dto: CreateScreeningDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (startsAt >= endsAt) throw new ValidationException('startsAt must be before endsAt');
    this.assertStartsInFuture(startsAt);
    await this.assertRefsExist(dto.movieId, dto.auditoriumId);

    const overlap = await this.prisma.screening.findFirst({
      where: {
        auditoriumId: dto.auditoriumId,
        AND: [{ startsAt: { lt: endsAt } }, { endsAt: { gt: startsAt } }],
      },
    });
    if (overlap) throw new AppException('Auditorium already booked in this time slot', HttpStatus.CONFLICT);

    return this.prisma.screening.create({
      data: {
        movieId: dto.movieId,
        auditoriumId: dto.auditoriumId,
        startsAt,
        endsAt,
        price: dto.price,
      },
      select: { id: true, startsAt: true, endsAt: true, price: true, movieId: true, auditoriumId: true },
    });
  }

  async update(id: number, dto: UpdateScreeningDto) {
    const existing = await this.prisma.screening.findUnique({ where: { id } });
    if (!existing) throw new ResourceNotFoundException('Screening', id);

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;
    const auditoriumId = dto.auditoriumId ?? existing.auditoriumId;

    if (startsAt >= endsAt) throw new ValidationException('startsAt must be before endsAt');
    if (dto.startsAt) this.assertStartsInFuture(startsAt);
    await this.assertRefsExist(dto.movieId, dto.auditoriumId);

    if (dto.auditoriumId && dto.auditoriumId !== existing.auditoriumId) {
      const bookings = await this.prisma.booking.count({ where: { screeningId: id } });
      if (bookings > 0) {
        throw new AppException(
          'Cannot move a screening with existing bookings to another auditorium',
          HttpStatus.CONFLICT,
        );
      }
    }

    const overlap = await this.prisma.screening.findFirst({
      where: {
        auditoriumId,
        id: { not: id },
        AND: [{ startsAt: { lt: endsAt } }, { endsAt: { gt: startsAt } }],
      },
    });
    if (overlap) throw new AppException('Auditorium already booked in this time slot', HttpStatus.CONFLICT);

    return this.prisma.screening.update({
      where: { id },
      data: {
        ...(dto.movieId && { movieId: dto.movieId }),
        auditoriumId,
        startsAt,
        endsAt,
        ...(dto.price !== undefined && { price: dto.price }),
      },
      select: { id: true, startsAt: true, endsAt: true, price: true, movieId: true, auditoriumId: true },
    });
  }

  private assertStartsInFuture(startsAt: Date) {
    if (startsAt <= new Date()) throw new ValidationException('startsAt must be in the future');
  }

  private async assertRefsExist(movieId?: number, auditoriumId?: number) {
    const [movie, auditorium] = await Promise.all([
      movieId ? this.prisma.movie.findUnique({ where: { id: movieId }, select: { id: true } }) : null,
      auditoriumId
        ? this.prisma.auditorium.findUnique({ where: { id: auditoriumId }, select: { id: true } })
        : null,
    ]);
    if (movieId && !movie) throw new ResourceNotFoundException('Movie', movieId);
    if (auditoriumId && !auditorium) throw new ResourceNotFoundException('Auditorium', auditoriumId);
  }

  async remove(id: number) {
    const screening = await this.prisma.screening.findUnique({
      where: { id },
      select: { _count: { select: { bookings: true } } },
    });
    if (!screening) throw new ResourceNotFoundException('Screening', id);
    if (screening._count.bookings > 0) {
      throw new AppException('Cannot delete a screening with existing bookings', HttpStatus.CONFLICT);
    }

    await this.prisma.screening.delete({ where: { id } });
  }

  async findTheatresForMovie(movieId: number) {
    const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) throw new ResourceNotFoundException('Movie', movieId);

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
    if (!movie) throw new ResourceNotFoundException('Movie', movieId);
    if (!theatre) throw new ResourceNotFoundException('Theatre', theatreId);

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
    if (!screening) throw new ResourceNotFoundException('Screening', screeningId);

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
      where: { auditoriumId: screening.auditoriumId, status: { not: 'DELETED' } },
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
      select: { id: true, row: true, number: true, type: true, status: true },
    });

    return seats.map((s) => ({
      ...s,
      available: s.status === 'ACTIVE' && !takenSeatIds.has(s.id),
    }));
  }
}
