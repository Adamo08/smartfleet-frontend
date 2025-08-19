export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: Date;
}

export interface ApiError {
  status: number;
  message: string;
  timestamp: Date;
  path: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  rejectedValue?: any;
}
