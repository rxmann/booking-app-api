import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ScreeningsController } from './screenings.controller.js';
import { ScreeningsService } from './screenings.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ScreeningsController],
  providers: [ScreeningsService],
  exports: [ScreeningsService],
})
export class ScreeningsModule {}
