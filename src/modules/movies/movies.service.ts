import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.movie.findMany({
      orderBy: { releaseDate: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        durationMin: true,
        posterUrl: true,
        releaseDate: true,
      },
    });
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

    if (!movie) throw new NotFoundException(`Movie #${id} not found`);

    return movie;
  }
}
