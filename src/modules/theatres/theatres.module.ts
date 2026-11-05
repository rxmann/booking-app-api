import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AuditoriumsModule } from '../auditoriums/auditoriums.module.js';
import { TheatresController } from './theatres.controller.js';
import { TheatresService } from './theatres.service.js';

@Module({
  imports: [AuthModule, AuditoriumsModule],
  controllers: [TheatresController],
  providers: [TheatresService],
})
export class TheatresModule {}
