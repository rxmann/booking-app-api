import { Injectable, HttpStatus } from '@nestjs/common';
import { AppException, ResourceNotFoundException } from '../common/exceptions/index.js';
import { pageArgs, paginated } from '../common/pagination/paginated.js';
import type { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTheatreDto } from './dto/create-theatre.dto.js';
import { UpdateTheatreDto } from './dto/update-theatre.dto.js';

const THEATRE_SELECT = {
  id: true,
  name: true,
  createdAt: true,
  address: {
    select: {
      id: true,
      line1: true,
      line2: true,
      city: true,
      state: true,
      country: true,
      postalCode: true,
    },
  },
} as const;

@Injectable()
export class TheatresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTheatreDto) {
    return this.prisma.$transaction(async (tx) => {
      const address = await tx.address.create({ data: dto.address });
      return tx.theatre.create({
        data: { name: dto.name, addressId: address.id },
        select: THEATRE_SELECT,
      });
    });
  }

  async findAll(query: PaginationQueryDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.theatre.findMany({
        ...pageArgs(query),
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        select: THEATRE_SELECT,
      }),
      this.prisma.theatre.count(),
    ]);
    return paginated(items, total, query);
  }

  async findOne(id: number) {
    const theatre = await this.prisma.theatre.findUnique({
      where: { id },
      select: THEATRE_SELECT,
    });
    if (!theatre) throw new ResourceNotFoundException('Theatre', id);
    return theatre;
  }

  async update(id: number, dto: UpdateTheatreDto) {
    const theatre = await this.prisma.theatre.findUnique({
      where: { id },
      select: { addressId: true },
    });
    if (!theatre) throw new ResourceNotFoundException('Theatre', id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.address) {
        await tx.address.update({
          where: { id: theatre.addressId },
          data: dto.address,
        });
      }
      return tx.theatre.update({
        where: { id },
        data: dto.name ? { name: dto.name } : {},
        select: THEATRE_SELECT,
      });
    });
  }

  async remove(id: number) {
    const theatre = await this.prisma.theatre.findUnique({
      where: { id },
      select: { addressId: true, _count: { select: { auditoriums: true } } },
    });
    if (!theatre) throw new ResourceNotFoundException('Theatre', id);
    if (theatre._count.auditoriums > 0) {
      throw new AppException('Remove all auditoriums before deleting the theatre', HttpStatus.CONFLICT);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.theatre.delete({ where: { id } });
      await tx.address.delete({ where: { id: theatre.addressId } });
    });
  }
}
