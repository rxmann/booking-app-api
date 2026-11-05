import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayUnique, IsArray, IsInt } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 1, description: 'ID of the screening to book' })
  @IsInt()
  screeningId: number;

  @ApiProperty({ example: [4, 5, 6], description: 'Seat IDs to hold', type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  @ArrayUnique()
  seatIds: number[];
}
