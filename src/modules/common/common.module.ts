import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/all-exceptions.filter.js';
import { HttpExceptionFilter } from './filters/http-exception.filter.js';
import { PrismaExceptionFilter } from './filters/prisma-exception.filter.js';
import { ResponseInterceptor } from './interceptors/response.interceptor.js';
import { AppValidationPipe } from './pipes/validation.pipe.js';

@Module({
  providers: [
    { provide: APP_PIPE, useValue: AppValidationPipe },
    // Order matters: Nest checks global filters last-registered first, so the catch-all goes first.
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class CommonModule {}
