// components/PageWrapper.tsx
// Layout wrapper that includes the sidebar and main content area

import Sidebar from './Sidebar'

interface PageWrapperProps {
  role: 'patient' | 'dentist'
  userName: string
  children: React.ReactNode
  title?: string
}

export default function PageWrapper({ role, userName, children, title }: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar role={role} userName={userName} />

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* Top Header Bar */}
        {title && (
          <div className="bg-white border-b border-gray-200 px-8 py-4">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          </div>
        )}

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
