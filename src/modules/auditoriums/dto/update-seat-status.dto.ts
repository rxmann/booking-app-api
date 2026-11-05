import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { SeatStatus } from '../enums/seat-status.enum.js';

export class UpdateSeatStatusDto {
  @ApiProperty({
    enum: [SeatStatus.ACTIVE, SeatStatus.INACTIVE],
    example: SeatStatus.INACTIVE,
    description: 'INACTIVE blocks new bookings (maintenance); ACTIVE re-enables. Use DELETE to remove a seat.',
  })
  @IsIn([SeatStatus.ACTIVE, SeatStatus.INACTIVE])
  status: SeatStatus.ACTIVE | SeatStatus.INACTIVE;
}
