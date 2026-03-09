// PageWrapper - layout with sidebar
import Sidebar from './Sidebar'
interface PageWrapperProps { role: 'patient'|'dentist'; userName: string; children: React.ReactNode; title?: string }
export default function PageWrapper({ role, userName, children, title }: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={role} userName={userName} />
      <main className="md:ml-64 pt-16 md:pt-0 min-h-screen">
        {title && (
          <div className="bg-white border-b border-gray-200 px-6 md:px-8 py-4">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          </div>
        )}
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}
