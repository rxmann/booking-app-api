import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception.js';

export class AuthException extends AppException {
  constructor(
    message = 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED | HttpStatus.FORBIDDEN = HttpStatus.UNAUTHORIZED,
  ) {
    super(message, status);
  }
}
