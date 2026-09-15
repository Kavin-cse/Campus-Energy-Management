import { useState } from 'react'
import { FileSpreadsheet, PenLine, CheckCircle } from 'lucide-react'
import { Card, Spinner } from '@/components/ui'
import { ReadingForm, CSVUpload } from '@/components/forms'
import { useRooms } from '@/hooks/useApi'
import { readingsApi } from '@/services/api'
import type { ElectricityReadingCreate } from '@/types'
import { toast } from 'sonner'

type Tab = 'manual' | 'csv'

export function DataEntryPage() {
  const { data: rooms, loading } = useRooms()
  const [tab, setTab] = useState<Tab>('manual')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [recentCount, setRecentCount] = useState(0)

  const handleManualSubmit = async (data: ElectricityReadingCreate) => {
    setSubmitLoading(true)
    try {
      await readingsApi.create(data)
      toast.success('Reading added successfully')
      setRecentCount(c => c + 1)
    } catch (err: any) {
      toast.error(err.message)
    }
    setSubmitLoading(false)
  }

  const handleCSVUpload = async (file: File) => {
    setSubmitLoading(true)
    try {
      const result = await readingsApi.importCSV(file)
      if (result.success) {
        toast.success(`Imported ${result.imported} readings`)
        if (result.errors.length > 0) {
          toast.warning(`${result.errors.length} rows had errors`)
        }
        setRecentCount(c => c + result.imported)
      } else {
        toast.error(result.message)
      }
    } catch (err: any) {
      toast.error(err.message)
    }
    setSubmitLoading(false)
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Data Entry</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Record electricity consumption readings for rooms and labs</p>
      </div>

      {recentCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{recentCount} reading(s) added in this session</span>
        </div>
      )}

      <div className="max-w-xl mx-auto">
        {/* Tab Switcher */}
        <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'manual'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <PenLine className="w-4 h-4" /> Manual Entry
          </button>
          <button
            onClick={() => setTab('csv')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'csv'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> CSV Import
          </button>
        </div>

        <Card className="p-6">
          {tab === 'manual' ? (
            rooms && rooms.length > 0 ? (
              <ReadingForm rooms={rooms} onSubmit={handleManualSubmit} loading={submitLoading} />
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">Add rooms first before entering readings.</p>
            )
          ) : (
            <CSVUpload onUpload={handleCSVUpload} loading={submitLoading} />
          )}
        </Card>
      </div>
    </div>
  )
}
