import type { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

// ─── Card ────────────────────────────────────────────────
interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-200/60 dark:border-white/5
        shadow-sm dark:shadow-none
        ${hover ? 'hover:shadow-md hover:border-gray-300 dark:hover:border-white/10 hover:-translate-y-0.5 cursor-pointer' : ''}
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// ─── StatCard ────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'teal'
  trend?: { value: number; positive: boolean }
}

const colorMap = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    icon: 'text-emerald-600 dark:text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-amber-500/10',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    icon: 'text-rose-600 dark:text-rose-400',
    glow: 'shadow-rose-500/10',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    icon: 'text-blue-600 dark:text-blue-400',
    glow: 'shadow-blue-500/10',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    icon: 'text-purple-600 dark:text-purple-400',
    glow: 'shadow-purple-500/10',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-500/10',
    icon: 'text-teal-600 dark:text-teal-400',
    glow: 'shadow-teal-500/10',
  },
}

export function StatCard({ label, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
  const c = colorMap[color]
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white truncate">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {trend.positive ? '↓' : '↑'} {Math.abs(trend.value)}% vs last period
            </p>
          )}
        </div>
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center shadow-lg ${c.glow}`}>
          <Icon className={`w-6 h-6 ${c.icon}`} />
        </div>
      </div>
    </Card>
  )
}

// ─── Badge ───────────────────────────────────────────────
interface BadgeProps {
  children: ReactNode
  variant: 'emerald' | 'amber' | 'rose' | 'blue' | 'gray' | 'purple' | 'teal'
  size?: 'sm' | 'md'
}

const badgeColors = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
}

export function Badge({ children, variant, size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${badgeColors[variant]} ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
      {children}
    </span>
  )
}

// ─── Button ──────────────────────────────────────────────
interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: LucideIcon
  type?: 'button' | 'submit'
  className?: string
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, loading, icon: Icon, type = 'button', className = '' }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 active:scale-[0.98]',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20',
    ghost: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  )
}

// ─── Loading Spinner ─────────────────────────────────────
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-20 ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700" />
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────
interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null

  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${widths[size]} bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-65px)] p-6">{children}</div>
      </div>
    </div>
  )
}

// ─── Select ──────────────────────────────────────────────
interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
}

export function Select({ value, onChange, options, placeholder, className = '' }: SelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

// ─── Input ───────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>}
      <input
        className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all ${error ? 'border-rose-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  )
}
