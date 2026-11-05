import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception.js';

export class ResourceNotFoundException extends AppException {
  constructor(resource: string, id?: number | string) {
    super(
      id === undefined ? `${resource} not found` : `${resource} #${id} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}
