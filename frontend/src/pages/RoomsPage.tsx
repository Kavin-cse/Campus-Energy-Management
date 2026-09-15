import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus, Search, Clock, Users } from 'lucide-react'
import { Card, Button, Badge, Spinner, EmptyState, Input, Select } from '@/components/ui'
import { RoomForm } from '@/components/forms'
import { useRooms } from '@/hooks/useApi'
import { roomsApi } from '@/services/api'
import type { RoomCreate, RoomType } from '@/types'
import { toast } from 'sonner'

const TYPE_COLORS: Record<string, 'emerald' | 'blue' | 'purple' | 'amber' | 'teal' | 'rose'> = {
  'Classroom': 'emerald',
  'Computer Lab': 'blue',
  'Physics Lab': 'purple',
  'Electronics Lab': 'amber',
  'Chemistry Lab': 'teal',
  'Other': 'gray' as any,
}

export function RoomsPage() {
  const { data: rooms, loading, refetch } = useRooms()
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const navigate = useNavigate()

  const handleCreate = async (data: RoomCreate) => {
    setFormLoading(true)
    try {
      await roomsApi.create(data)
      toast.success('Room added successfully')
      setShowForm(false)
      refetch()
    } catch (err: any) {
      toast.error(err.message)
    }
    setFormLoading(false)
  }

  if (loading) return <Spinner />

  const filtered = (rooms || []).filter(r => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.building.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || r.room_type === filterType
    return matchSearch && matchType
  })

  const buildings = [...new Set((rooms || []).map(r => r.building))]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Rooms & Labs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{rooms?.length || 0} rooms being monitored</p>
        </div>
        <Button icon={Plus} onClick={() => setShowForm(true)}>Add Room</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rooms or buildings..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          />
        </div>
        <Select value={filterType} onChange={setFilterType} placeholder="All Types" options={[
          { value: 'Classroom', label: 'Classroom' },
          { value: 'Computer Lab', label: 'Computer Lab' },
          { value: 'Physics Lab', label: 'Physics Lab' },
          { value: 'Electronics Lab', label: 'Electronics Lab' },
          { value: 'Chemistry Lab', label: 'Chemistry Lab' },
          { value: 'Other', label: 'Other' },
        ]} />
      </div>

      {/* Building Groups */}
      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No rooms found" description={search ? 'Try adjusting your search' : 'Add your first room to get started'} action={!search && <Button icon={Plus} onClick={() => setShowForm(true)}>Add Room</Button>} />
      ) : (
        <div className="space-y-6">
          {buildings.filter(b => filtered.some(r => r.building === b)).map(building => (
            <div key={building}>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" /> {building}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.filter(r => r.building === building).map(room => (
                  <Card key={room.id} hover onClick={() => navigate(`/rooms/${room.id}`)} className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">{room.name}</h4>
                        <Badge variant={TYPE_COLORS[room.room_type] || 'gray'} size="sm">{room.room_type}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {room.capacity}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {room.operating_start?.slice(0, 5)} — {room.operating_end?.slice(0, 5)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <RoomForm open={showForm} onClose={() => setShowForm(false)} onSubmit={handleCreate} loading={formLoading} />
    </div>
  )
}
