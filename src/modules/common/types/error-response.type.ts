export interface ErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string;
  errors?: string[];
  timestamp: string;
  path: string;
}
