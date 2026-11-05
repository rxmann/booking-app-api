export interface SuccessResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  timestamp: string;
}
