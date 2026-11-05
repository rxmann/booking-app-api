import type { OpenAPIObject } from '@nestjs/swagger';

const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
const JSON_TYPE = 'application/json';

// Mirrors ResponseInterceptor (success) and the exception filters (error) in the OpenAPI doc,
// so per-route @ApiResponse decorators only describe the payload and status.
export function applyResponseEnvelopes(document: OpenAPIObject): OpenAPIObject {
  document.components ??= {};
  document.components.schemas = {
    ...document.components.schemas,
    ErrorResponse: {
      type: 'object',
      required: ['success', 'statusCode', 'error', 'message', 'timestamp', 'path'],
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'integer', example: 404 },
        error: { type: 'string', example: 'NOT_FOUND' },
        message: { type: 'string', example: 'Movie #99 not found' },
        errors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Individual messages, present when there is more than one (e.g. validation)',
        },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string', example: '/api/v1/movies/99' },
      },
    },
  };

  for (const pathItem of Object.values(document.paths)) {
    for (const method of METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;

      if (operation.requestBody && !operation.responses['422']) {
        operation.responses['422'] = { description: 'Validation failed' };
      }

      for (const [status, response] of Object.entries(operation.responses)) {
        if (!response || '$ref' in response) continue;
        const code = Number(status);

        if (code >= 400) {
          response.content = {
            [JSON_TYPE]: { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          };
        } else if (code >= 200 && code < 300 && code !== 204) {
          const payload = response.content?.[JSON_TYPE]?.schema ?? {
            description: response.description,
          };
          response.content = {
            [JSON_TYPE]: {
              schema: {
                type: 'object',
                required: ['success', 'statusCode', 'data', 'timestamp'],
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'integer', example: code },
                  data: payload,
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          };
        }
      }
    }
  }

  return document;
}
