import { Zap, TrendingDown, IndianRupee, Building2, AlertTriangle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, StatCard, Spinner, Badge } from '@/components/ui'
import { ConsumptionTrendChart, RoomBreakdownChart } from '@/components/charts'
import { useDashboardSummary, useDashboardTrends, useRoomBreakdown, useRecommendations } from '@/hooks/useApi'

export function DashboardPage() {
  const { data: summary, loading: summaryLoading } = useDashboardSummary()
  const { data: trends } = useDashboardTrends()
  const { data: rooms } = useRoomBreakdown()
  const { data: recs } = useRecommendations('pending')
  const navigate = useNavigate()

  if (summaryLoading) return <Spinner />

  const wastePercent = summary ? ((summary.estimated_waste_kwh / Math.max(summary.total_consumption_kwh, 1)) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8"
        style={{ background: 'linear-gradient(135deg, #065f46 0%, #0d9488 50%, #0e7490 100%)' }}>
        <div className="absolute inset-0 bg-[url(\'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==\')] opacity-50" />
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {summary?.campus_name || 'WattWise Campus'}
          </h1>
          <p className="text-emerald-100 mt-1 text-sm md:text-base">
            Monitoring {summary?.rooms_monitored || 0} rooms • {summary?.date_range?.start} to {summary?.date_range?.end}
          </p>
          {summary && Number(wastePercent) > 10 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>{wastePercent}% of energy is being wasted — AI has {summary.active_alerts} high-priority alerts</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Consumption" value={`${summary.total_consumption_kwh.toFixed(0)} kWh`} icon={Zap} color="emerald" subtitle="Last 30 days" />
          <StatCard label="Estimated Waste" value={`${summary.estimated_waste_kwh.toFixed(0)} kWh`} icon={TrendingDown} color="amber" subtitle={`${wastePercent}% of total`} />
          <StatCard label="Energy Cost" value={`₹${summary.estimated_cost_inr.toLocaleString('en-IN')}`} icon={IndianRupee} color="blue" subtitle="Electricity charges" />
          <StatCard label="Active Alerts" value={summary.active_alerts} icon={AlertTriangle} color={summary.active_alerts > 0 ? 'rose' : 'emerald'} subtitle="High priority" />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trends && trends.length > 0 && <ConsumptionTrendChart data={trends} />}
        {rooms && rooms.length > 0 && <RoomBreakdownChart data={rooms} />}
      </div>

      {/* Recent AI Recommendations */}
      {recs && recs.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Recommendations</h3>
            <button onClick={() => navigate('/ai-insights')} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recs.slice(0, 4).map(rec => (
              <div key={rec.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors cursor-pointer" onClick={() => navigate('/ai-insights')}>
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${rec.priority === 'high' ? 'bg-rose-500' : rec.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{rec.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{rec.room_name} • {rec.building}</p>
                </div>
                <Badge variant={rec.priority === 'high' ? 'rose' : rec.priority === 'medium' ? 'amber' : 'emerald'}>
                  {rec.priority}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
