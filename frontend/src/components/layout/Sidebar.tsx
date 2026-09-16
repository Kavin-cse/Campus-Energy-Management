import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, MonitorPlay, Settings2, CircuitBoard, Building2,
  FileSpreadsheet, BarChart3, Users, Lightbulb, Settings, X, Zap,
} from 'lucide-react'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: MonitorPlay, label: 'Live IoT Monitor', to: '/iot-monitor' },
  { icon: Settings2, label: 'IoT Simulator', to: '/iot-simulator' },
  { icon: CircuitBoard, label: 'Device Management', to: '/iot-devices' },
  { icon: Building2, label: 'Rooms', to: '/rooms' },
  { icon: FileSpreadsheet, label: 'Manual Data Entry', to: '/data-entry' },
  { icon: BarChart3, label: 'Analytics', to: '/analytics' },
  { icon: Users, label: 'Occupancy Analytics', to: '/occupancy' },
  { icon: Lightbulb, label: 'AI Insights', to: '/ai-insights' },
  { icon: Settings, label: 'Settings', to: '/settings' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-out
          lg:static lg:translate-x-0 lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col border-r border-white/10
        `}
        style={{
          background: 'linear-gradient(180deg, #0a1628 0%, #0d2137 40%, #0a2e1f 100%)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">WattWise</h1>
              <p className="text-[11px] text-emerald-400/80 font-medium tracking-wider uppercase">Campus Energy</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/50 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
            return (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={`
                  group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-emerald-500/15 text-emerald-400 shadow-lg shadow-emerald-500/5'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-emerald-400' : ''}`} />
                {label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="rounded-xl bg-white/5 px-4 py-3">
            <p className="text-[11px] text-white/40 uppercase tracking-wider font-medium">SDG 7</p>
            <p className="text-xs text-emerald-400/80 mt-0.5">Affordable & Clean Energy</p>
          </div>
        </div>
      </aside>
    </>
  )
}
