// components/StatCard.tsx
// Reusable stat/metric card for dashboard analytics

interface StatCardProps {
  title: string
  value: string | number
  icon: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  subtitle?: string
}

// Color class mappings
const COLOR_MAP = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    value: 'text-blue-700',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'bg-green-100 text-green-600',
    value: 'text-green-700',
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'bg-yellow-100 text-yellow-600',
    value: 'text-yellow-700',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    value: 'text-red-700',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    value: 'text-purple-700',
  },
}

export default function StatCard({
  title,
  value,
  icon,
  color = 'blue',
  subtitle,
}: StatCardProps) {
  const colors = COLOR_MAP[color]

  return (
    <div className={`${colors.bg} rounded-2xl p-5 border border-white shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${colors.value}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`${colors.icon} w-12 h-12 rounded-xl flex items-center justify-center text-xl`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
