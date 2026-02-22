// User and Authentication Models
export interface User {
  userId: string;
  role: 'admin' | 'student' | 'department' | 'verifier';
  name?: string;
  department?: string;
  email?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  role: 'department' | 'verifier';
  department?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    user: {
      id?: string;
      userId?: string;
      username?: string;
      email: string;
      role: 'admin' | 'student' | 'department' | 'verifier';
      name: string;
      department?: string;
    };
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
