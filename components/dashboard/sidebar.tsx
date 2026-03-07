'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Package,
  Settings,
  LogOut,
  Users,
  Boxes,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const navItems = [
  {
    label: 'Resumen',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Ventas',
    href: '/dashboard/sales',
    icon: TrendingUp,
  },
  {
    label: 'Gastos',
    href: '/dashboard/expenses',
    icon: TrendingDown,
  },
  {
    label: 'Servicios',
    href: '/dashboard/products',
    icon: Package,
  },
  {
    label: 'Clientes',
    href: '/dashboard/clients',
    icon: Users,
  },
  {
    label: 'Inventario',
    href: '/dashboard/inventory',
    icon: Boxes,
  },
  {
    label: 'Configuración',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (typeof window === 'undefined') return
    const isTauri = !!(window as any).__TAURI_INTERNALS__
    const isTauriProd = isTauri && window.location.hostname === 'tauri.localhost'
    if (!isTauriProd) return
    e.preventDefault()
    const desktopHref = href === '/dashboard' ? '/dashboard.html' : `/dashboard${href.replace('/dashboard', '')}.html`
    window.location.assign(desktopHref)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('Sesión cerrada correctamente')
      router.push('/auth/login')
    } catch (error) {
      toast.error('Error al cerrar sesión')
    }
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold text-sidebar-foreground">BlessFresh</h1>
        <p className="text-xs text-sidebar-foreground/70 mt-1">Panel de control</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Link href={item.href} onClick={(e) => handleNavClick(e, item.href)}>
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  )
}
