import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { DashboardPage } from '@/pages/DashboardPage'
import { RoomsPage } from '@/pages/RoomsPage'
import { RoomDetailPage } from '@/pages/RoomDetailPage'
import { DataEntryPage } from '@/pages/DataEntryPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { AIInsightsPage } from '@/pages/AIInsightsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { IoTSimulatorPage } from '@/pages/IoTSimulatorPage'
import { IoTMonitoringPage } from '@/pages/IoTMonitoringPage'
import { IoTDeviceManagementPage } from '@/pages/IoTDeviceManagementPage'
import { OccupancyAnalyticsPage } from '@/pages/OccupancyAnalyticsPage'
import { useSettings } from '@/hooks/useApi'

function App() {
  const { data: settings } = useSettings()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.title = settings?.campus_name || 'WattWise Campus'
  }, [settings?.campus_name])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto p-4 md:p-6 max-w-7xl">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/iot-simulator" element={<IoTSimulatorPage />} />
              <Route path="/iot-monitor" element={<IoTMonitoringPage />} />
              <Route path="/iot-devices" element={<IoTDeviceManagementPage />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/rooms/:id" element={<RoomDetailPage />} />
              <Route path="/data-entry" element={<DataEntryPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/occupancy" element={<OccupancyAnalyticsPage />} />
              <Route path="/ai-insights" element={<AIInsightsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App