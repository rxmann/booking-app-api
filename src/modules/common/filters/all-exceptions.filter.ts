import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ErrorResponse } from '../types/error-response.type.js';

// Last-resort filter for anything that is not an HttpException or a known Prisma error.
// The real error is logged; the client only ever sees a generic 500.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.error(
      exception instanceof Error ? exception.message : String(exception),
      exception instanceof Error ? exception.stack : undefined,
    );

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const error: ErrorResponse = {
      success: false,
      statusCode: status,
      error: HttpStatus[status],
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(error);
  }
}
