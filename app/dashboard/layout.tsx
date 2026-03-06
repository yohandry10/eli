'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardTopbar } from '@/components/dashboard/topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('app-session')) {
      router.replace('/auth/login')
    } else {
      setReady(true)
    }
  }, [router])

  if (!ready) return null

  return (
    <div className='flex h-screen bg-background'>
      <DashboardSidebar />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <DashboardTopbar />
        <main className='flex-1 overflow-auto'>{children}</main>
      </div>
    </div>
  )
}
