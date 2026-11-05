import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ScreeningsService } from '../screenings/screenings.service.js';
import { MoviesService } from './movies.service.js';

@Controller('movies')
export class MoviesController {
  constructor(
    private readonly movies: MoviesService,
    private readonly screenings: ScreeningsService,
  ) {}

  @Get()
  findAll() {
    return this.movies.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.movies.findOne(id);
  }

  @Get(':movieId/theatres')
  findTheatres(@Param('movieId', ParseIntPipe) movieId: number) {
    return this.screenings.findTheatresForMovie(movieId);
  }

  @Get(':movieId/theatres/:theatreId/screenings')
  findScreenings(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Param('theatreId', ParseIntPipe) theatreId: number,
  ) {
    return this.screenings.findScreeningsForMovieAtTheatre(movieId, theatreId);
  }
}
