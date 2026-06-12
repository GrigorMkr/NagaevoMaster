import axios from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? 'Произошла ошибка при запросе'
    return Promise.reject(new Error(message))
  },
)
