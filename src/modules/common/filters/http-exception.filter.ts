import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ErrorResponse } from '../types/error-response.type.js';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const body = exception.getResponse();

    const raw =
      typeof body === 'string'
        ? body
        : ((body as { message?: string | string[] }).message ?? exception.message);
    const messages = Array.isArray(raw) ? raw : [raw];

    const error: ErrorResponse = {
      success: false,
      statusCode: status,
      error: HttpStatus[status] ?? 'ERROR',
      message: messages.join(', '),
      ...(messages.length > 1 && { errors: messages }),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(error);
  }
}
