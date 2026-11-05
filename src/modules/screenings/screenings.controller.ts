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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { CreateScreeningDto } from './dto/create-screening.dto.js';
import { ListScreeningsQueryDto } from './dto/list-screenings-query.dto.js';
import { UpdateScreeningDto } from './dto/update-screening.dto.js';
import { ScreeningsService } from './screenings.service.js';

@ApiTags('Screenings')
@Controller('screenings')
export class ScreeningsController {
  constructor(private readonly screenings: ScreeningsService) {}

  @Get()
  @ApiOperation({ summary: 'List screenings (paginated), optionally filtered by movie' })
  @ApiResponse({ status: 200, description: 'Paginated screenings: { items, total, page, limit, totalPages }' })
  findAll(@Query() query: ListScreeningsQueryDto) {
    return this.screenings.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a screening by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Screening detail' })
  @ApiResponse({ status: 404, description: 'Screening not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.screenings.findOne(id);
  }

  @Get(':id/seats')
  @ApiOperation({ summary: 'List seats for a screening with availability status' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Array of seats with available flag' })
  @ApiResponse({ status: 404, description: 'Screening not found' })
  findSeats(@Param('id', ParseIntPipe) id: number) {
    return this.screenings.findSeats(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a screening (admin)' })
  @ApiResponse({ status: 201, description: 'Screening created' })
  @ApiResponse({ status: 400, description: 'startsAt must be before endsAt' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiResponse({ status: 409, description: 'Auditorium already booked in this time slot' })
  create(@Body() dto: CreateScreeningDto) {
    return this.screenings.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a screening (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Updated screening' })
  @ApiResponse({ status: 400, description: 'startsAt must be before endsAt' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiResponse({ status: 404, description: 'Screening not found' })
  @ApiResponse({ status: 409, description: 'Auditorium already booked in this time slot' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateScreeningDto) {
    return this.screenings.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a screening (admin) — must have no bookings' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiResponse({ status: 404, description: 'Screening not found' })
  @ApiResponse({ status: 409, description: 'Screening has existing bookings' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.screenings.remove(id);
  }
}
