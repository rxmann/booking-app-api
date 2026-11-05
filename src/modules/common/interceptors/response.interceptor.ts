import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, type Observable } from 'rxjs';
import type { SuccessResponse } from '../types/success-response.type.js';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<SuccessResponse<T>> {
    const statusCode = context.switchToHttp().getResponse<Response>().statusCode;

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        statusCode,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
