import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, Trash2, Edit, Clock, Users, Zap, Building2 } from 'lucide-react'
import { Card, Button, Badge, Spinner, EmptyState, Modal } from '@/components/ui'
import { ConsumptionTrendChart } from '@/components/charts'
import { useRoom, useReadings } from '@/hooks/useApi'
import { roomsApi, readingsApi } from '@/services/api'
import { RoomForm } from '@/components/forms'
import type { RoomCreate, DailyTrend } from '@/types'
import { toast } from 'sonner'

const TYPE_COLORS: Record<string, 'emerald' | 'blue' | 'purple' | 'amber' | 'teal'> = {
  'Classroom': 'emerald',
  'Computer Lab': 'blue',
  'Physics Lab': 'purple',
  'Electronics Lab': 'amber',
  'Chemistry Lab': 'teal',
}

export function RoomDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const roomId = Number(id)
  const { data: room, loading: roomLoading, refetch: refetchRoom } = useRoom(roomId)
  const { data: readings, loading: readingsLoading, refetch: refetchReadings } = useReadings(roomId)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [editLoading, setEditLoading] = useState(false)

  if (roomLoading || readingsLoading) return <Spinner />
  if (!room) return <EmptyState icon={Building2} title="Room not found" description="This room doesn't exist or has been deleted." />

  // Build daily trends from readings
  const dailyMap = new Map<string, { total: number; waste: number }>()
  readings?.forEach(r => {
    const existing = dailyMap.get(r.date) || { total: 0, waste: 0 }
    existing.total += r.energy_kwh
    if (!r.is_occupied || r.occupancy_count === 0) existing.waste += r.energy_kwh
    dailyMap.set(r.date, existing)
  })
  const trends: DailyTrend[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      total_kwh: +d.total.toFixed(2),
      waste_kwh: +d.waste.toFixed(2),
      cost_inr: +(d.total * 8.5).toFixed(2),
    }))

  const totalKwh = readings?.reduce((s, r) => s + r.energy_kwh, 0) || 0
  const totalReadings = readings?.length || 0

  const handleUpdate = async (data: RoomCreate) => {
    setEditLoading(true)
    try {
      await roomsApi.update(roomId, data)
      toast.success('Room updated')
      setShowEdit(false)
      refetchRoom()
    } catch (err: any) { toast.error(err.message) }
    setEditLoading(false)
  }

  const handleDelete = async () => {
    try {
      await roomsApi.delete(roomId)
      toast.success('Room deleted')
      navigate('/rooms')
    } catch (err: any) { toast.error(err.message) }
  }

  const handleDeleteReading = async (readingId: number) => {
    try {
      await readingsApi.delete(readingId)
      toast.success('Reading deleted')
      refetchReadings()
    } catch (err: any) { toast.error(err.message) }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/rooms')} icon={ArrowLeft}>Back</Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{room.name}</h1>
            <Badge variant={TYPE_COLORS[room.room_type] || 'gray' as any}>{room.room_type}</Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> {room.building}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Edit} onClick={() => setShowEdit(true)}>Edit</Button>
          <Button variant="danger" icon={Trash2} onClick={() => setShowDelete(true)}>Delete</Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Users className="w-5 h-5 mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{room.capacity}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Capacity</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="w-5 h-5 mx-auto text-teal-500 mb-1" />
          <p className="text-lg font-bold text-gray-900 dark:text-white">{room.operating_start?.slice(0, 5)} - {room.operating_end?.slice(0, 5)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Operating Hours</p>
        </Card>
        <Card className="p-4 text-center">
          <Zap className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalKwh.toFixed(0)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total kWh</p>
        </Card>
        <Card className="p-4 text-center">
          <Zap className="w-5 h-5 mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalReadings}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Readings</p>
        </Card>
      </div>

      {/* Trend Chart */}
      {trends.length > 0 && <ConsumptionTrendChart data={trends} />}

      {/* Readings Table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-white/5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Readings</h3>
        </div>
        {readings && readings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 text-xs text-gray-500 dark:text-gray-400 uppercase">
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="text-left px-5 py-3 font-medium">Time</th>
                  <th className="text-right px-5 py-3 font-medium">kWh</th>
                  <th className="text-right px-5 py-3 font-medium">Occupancy</th>
                  <th className="text-left px-5 py-3 font-medium">Notes</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {readings.slice(0, 20).map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3 text-gray-900 dark:text-white">{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{r.start_time?.slice(0, 5)} – {r.end_time?.slice(0, 5)}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-white">{r.energy_kwh}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={r.is_occupied ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}>{r.occupancy_count} {r.is_occupied ? '✓' : '—'}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{r.notes || '—'}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleDeleteReading(r.id)} className="text-gray-400 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-gray-400">No readings recorded yet.</div>
        )}
      </Card>

      {/* Edit Modal */}
      <RoomForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSubmit={handleUpdate}
        loading={editLoading}
        title="Edit Room"
        initial={{
          name: room.name,
          building: room.building,
          room_type: room.room_type,
          capacity: room.capacity,
          operating_start: room.operating_start,
          operating_end: room.operating_end,
        }}
      />

      {/* Delete Confirm */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Room" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete <strong>{room.name}</strong>? This will also delete all readings and recommendations for this room.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="danger" icon={Trash2} onClick={handleDelete}>Delete Room</Button>
        </div>
      </Modal>
    </div>
  )
}
