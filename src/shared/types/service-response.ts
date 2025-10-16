export interface ServiceResponse<T> {
  status: number;
  message: string;
  data: T | null;
}