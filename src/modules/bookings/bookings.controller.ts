import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type JwtPayload } from '../auth/decorators/current-user.decorator.js';
import { JwtGuard } from '../auth/guards/jwt.guard.js';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Hold seats for a screening (15 min TTL)' })
  @ApiResponse({ status: 201, description: 'Hold created' })
  @ApiResponse({ status: 400, description: 'Invalid seat or screening' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'One or more seats already booked' })
  hold(@CurrentUser() user: JwtPayload, @Body() dto: CreateBookingDto) {
    return this.bookings.hold(user.sub, dto);
  }
}
