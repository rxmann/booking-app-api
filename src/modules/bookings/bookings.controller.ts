import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, type JwtPayload } from '../auth/decorators/current-user.decorator.js';
import { JwtGuard } from '../auth/guards/jwt.guard.js';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

@Controller('bookings')
@UseGuards(JwtGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  hold(@CurrentUser() user: JwtPayload, @Body() dto: CreateBookingDto) {
    return this.bookings.hold(user.sub, dto);
  }
}
