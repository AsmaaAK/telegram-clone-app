import axios from 'axios'

function normalizeApiBase(raw) {
  const fallback = 'http://localhost:4000/api'
  let url = (raw || fallback).trim()
  if (!url) return fallback
  // remove trailing slash
  if (url.endsWith('/')) url = url.slice(0, -1)
  // ensure it ends with /api
  if (!/\/api$/.test(url)) url = `${url}/api`
  return url
}

const baseURL = normalizeApiBase(import.meta.env?.VITE_API_BASE)
const api = axios.create({ baseURL })

if (import.meta.env?.DEV) {
  // eslint-disable-next-line no-console
  console.info('[API] Base URL:', baseURL)
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  // Set Content-Type only for non-FormData requests
  if (config.data && !(config.data instanceof FormData)) {
    config.headers = config.headers || {}
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

export default api