import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { DailyTrend, RoomConsumption, PeakHourData, OffHoursData, OccupancyComparison } from '@/types'
import { Card } from '@/components/ui'

const EMERALD = '#10b981'
const TEAL = '#14b8a6'
const AMBER = '#f59e0b'
const ROSE = '#f43f5e'
const BLUE = '#3b82f6'
const PURPLE = '#8b5cf6'
const COLORS = [EMERALD, TEAL, BLUE, AMBER, PURPLE, ROSE, '#06b6d4', '#ec4899']

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(15, 23, 42, 0.95)',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    fontSize: '13px',
    color: '#e2e8f0',
  },
  itemStyle: { color: '#e2e8f0' },
  labelStyle: { color: '#94a3b8', marginBottom: '4px' },
}

// ─── Consumption Trend Chart ─────────────────────────────
export function ConsumptionTrendChart({ data }: { data: DailyTrend[] }) {
  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    useful_kwh: +(d.total_kwh - d.waste_kwh).toFixed(1),
  }))

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Consumption Trends</h3>
      <div className="h-72">
        <ResponsiveContainer>
          <AreaChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={EMERALD} stopOpacity={0.3} />
                <stop offset="100%" stopColor={EMERALD} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={AMBER} stopOpacity={0.3} />
                <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" unit=" kWh" />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="useful_kwh" name="Useful" stroke={EMERALD} fill="url(#gradGreen)" strokeWidth={2} />
            <Area type="monotone" dataKey="waste_kwh" name="Waste" stroke={AMBER} fill="url(#gradAmber)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

// ─── Room Breakdown Chart ────────────────────────────────
export function RoomBreakdownChart({ data }: { data: RoomConsumption[] }) {
  const top8 = data.slice(0, 8)

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Consumption by Room</h3>
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={top8} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" unit=" kWh" />
            <YAxis type="category" dataKey="room_name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={120} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="total_consumption_kwh" name="Total kWh" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {top8.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

// ─── Peak Hours Chart ────────────────────────────────────
export function PeakHoursChart({ data }: { data: PeakHourData[] }) {
  const formatted = data.map(d => ({
    ...d,
    label: `${d.hour.toString().padStart(2, '0')}:00`,
  }))

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Peak Hours Distribution</h3>
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#94a3b8" interval={2} />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" unit=" kWh" />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="total_kwh" name="Energy (kWh)" radius={[4, 4, 0, 0]} maxBarSize={24}>
              {formatted.map((d, i) => (
                <Cell key={i} fill={d.hour >= 9 && d.hour < 17 ? EMERALD : d.total_kwh > 0 ? AMBER : '#374151'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

// ─── Off-Hours Waste Chart ───────────────────────────────
export function OffHoursChart({ data }: { data: OffHoursData[] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Off-Hours Energy Waste</h3>
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" unit="%" />
            <YAxis type="category" dataKey="room_name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={120} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="waste_percentage" name="Waste %" radius={[0, 6, 6, 0]} maxBarSize={24}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.waste_percentage > 30 ? ROSE : d.waste_percentage > 15 ? AMBER : EMERALD} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

// ─── Occupancy Pie Chart ─────────────────────────────────
export function OccupancyPieChart({ data }: { data: OccupancyComparison }) {
  const pieData = [
    { name: 'Occupied', value: data.occupied_kwh, color: EMERALD },
    { name: 'Unoccupied', value: data.unoccupied_kwh, color: ROSE },
  ]

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Occupied vs Unoccupied</h3>
      <div className="h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" strokeWidth={0}>
              {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-2">
        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.occupied_percentage}%</span>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">utilized when occupied</span>
      </div>
    </Card>
  )
}

// ─── Waste Score Gauge ───────────────────────────────────
export function WasteScoreGauge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const color = score > 60 ? 'text-rose-500' : score > 30 ? 'text-amber-500' : 'text-emerald-500'
  const bg = score > 60 ? 'bg-rose-100 dark:bg-rose-500/10' : score > 30 ? 'bg-amber-100 dark:bg-amber-500/10' : 'bg-emerald-100 dark:bg-emerald-500/10'
  const dim = size === 'sm' ? 'w-10 h-10 text-sm' : 'w-14 h-14 text-lg'

  return (
    <div className={`${dim} rounded-full ${bg} flex items-center justify-center font-bold ${color}`}>
      {score}
    </div>
  )
}
