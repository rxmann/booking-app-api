import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { SeatType } from '../enums/seat-type.enum.js';

export class SeatItemDto {
  @ApiProperty({ example: 'A', description: 'Row label (single uppercase letter)' })
  @IsString()
  @Length(1, 1)
  row: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  number: number;

  @ApiProperty({ enum: SeatType, example: SeatType.STANDARD })
  @IsEnum(SeatType)
  type: SeatType;
}

export class CreateSeatsDto {
  @ApiProperty({ type: () => [SeatItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SeatItemDto)
  seats: SeatItemDto[];
}
