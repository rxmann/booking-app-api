import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto.js';
import { ScreeningsService } from '../screenings/screenings.service.js';
import { MoviesService } from './movies.service.js';

@ApiTags('Movies')
@Controller('movies')
export class MoviesController {
  constructor(
    private readonly movies: MoviesService,
    private readonly screenings: ScreeningsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List movies (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated movies: { items, total, page, limit, totalPages }' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.movies.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a movie by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Movie detail' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.movies.findOne(id);
  }

  @Get(':movieId/theatres')
  @ApiOperation({ summary: 'List theatres currently showing this movie' })
  @ApiParam({ name: 'movieId', type: Number })
  @ApiResponse({ status: 200, description: 'Array of theatres with address' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  findTheatres(@Param('movieId', ParseIntPipe) movieId: number) {
    return this.screenings.findTheatresForMovie(movieId);
  }

  @Get(':movieId/theatres/:theatreId/screenings')
  @ApiOperation({ summary: 'List screening timeslots for a movie at a specific theatre' })
  @ApiParam({ name: 'movieId', type: Number })
  @ApiParam({ name: 'theatreId', type: Number })
  @ApiResponse({ status: 200, description: 'Array of screenings with auditorium info' })
  @ApiResponse({ status: 404, description: 'Movie or theatre not found' })
  findScreenings(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Param('theatreId', ParseIntPipe) theatreId: number,
  ) {
    return this.screenings.findScreeningsForMovieAtTheatre(movieId, theatreId);
  }
}
