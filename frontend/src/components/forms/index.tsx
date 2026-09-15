import { useState, FormEvent } from 'react'
import { Button, Input, Select, Modal } from '@/components/ui'
import type { RoomCreate, RoomType, ElectricityReadingCreate, Room } from '@/types'
import { Upload, Plus } from 'lucide-react'

// ─── Room Form ───────────────────────────────────────────
const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: 'Classroom', label: 'Classroom' },
  { value: 'Computer Lab', label: 'Computer Lab' },
  { value: 'Physics Lab', label: 'Physics Lab' },
  { value: 'Electronics Lab', label: 'Electronics Lab' },
  { value: 'Chemistry Lab', label: 'Chemistry Lab' },
  { value: 'Other', label: 'Other' },
]

interface RoomFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: RoomCreate) => void
  loading?: boolean
  initial?: Partial<RoomCreate>
  title?: string
}

export function RoomForm({ open, onClose, onSubmit, loading, initial, title = 'Add New Room' }: RoomFormProps) {
  const [form, setForm] = useState<RoomCreate>({
    name: initial?.name || '',
    building: initial?.building || '',
    room_type: initial?.room_type || 'Classroom',
    capacity: initial?.capacity || 30,
    operating_start: initial?.operating_start || '08:00:00',
    operating_end: initial?.operating_end || '17:00:00',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Room Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Classroom 101" required />
        <Input label="Building" value={form.building} onChange={e => setForm(f => ({ ...f, building: e.target.value }))} placeholder="e.g. Engineering Block A" required />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Room Type</label>
            <Select value={form.room_type} onChange={v => setForm(f => ({ ...f, room_type: v as RoomType }))} options={ROOM_TYPES} />
          </div>
          <Input label="Capacity" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} min={0} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Operating Start" type="time" value={form.operating_start.slice(0, 5)} onChange={e => setForm(f => ({ ...f, operating_start: e.target.value + ':00' }))} required />
          <Input label="Operating End" type="time" value={form.operating_end.slice(0, 5)} onChange={e => setForm(f => ({ ...f, operating_end: e.target.value + ':00' }))} required />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/5">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" icon={Plus} loading={loading}>Save Room</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Reading Entry Form ──────────────────────────────────
interface ReadingFormProps {
  rooms: Room[]
  onSubmit: (data: ElectricityReadingCreate) => void
  loading?: boolean
  defaultRoomId?: number
}

export function ReadingForm({ rooms, onSubmit, loading, defaultRoomId }: ReadingFormProps) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<ElectricityReadingCreate>({
    room_id: defaultRoomId || (rooms[0]?.id ?? 0),
    date: today,
    start_time: '09:00:00',
    end_time: '13:00:00',
    energy_kwh: 0,
    occupancy_count: 0,
    is_occupied: false,
    notes: '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ ...form, is_occupied: form.occupancy_count > 0 })
  }

  const roomOptions = rooms.map(r => ({ value: String(r.id), label: `${r.name} — ${r.building}` }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Room / Lab</label>
        <Select value={String(form.room_id)} onChange={v => setForm(f => ({ ...f, room_id: +v }))} options={roomOptions} className="w-full" />
      </div>
      <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Start Time" type="time" value={form.start_time.slice(0, 5)} onChange={e => setForm(f => ({ ...f, start_time: e.target.value + ':00' }))} required />
        <Input label="End Time" type="time" value={form.end_time.slice(0, 5)} onChange={e => setForm(f => ({ ...f, end_time: e.target.value + ':00' }))} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Energy (kWh)" type="number" step="0.01" value={form.energy_kwh || ''} onChange={e => setForm(f => ({ ...f, energy_kwh: +e.target.value }))} min={0.01} required />
        <Input label="Occupancy Count" type="number" value={form.occupancy_count} onChange={e => setForm(f => ({ ...f, occupancy_count: +e.target.value }))} min={0} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes (optional)</label>
        <textarea
          value={form.notes || ''}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          rows={2}
          placeholder="e.g. Extra AC running for event"
        />
      </div>
      <Button type="submit" icon={Plus} loading={loading} className="w-full">Add Reading</Button>
    </form>
  )
}

// ─── CSV Upload ──────────────────────────────────────────
interface CSVUploadProps {
  onUpload: (file: File) => void
  loading?: boolean
}

export function CSVUpload({ onUpload, loading }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.csv')) setFile(f)
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
          dragOver
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5'
            : 'border-gray-300 dark:border-white/10 hover:border-emerald-400'
        }`}
      >
        <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
          {file ? file.name : 'Drag & drop a CSV file here'}
        </p>
        <p className="text-xs text-gray-400 mt-1">or click to browse</p>
        <input
          type="file"
          accept=".csv"
          onChange={e => e.target.files?.[0] && setFile(e.target.files[0])}
          className="absolute inset-0 opacity-0 cursor-pointer"
          style={{ position: 'relative' }}
        />
      </div>
      {file && (
        <Button onClick={() => onUpload(file)} loading={loading} icon={Upload} className="w-full">
          Import {file.name}
        </Button>
      )}
      <div className="text-xs text-gray-400 dark:text-gray-500">
        <p className="font-medium mb-1">Expected CSV columns:</p>
        <code className="text-[11px] bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">
          room_id, date, start_time, end_time, energy_kwh, occupancy_count, is_occupied, notes
        </code>
      </div>
    </div>
  )
}
