import { Module } from '@nestjs/common';
import { ScreeningsModule } from '../screenings/screenings.module.js';
import { MoviesController } from './movies.controller.js';
import { MoviesService } from './movies.service.js';

@Module({
  imports: [ScreeningsModule],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
