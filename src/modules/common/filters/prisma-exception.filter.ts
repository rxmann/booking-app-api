import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '../../../generated/prisma/client.js';
import type { ErrorResponse } from '../types/error-response.type.js';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.resolveError(exception);

    const error: ErrorResponse = {
      success: false,
      statusCode: status,
      error: HttpStatus[status] ?? 'ERROR',
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    const log = status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'error' : 'warn';
    this.logger[log](`Prisma ${exception.code}: ${exception.message}`);
    response.status(status).json(error);
  }

  private resolveError(exception: Prisma.PrismaClientKnownRequestError): {
    status: HttpStatus;
    message: string;
  } {
    switch (exception.code) {
      case 'P2001':
        return { status: HttpStatus.NOT_FOUND, message: 'Record not found' };
      case 'P2002': {
        const meta = exception.meta as { target?: unknown; modelName?: unknown } | undefined;
        if (Array.isArray(meta?.target)) {
          return {
            status: HttpStatus.CONFLICT,
            message: `Unique constraint violation on: ${meta.target.join(', ')}`,
          };
        }
        // Prisma 7 driver adapters omit meta.target and only report the model name.
        return {
          status: HttpStatus.CONFLICT,
          message:
            typeof meta?.modelName === 'string'
              ? `${meta.modelName} already exists`
              : 'Unique constraint violation',
        };
      }
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Related record not found or still referenced',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message:
            typeof exception.meta?.cause === 'string'
              ? exception.meta.cause
              : 'Record not found',
        };
      default:
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Database error' };
    }
  }
}
