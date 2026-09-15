// ─── Enums ───────────────────────────────────────────────
export type RoomType =
  | 'Classroom'
  | 'Computer Lab'
  | 'Physics Lab'
  | 'Electronics Lab'
  | 'Chemistry Lab'
  | 'Other'

export type RecommendationStatus = 'pending' | 'reviewed' | 'resolved'
export type Priority = 'high' | 'medium' | 'low'
export type PatternType = 'off_hours' | 'idle' | 'spike' | 'repeated_waste' | 'high_consumption'

// ─── Room ────────────────────────────────────────────────
export interface Room {
  id: number
  name: string
  building: string
  room_type: RoomType
  capacity: number
  operating_start: string // HH:MM:SS
  operating_end: string
  created_at: string
}

export interface RoomCreate {
  name: string
  building: string
  room_type: RoomType
  capacity: number
  operating_start: string
  operating_end: string
}

export interface RoomUpdate {
  name?: string
  building?: string
  room_type?: RoomType
  capacity?: number
  operating_start?: string
  operating_end?: string
}

// ─── Electricity Reading ─────────────────────────────────
export interface ElectricityReading {
  id: number
  room_id: number
  date: string // YYYY-MM-DD
  start_time: string
  end_time: string
  energy_kwh: number
  occupancy_count: number
  is_occupied: boolean
  notes: string | null
  created_at: string
}

export interface ElectricityReadingCreate {
  room_id: number
  date: string
  start_time: string
  end_time: string
  energy_kwh: number
  occupancy_count: number
  is_occupied: boolean
  notes?: string
}

// ─── Recommendation ──────────────────────────────────────
export interface Recommendation {
  id: number
  room_id: number
  room_name: string
  building: string
  title: string
  description: string
  pattern_type: PatternType
  priority: Priority
  estimated_waste_kwh: number
  estimated_savings_inr: number
  status: RecommendationStatus
  evidence: string
  created_at: string
}

// ─── Settings ────────────────────────────────────────────
export interface Settings {
  id: number
  campus_name: string
  tariff_per_kwh: number
  default_operating_start: string | null
  default_operating_end: string | null
  ai_off_hours_threshold: number
  ai_idle_threshold: number
  ai_spike_multiplier: number
  updated_at: string
}

export interface SettingsUpdate {
  campus_name?: string
  tariff_per_kwh?: number
  default_operating_start?: string | null
  default_operating_end?: string | null
  ai_off_hours_threshold?: number
  ai_idle_threshold?: number
  ai_spike_multiplier?: number
}

// ─── Dashboard ───────────────────────────────────────────
export interface DashboardSummary {
  total_consumption_kwh: number
  estimated_waste_kwh: number
  estimated_cost_inr: number
  rooms_monitored: number
  active_alerts: number
  campus_name: string
  date_range: { start: string; end: string }
}

export interface RoomConsumption {
  room_id: number
  room_name: string
  building: string
  room_type: string
  total_consumption_kwh: number
  waste_kwh: number
  waste_score: number
  reading_count: number
}

export interface DailyTrend {
  date: string
  total_kwh: number
  waste_kwh: number
  cost_inr: number
}

export interface OffHoursData {
  room_id: number
  room_name: string
  building: string
  off_hours_kwh: number
  total_kwh: number
  waste_percentage: number
}

// ─── Analytics ───────────────────────────────────────────
export interface PeakHourData {
  hour: number
  total_kwh: number
  reading_count: number
}

export interface OccupancyComparison {
  occupied_kwh: number
  unoccupied_kwh: number
  occupied_percentage: number
}

export interface AnalyticsData {
  trends: DailyTrend[]
  room_comparison: RoomConsumption[]
  peak_hours: PeakHourData[]
  off_hours: OffHoursData[]
  occupancy: OccupancyComparison
}

// ─── CSV Import ──────────────────────────────────────────
export interface CSVImportResponse {
  success: boolean
  imported: number
  errors: string[]
  message: string
}

// ─── AI Analysis ─────────────────────────────────────────
export interface AIAnalysisResponse {
  recommendations: Recommendation[]
  count: number
}
