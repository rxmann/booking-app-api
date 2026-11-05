import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ScreeningsService } from './screenings.service.js';

@Controller('screenings')
export class ScreeningsController {
  constructor(private readonly screenings: ScreeningsService) {}

  @Get(':id/seats')
  findSeats(@Param('id', ParseIntPipe) id: number) {
    return this.screenings.findSeats(id);
  }
}
