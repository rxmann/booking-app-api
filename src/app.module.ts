import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from './modules/config/config.module.js';
import { PrismaModule } from './modules/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { MoviesModule } from './modules/movies/movies.module.js';
import { ScreeningsModule } from './modules/screenings/screenings.module.js';
import { BookingsModule } from './modules/bookings/bookings.module.js';
import { TheatresModule } from './modules/theatres/theatres.module.js';
import { AuditoriumsModule } from './modules/auditoriums/auditoriums.module.js';
import { CommonModule } from './modules/common/common.module.js';

@Module({
  imports: [CommonModule, ConfigModule, PrismaModule, AuthModule, MoviesModule, ScreeningsModule, BookingsModule, TheatresModule, AuditoriumsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
