import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';

class UpdateAddressDto {
  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  line1?: string;

  @ApiPropertyOptional({ example: 'Suite 4B' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiPropertyOptional({ example: 'Kathmandu' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  city?: string;

  @ApiPropertyOptional({ example: 'Bagmati' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'Nepal' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  country?: string;

  @ApiPropertyOptional({ example: '44600' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  postalCode?: string;
}

export class UpdateTheatreDto {
  @ApiPropertyOptional({ example: 'QFX Civil Mall' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ type: () => UpdateAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  address?: UpdateAddressDto;
}
