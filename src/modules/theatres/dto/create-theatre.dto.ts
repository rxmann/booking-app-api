import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, MinLength, ValidateNested } from 'class-validator';
import { CreateAddressDto } from './create-address.dto.js';

export class CreateTheatreDto {
  @ApiProperty({ example: 'QFX Civil Mall' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ type: () => CreateAddressDto })
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;
}
