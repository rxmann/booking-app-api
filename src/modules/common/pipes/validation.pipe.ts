import {
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

export const AppValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
  exceptionFactory: (errors: ValidationError[]) =>
    new UnprocessableEntityException({ message: flattenErrors(errors) }),
});

function flattenErrors(errors: ValidationError[], parent = ''): string[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;

    if (error.children?.length) {
      return flattenErrors(error.children, field);
    }

    return Object.values(error.constraints ?? {}).map((msg) => `${field}: ${msg}`);
  });
}
