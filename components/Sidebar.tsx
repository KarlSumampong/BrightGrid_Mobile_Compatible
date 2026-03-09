'use client'
// components/Sidebar.tsx
// Reusable sidebar navigation component used by both patient and dentist panels

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

interface NavItem {
  href: string
  label: string
  icon: string
}

interface SidebarProps {
  role: 'patient' | 'dentist'
  userName: string
}

// Navigation items for each role
const PATIENT_NAV: NavItem[] = [
  { href: '/patient/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/patient/book', label: 'Book Appointment', icon: '📅' },
  { href: '/patient/appointments', label: 'My Appointments', icon: '🗓️' },
  { href: '/patient/records', label: 'Dental Records', icon: '📋' },
  { href: '/patient/ai-checker', label: 'AI Symptom Checker', icon: '🤖' },
]

const DENTIST_NAV: NavItem[] = [
  { href: '/dentist/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/dentist/appointments', label: 'Appointments', icon: '🗓️' },
  { href: '/dentist/patients', label: 'Patients', icon: '👥' },
  { href: '/dentist/add-record', label: 'Add Dental Record', icon: '📝' },
]

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navItems = role === 'patient' ? PATIENT_NAV : DENTIST_NAV

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      {/* Brand Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🦷</span>
          <div>
            <h1 className="font-bold text-blue-700 text-lg leading-none">DentaSmart</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {role === 'patient' ? 'Patient Portal' : 'Dentist Portal'}
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
          <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-800 truncate">{userName}</p>
            <p className="text-xs text-blue-600 capitalize">{role}</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
        >
          <span>🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
