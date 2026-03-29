import axios, { AxiosError } from 'axios'
import { token } from '@/utils/token'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 10000,
})

// Attach access token to every request
http.interceptors.request.use((config) => {
  const t = token.getAccess()
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

// Handle 401: try refresh once, then redirect to login
let isRefreshing = false
let queue: Array<(t: string) => void> = []

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config!
    if (error.response?.status !== 401 || (original as { _retry?: boolean })._retry) {
      return Promise.reject(error)
    }

    const refreshToken = token.getRefresh()
    if (!refreshToken) {
      token.clear()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((newToken) => {
          original.headers!.Authorization = `Bearer ${newToken}`
          resolve(http(original))
        })
      })
    }

    ;(original as { _retry?: boolean })._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post('/api/v1/auth/refresh', { refresh_token: refreshToken })
      const newAccess: string = data.access_token
      token.setAccess(newAccess)
      queue.forEach((cb) => cb(newAccess))
      queue = []
      original.headers!.Authorization = `Bearer ${newAccess}`
      return http(original)
    } catch {
      token.clear()
      window.location.href = '/login'
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

export default http
