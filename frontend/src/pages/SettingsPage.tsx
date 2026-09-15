import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Save } from 'lucide-react'
import { Card, Button, Input, Spinner } from '@/components/ui'
import { useSettings } from '@/hooks/useApi'
import { settingsApi } from '@/services/api'
import type { SettingsUpdate } from '@/types'
import { toast } from 'sonner'

export function SettingsPage() {
  const { data: settings, loading, refetch } = useSettings()
  const [form, setForm] = useState<SettingsUpdate>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setForm({
        campus_name: settings.campus_name,
        tariff_per_kwh: settings.tariff_per_kwh,
        default_operating_start: settings.default_operating_start,
        default_operating_end: settings.default_operating_end,
        ai_off_hours_threshold: settings.ai_off_hours_threshold,
        ai_idle_threshold: settings.ai_idle_threshold,
        ai_spike_multiplier: settings.ai_spike_multiplier,
      })
    }
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    try {
      await settingsApi.update(form)
      toast.success('Settings saved')
      refetch()
    } catch (err: any) {
      toast.error(err.message)
    }
    setSaving(false)
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-gray-400" /> Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Configure campus and AI analysis parameters</p>
      </div>

      {/* Campus Settings */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Campus Configuration</h3>
        <div className="space-y-4">
          <Input
            label="Campus Name"
            value={form.campus_name || ''}
            onChange={e => setForm(f => ({ ...f, campus_name: e.target.value }))}
          />
          <Input
            label="Electricity Tariff (₹ per kWh)"
            type="number"
            step="0.5"
            value={form.tariff_per_kwh || ''}
            onChange={e => setForm(f => ({ ...f, tariff_per_kwh: +e.target.value }))}
            min={0}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Default Operating Start"
              type="time"
              value={(form.default_operating_start || '').slice(0, 5)}
              onChange={e => setForm(f => ({ ...f, default_operating_start: e.target.value + ':00' }))}
            />
            <Input
              label="Default Operating End"
              type="time"
              value={(form.default_operating_end || '').slice(0, 5)}
              onChange={e => setForm(f => ({ ...f, default_operating_end: e.target.value + ':00' }))}
            />
          </div>
        </div>
      </Card>

      {/* AI Settings */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">AI Analysis Thresholds</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Tune how aggressively the AI flags energy waste</p>
        <div className="space-y-4">
          <Input
            label="Off-Hours Threshold (kWh)"
            type="number"
            step="0.1"
            value={form.ai_off_hours_threshold || ''}
            onChange={e => setForm(f => ({ ...f, ai_off_hours_threshold: +e.target.value }))}
            min={0}
          />
          <p className="text-xs text-gray-400 -mt-2">Minimum kWh consumed outside operating hours to flag as waste</p>

          <Input
            label="Idle Threshold (kWh)"
            type="number"
            step="0.1"
            value={form.ai_idle_threshold || ''}
            onChange={e => setForm(f => ({ ...f, ai_idle_threshold: +e.target.value }))}
            min={0}
          />
          <p className="text-xs text-gray-400 -mt-2">Minimum kWh consumed in empty rooms to flag as waste</p>

          <Input
            label="Spike Multiplier"
            type="number"
            step="0.1"
            value={form.ai_spike_multiplier || ''}
            onChange={e => setForm(f => ({ ...f, ai_spike_multiplier: +e.target.value }))}
            min={1}
          />
          <p className="text-xs text-gray-400 -mt-2">Standard deviations above mean to classify as a spike (lower = more sensitive)</p>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button icon={Save} onClick={handleSave} loading={saving} size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  )
}
