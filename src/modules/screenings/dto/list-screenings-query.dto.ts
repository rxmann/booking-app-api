import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto.js';

export class ListScreeningsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Only screenings of this movie' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  movieId?: number;
}
