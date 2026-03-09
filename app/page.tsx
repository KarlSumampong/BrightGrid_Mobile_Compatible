// app/page.tsx
// Root route - middleware will redirect authenticated users to their dashboard
// Unauthenticated users will be redirected to /login

import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/login')
}
