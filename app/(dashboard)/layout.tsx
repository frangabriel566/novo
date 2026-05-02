import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  return (
    <DashboardShell userName={user.name} userEmail={user.email}>
      {children}
    </DashboardShell>
  )
}
