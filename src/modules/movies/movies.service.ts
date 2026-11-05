import { Injectable } from '@nestjs/common';
import { ResourceNotFoundException } from '../common/exceptions/index.js';
import { pageArgs, paginated } from '../common/pagination/paginated.js';
import type { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.movie.findMany({
        ...pageArgs(query),
        orderBy: [{ releaseDate: 'desc' }, { id: 'asc' }],
        select: {
          id: true,
          title: true,
          description: true,
          durationMin: true,
          posterUrl: true,
          releaseDate: true,
        },
      }),
      this.prisma.movie.count(),
    ]);
    return paginated(items, total, query);
  }

  async findOne(id: number) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        durationMin: true,
        posterUrl: true,
        releaseDate: true,
      },
    });

    if (!movie) throw new ResourceNotFoundException('Movie', id);

    return movie;
  }
}
