// Authentication types

export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  first_name: string
  last_name: string
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    user: User
    token: string
  }
}
