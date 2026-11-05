import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { AuditoriumsService } from './auditoriums.service.js';
import { CreateSeatsDto } from './dto/create-seats.dto.js';
import { UpdateAuditoriumDto } from './dto/update-auditorium.dto.js';
import { UpdateSeatStatusDto } from './dto/update-seat-status.dto.js';

@ApiTags('Auditoriums')
@Controller('auditoriums')
export class AuditoriumsController {
  constructor(private readonly auditoriums: AuditoriumsService) {}

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an auditorium (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Updated auditorium' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiResponse({ status: 404, description: 'Auditorium not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAuditoriumDto) {
    return this.auditoriums.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an auditorium (admin) — must have no screenings' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiResponse({ status: 404, description: 'Auditorium not found' })
  @ApiResponse({ status: 409, description: 'Auditorium still has screenings' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.auditoriums.remove(id);
  }

  @Post(':id/seats')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk-add seats to an auditorium (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Returns { created, restored }. Existing seats are skipped; soft-deleted seats with the same row/number are restored.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiResponse({ status: 404, description: 'Auditorium not found' })
  createSeats(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateSeatsDto) {
    return this.auditoriums.createSeats(id, dto);
  }

  @Get(':id/seats')
  @ApiOperation({ summary: 'List seats in an auditorium' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Array of seats' })
  @ApiResponse({ status: 404, description: 'Auditorium not found' })
  findSeats(@Param('id', ParseIntPipe) id: number) {
    return this.auditoriums.findSeats(id);
  }

  @Patch(':id/seats/:seatId/status')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle a seat ACTIVE/INACTIVE for maintenance (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'seatId', type: Number })
  @ApiResponse({ status: 200, description: 'Updated seat' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiResponse({ status: 404, description: 'Seat not found in this auditorium' })
  @ApiResponse({ status: 409, description: 'Cannot set INACTIVE while the seat has upcoming bookings' })
  updateSeatStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('seatId', ParseIntPipe) seatId: number,
    @Body() dto: UpdateSeatStatusDto,
  ) {
    return this.auditoriums.updateSeatStatus(id, seatId, dto);
  }

  @Delete(':id/seats/:seatId')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Soft-delete a seat that no longer exists physically (admin) — row is kept for booking history',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'seatId', type: Number })
  @ApiResponse({ status: 204, description: 'Seat marked DELETED' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiResponse({ status: 404, description: 'Seat not found in this auditorium' })
  @ApiResponse({ status: 409, description: 'Seat has upcoming bookings' })
  removeSeat(
    @Param('id', ParseIntPipe) id: number,
    @Param('seatId', ParseIntPipe) seatId: number,
  ) {
    return this.auditoriums.removeSeat(id, seatId);
  }

  @Delete(':id/seats')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete all seats in an auditorium (admin) — blocked by upcoming bookings' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Returns { deleted: number }' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiResponse({ status: 404, description: 'Auditorium not found' })
  @ApiResponse({ status: 409, description: 'Seats have upcoming bookings' })
  clearSeats(@Param('id', ParseIntPipe) id: number) {
    return this.auditoriums.clearSeats(id);
  }
}
