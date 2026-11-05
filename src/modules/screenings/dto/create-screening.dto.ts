import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsPositive, Min } from 'class-validator';

export class CreateScreeningDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  movieId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  auditoriumId: number;

  @ApiProperty({ example: '2026-12-01T14:00:00.000Z' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ example: '2026-12-01T16:30:00.000Z' })
  @IsDateString()
  endsAt: string;

  @ApiProperty({ example: 350.00, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;
}
