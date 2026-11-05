import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  screeningId: number;

  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  seatIds: number[];
}
