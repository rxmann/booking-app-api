import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @MinLength(1)
  line1: string;

  @ApiPropertyOptional({ example: 'Suite 4B' })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty({ example: 'Kathmandu' })
  @IsString()
  @MinLength(1)
  city: string;

  @ApiPropertyOptional({ example: 'Bagmati' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: 'Nepal' })
  @IsString()
  @MinLength(1)
  country: string;

  @ApiProperty({ example: '44600' })
  @IsString()
  @MinLength(1)
  postalCode: string;
}
