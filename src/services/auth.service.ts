// Authentication service

import type { LoginRequest, SignupRequest, AuthResponse } from '../types/auth.types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export class AuthService {
  private static readonly TOKEN_KEY = 'auth_token'

  /**
   * Login user
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
    const data = await response.json()

    if (data.success && data.data?.token) {
      this.setToken(data.data.token)
    }

    return data
  }

  /**
   * Signup user
   */
  static async signup(userData: SignupRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
    const data = await response.json()

    if (data.success && data.data?.token) {
      this.setToken(data.data.token)
    }

    return data
  }

  /**
   * Logout user
   */
  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY)
  }

  /**
   * Get stored token
   */
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY)
  }

  /**
   * Set token
   */
  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token)
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.getToken() !== null
  }
}
