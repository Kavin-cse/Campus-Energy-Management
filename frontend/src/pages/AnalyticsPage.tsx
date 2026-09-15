import { useState } from 'react'
import { Card, Spinner, Select } from '@/components/ui'
import { ConsumptionTrendChart, RoomBreakdownChart, PeakHoursChart, OffHoursChart, OccupancyPieChart } from '@/components/charts'
import { useAnalytics } from '@/hooks/useApi'
import { BarChart3 } from 'lucide-react'

export function AnalyticsPage() {
  const [range, setRange] = useState('30')
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - Number(range) * 86400000).toISOString().split('T')[0]
  const { data, loading } = useAnalytics(startDate, endDate)

  if (loading) return <Spinner />

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-500" /> Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Deep dive into campus energy patterns</p>
        </div>
        <Select
          value={range}
          onChange={setRange}
          options={[
            { value: '7', label: 'Last 7 days' },
            { value: '14', label: 'Last 14 days' },
            { value: '30', label: 'Last 30 days' },
            { value: '90', label: 'Last 90 days' },
          ]}
        />
      </div>

      {data && (
        <>
          {/* Consumption Trends */}
          {data.trends.length > 0 && <ConsumptionTrendChart data={data.trends} />}

          {/* Row: Room Comparison + Occupancy */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {data.room_comparison.length > 0 && <RoomBreakdownChart data={data.room_comparison} />}
            </div>
            {data.occupancy && <OccupancyPieChart data={data.occupancy} />}
          </div>

          {/* Row: Peak Hours + Off Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.peak_hours.length > 0 && <PeakHoursChart data={data.peak_hours} />}
            {data.off_hours.length > 0 && <OffHoursChart data={data.off_hours} />}
          </div>

          {/* Room Comparison Table */}
          {data.room_comparison.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Room-wise Comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-white/5 text-xs text-gray-500 dark:text-gray-400 uppercase">
                      <th className="text-left px-5 py-3 font-medium">Room</th>
                      <th className="text-left px-5 py-3 font-medium">Building</th>
                      <th className="text-left px-5 py-3 font-medium">Type</th>
                      <th className="text-right px-5 py-3 font-medium">Total kWh</th>
                      <th className="text-right px-5 py-3 font-medium">Waste kWh</th>
                      <th className="text-right px-5 py-3 font-medium">Waste Score</th>
                      <th className="text-right px-5 py-3 font-medium">Readings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {data.room_comparison.map(r => (
                      <tr key={r.room_id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{r.room_name}</td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{r.building}</td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{r.room_type}</td>
                        <td className="px-5 py-3 text-right text-gray-900 dark:text-white">{r.total_consumption_kwh}</td>
                        <td className="px-5 py-3 text-right text-amber-600 dark:text-amber-400">{r.waste_kwh}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-bold ${
                            r.waste_score > 60 ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                            : r.waste_score > 30 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                          }`}>{r.waste_score}</span>
                        </td>
                        <td className="px-5 py-3 text-right text-gray-500">{r.reading_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
