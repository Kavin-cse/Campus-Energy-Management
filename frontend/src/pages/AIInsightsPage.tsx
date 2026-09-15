import { useState } from 'react'
import { Brain, Play, AlertTriangle, Clock, Zap, RefreshCw, CheckCircle, Eye, Filter } from 'lucide-react'
import { Card, Button, Badge, Spinner, EmptyState, Select } from '@/components/ui'
import { useRecommendations } from '@/hooks/useApi'
import { aiApi } from '@/services/api'
import type { Recommendation, RecommendationStatus } from '@/types'
import { toast } from 'sonner'

const PATTERN_ICONS: Record<string, typeof AlertTriangle> = {
  off_hours: Clock,
  idle: Zap,
  spike: AlertTriangle,
  repeated_waste: RefreshCw,
}

const PATTERN_LABELS: Record<string, string> = {
  off_hours: 'Off-Hours',
  idle: 'Idle Room',
  spike: 'Usage Spike',
  repeated_waste: 'Recurring Waste',
}

const STATUS_BADGE: Record<string, { color: 'amber' | 'blue' | 'emerald'; label: string }> = {
  pending: { color: 'amber', label: 'Pending' },
  reviewed: { color: 'blue', label: 'Reviewed' },
  resolved: { color: 'emerald', label: 'Resolved' },
}

export function AIInsightsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data: recs, loading, refetch } = useRecommendations(statusFilter || undefined)
  const [analyzing, setAnalyzing] = useState(false)

  const runAnalysis = async () => {
    setAnalyzing(true)
    try {
      const result = await aiApi.analyze()
      toast.success(`Analysis complete: ${result.count} recommendations generated`)
      refetch()
    } catch (err: any) {
      toast.error(err.message)
    }
    setAnalyzing(false)
  }

  const updateStatus = async (id: number, status: RecommendationStatus) => {
    try {
      await aiApi.updateStatus(id, status)
      toast.success('Status updated')
      refetch()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const highCount = recs?.filter(r => r.priority === 'high').length || 0
  const mediumCount = recs?.filter(r => r.priority === 'medium').length || 0
  const totalWaste = recs?.reduce((s, r) => s + r.estimated_waste_kwh, 0) || 0
  const totalSavings = recs?.reduce((s, r) => s + r.estimated_savings_inr, 0) || 0

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" /> AI Energy Insights
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pattern analysis and energy-saving recommendations</p>
        </div>
        <Button icon={Play} onClick={runAnalysis} loading={analyzing}>
          {analyzing ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Alerts</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{recs?.length || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">High Priority</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{highCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waste Detected</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{totalWaste.toFixed(0)} kWh</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Potential Savings</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{totalSavings.toFixed(0)}</p>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All Statuses"
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'reviewed', label: 'Reviewed' },
            { value: 'resolved', label: 'Resolved' },
          ]}
        />
      </div>

      {/* Recommendations List */}
      {loading ? (
        <Spinner />
      ) : !recs || recs.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No recommendations yet"
          description="Run the AI analysis to detect energy waste patterns and generate recommendations."
          action={<Button icon={Play} onClick={runAnalysis}>Run Analysis</Button>}
        />
      ) : (
        <div className="space-y-4">
          {recs.map(rec => {
            const PatternIcon = PATTERN_ICONS[rec.pattern_type] || AlertTriangle
            const sb = STATUS_BADGE[rec.status] || STATUS_BADGE.pending
            return (
              <Card key={rec.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    rec.priority === 'high' ? 'bg-rose-100 dark:bg-rose-500/10' :
                    rec.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-500/10' :
                    'bg-emerald-100 dark:bg-emerald-500/10'
                  }`}>
                    <PatternIcon className={`w-5 h-5 ${
                      rec.priority === 'high' ? 'text-rose-600 dark:text-rose-400' :
                      rec.priority === 'medium' ? 'text-amber-600 dark:text-amber-400' :
                      'text-emerald-600 dark:text-emerald-400'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{rec.title}</h3>
                      <Badge variant={rec.priority === 'high' ? 'rose' : rec.priority === 'medium' ? 'amber' : 'emerald'}>
                        {rec.priority}
                      </Badge>
                      <Badge variant={sb.color}>{sb.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{rec.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{rec.room_name} • {rec.building}</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">{rec.estimated_waste_kwh} kWh wasted</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">Save ₹{rec.estimated_savings_inr}</span>
                    </div>
                    <div className="mt-1">
                      <Badge variant="gray" size="sm">{PATTERN_LABELS[rec.pattern_type] || rec.pattern_type}</Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex gap-1">
                    {rec.status === 'pending' && (
                      <Button variant="ghost" size="sm" icon={Eye} onClick={() => updateStatus(rec.id, 'reviewed')}>
                        Review
                      </Button>
                    )}
                    {(rec.status === 'pending' || rec.status === 'reviewed') && (
                      <Button variant="ghost" size="sm" icon={CheckCircle} onClick={() => updateStatus(rec.id, 'resolved')}>
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
