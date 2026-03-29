import http from './http'
import axios from 'axios'

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  password: string
  name: string
  phone: string
  email: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface UserInfo {
  id: number
  username: string
  name: string
  phone: string | null
  email: string
  role: string
  is_active: boolean
}

export const authApi = {
  login: (params: LoginParams) =>
    axios.post<TokenResponse>('/api/v1/auth/login', params).then((r) => r.data),

  register: (params: RegisterParams) =>
    axios.post<UserInfo>('/api/v1/auth/register', params).then((r) => r.data),

  logout: () =>
    http.post<{ message: string }>('/api/v1/auth/logout').then((r) => r.data),

  getMe: () =>
    http.get<UserInfo>('/api/v1/users/me').then((r) => r.data),
}
