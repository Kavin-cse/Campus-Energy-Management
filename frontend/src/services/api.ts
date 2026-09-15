import type {
  Room, RoomCreate, RoomUpdate,
  ElectricityReading, ElectricityReadingCreate,
  Recommendation, RecommendationStatus,
  Settings, SettingsUpdate,
  DashboardSummary, DailyTrend, RoomConsumption, OffHoursData,
  AnalyticsData, AIAnalysisResponse, CSVImportResponse,
} from '@/types'

const BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ─── Rooms ───────────────────────────────────────────────
export const roomsApi = {
  list: (building?: string, roomType?: string) => {
    const params = new URLSearchParams()
    if (building) params.set('building', building)
    if (roomType) params.set('room_type', roomType)
    const qs = params.toString()
    return request<Room[]>(`/rooms/${qs ? `?${qs}` : ''}`)
  },
  get: (id: number) => request<Room>(`/rooms/${id}`),
  create: (data: RoomCreate) => request<Room>('/rooms/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: RoomUpdate) => request<Room>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/rooms/${id}`, { method: 'DELETE' }),
}

// ─── Readings ────────────────────────────────────────────
export const readingsApi = {
  list: (roomId?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (roomId) params.set('room_id', String(roomId))
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    const qs = params.toString()
    return request<ElectricityReading[]>(`/readings/${qs ? `?${qs}` : ''}`)
  },
  create: (data: ElectricityReadingCreate) =>
    request<ElectricityReading>('/readings/', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/readings/${id}`, { method: 'DELETE' }),
  importCSV: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${BASE}/readings/import`, { method: 'POST', body: formData })
    if (!res.ok) throw new Error('Import failed')
    return res.json() as Promise<CSVImportResponse>
  },
}

// ─── Dashboard ───────────────────────────────────────────
export const dashboardApi = {
  summary: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    const qs = params.toString()
    return request<DashboardSummary>(`/dashboard/summary${qs ? `?${qs}` : ''}`)
  },
  trends: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    const qs = params.toString()
    return request<DailyTrend[]>(`/dashboard/trends${qs ? `?${qs}` : ''}`)
  },
  roomBreakdown: () => request<RoomConsumption[]>('/dashboard/room-breakdown'),
  offHours: () => request<OffHoursData[]>('/dashboard/off-hours'),
}

// ─── Analytics ───────────────────────────────────────────
export const analyticsApi = {
  getAll: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    const qs = params.toString()
    return request<AnalyticsData>(`/analytics/${qs ? `?${qs}` : ''}`)
  },
}

// ─── AI ──────────────────────────────────────────────────
export const aiApi = {
  analyze: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    const qs = params.toString()
    return request<AIAnalysisResponse>(`/ai/analyze${qs ? `?${qs}` : ''}`, { method: 'POST' })
  },
  recommendations: (status?: RecommendationStatus, roomId?: number) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (roomId) params.set('room_id', String(roomId))
    const qs = params.toString()
    return request<Recommendation[]>(`/ai/recommendations${qs ? `?${qs}` : ''}`)
  },
  updateStatus: (id: number, status: RecommendationStatus) =>
    request<Recommendation>(`/ai/recommendations/${id}?status=${status}`, { method: 'PATCH' }),
}

// ─── Settings ────────────────────────────────────────────
export const settingsApi = {
  get: () => request<Settings>('/settings/'),
  update: (data: SettingsUpdate) => request<Settings>('/settings/', { method: 'PUT', body: JSON.stringify(data) }),
}
