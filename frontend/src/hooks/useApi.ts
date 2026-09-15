import { useState, useEffect, useCallback } from 'react'
import { settingsApi, dashboardApi, roomsApi, readingsApi, analyticsApi, aiApi } from '@/services/api'
import type {
  Settings, DashboardSummary, DailyTrend, RoomConsumption, OffHoursData,
  Room, ElectricityReading, AnalyticsData, Recommendation,
} from '@/types'

// ─── Generic fetch hook ──────────────────────────────────
interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): UseApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<UseApiState<T>>({ data: null, loading: true, error: null })

  const refetch = useCallback(() => {
    setState(s => ({ ...s, loading: true, error: null }))
    fetcher()
      .then(data => setState({ data, loading: false, error: null }))
      .catch(err => setState({ data: null, loading: false, error: err.message }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { refetch() }, [refetch])

  return { ...state, refetch }
}

// ─── Typed hooks ─────────────────────────────────────────
export function useSettings() {
  return useApi<Settings>(() => settingsApi.get())
}

export function useDashboardSummary(startDate?: string, endDate?: string) {
  return useApi<DashboardSummary>(() => dashboardApi.summary(startDate, endDate), [startDate, endDate])
}

export function useDashboardTrends(startDate?: string, endDate?: string) {
  return useApi<DailyTrend[]>(() => dashboardApi.trends(startDate, endDate), [startDate, endDate])
}

export function useRoomBreakdown() {
  return useApi<RoomConsumption[]>(() => dashboardApi.roomBreakdown())
}

export function useOffHours() {
  return useApi<OffHoursData[]>(() => dashboardApi.offHours())
}

export function useRooms(building?: string, roomType?: string) {
  return useApi<Room[]>(() => roomsApi.list(building, roomType), [building, roomType])
}

export function useRoom(id: number) {
  return useApi<Room>(() => roomsApi.get(id), [id])
}

export function useReadings(roomId?: number, startDate?: string, endDate?: string) {
  return useApi<ElectricityReading[]>(() => readingsApi.list(roomId, startDate, endDate), [roomId, startDate, endDate])
}

export function useAnalytics(startDate?: string, endDate?: string) {
  return useApi<AnalyticsData>(() => analyticsApi.getAll(startDate, endDate), [startDate, endDate])
}

export function useRecommendations(status?: string, roomId?: number) {
  return useApi<Recommendation[]>(() => aiApi.recommendations(status as any, roomId), [status, roomId])
}
