import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AuditoriumsController } from './auditoriums.controller.js';
import { AuditoriumsService } from './auditoriums.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AuditoriumsController],
  providers: [AuditoriumsService],
  exports: [AuditoriumsService],
})
export class AuditoriumsModule {}
