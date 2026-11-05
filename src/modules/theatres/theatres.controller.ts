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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { AuditoriumsService } from '../auditoriums/auditoriums.service.js';
import { CreateAuditoriumDto } from '../auditoriums/dto/create-auditorium.dto.js';
import { CreateTheatreDto } from './dto/create-theatre.dto.js';
import { UpdateTheatreDto } from './dto/update-theatre.dto.js';
import { TheatresService } from './theatres.service.js';

@ApiTags('Theatres')
@Controller('theatres')
export class TheatresController {
  constructor(
    private readonly theatres: TheatresService,
    private readonly auditoriums: AuditoriumsService,
  ) {}

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a theatre (admin)' })
  @ApiResponse({ status: 201, description: 'Theatre created with address' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  create(@Body() dto: CreateTheatreDto) {
    return this.theatres.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List theatres (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated theatres with address: { items, total, page, limit, totalPages }' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.theatres.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a theatre by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Theatre detail with address' })
  @ApiResponse({ status: 404, description: 'Theatre not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.theatres.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a theatre (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Updated theatre' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiResponse({ status: 404, description: 'Theatre not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTheatreDto) {
    return this.theatres.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a theatre (admin) — must have no auditoriums' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiResponse({ status: 404, description: 'Theatre not found' })
  @ApiResponse({ status: 409, description: 'Theatre still has auditoriums' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.theatres.remove(id);
  }

  @Get(':theatreId/auditoriums')
  @ApiOperation({ summary: 'List auditoriums in a theatre' })
  @ApiParam({ name: 'theatreId', type: Number })
  @ApiResponse({ status: 200, description: 'Array of auditoriums with seat count' })
  @ApiResponse({ status: 404, description: 'Theatre not found' })
  findAuditoriums(@Param('theatreId', ParseIntPipe) theatreId: number) {
    return this.auditoriums.findByTheatre(theatreId);
  }

  @Post(':theatreId/auditoriums')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add an auditorium to a theatre (admin)' })
  @ApiParam({ name: 'theatreId', type: Number })
  @ApiResponse({ status: 201, description: 'Auditorium created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  @ApiResponse({ status: 404, description: 'Theatre not found' })
  createAuditorium(
    @Param('theatreId', ParseIntPipe) theatreId: number,
    @Body() dto: CreateAuditoriumDto,
  ) {
    return this.auditoriums.create(theatreId, dto);
  }
}
