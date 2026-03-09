// StatusBadge - color coded appointment status
type Status = 'Pending' | 'Ongoing' | 'Completed'
const STYLES: Record<Status,string> = {
  Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Ongoing: 'bg-blue-100 text-blue-700 border-blue-200',
  Completed: 'bg-green-100 text-green-700 border-green-200',
}
const DOTS: Record<Status,string> = {
  Pending: 'bg-yellow-400', Ongoing: 'bg-blue-500', Completed: 'bg-green-500',
}
export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STYLES[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOTS[status]}`} />
      {status}
    </span>
  )
}
