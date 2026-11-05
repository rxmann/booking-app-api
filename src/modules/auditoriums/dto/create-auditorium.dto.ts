import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateAuditoriumDto {
  @ApiProperty({ example: 'Hall A' })
  @IsString()
  @MinLength(1)
  name: string;
}
