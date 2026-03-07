'use client'

import { Button } from '@/components/ui/button'
import { Menu, User, LayoutDashboard, TrendingUp, TrendingDown, Package, Settings, LogOut, Users, Boxes } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useState } from 'react'

const navItems = [
  { label: 'Resumen', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Ventas', href: '/dashboard/sales', icon: TrendingUp },
  { label: 'Gastos', href: '/dashboard/expenses', icon: TrendingDown },
  { label: 'Servicios', href: '/dashboard/products', icon: Package },
  { label: 'Clientes', href: '/dashboard/clients', icon: Users },
  { label: 'Inventario', href: '/dashboard/inventory', icon: Boxes },
  { label: 'Configuración', href: '/dashboard/settings', icon: Settings },
]

export function DashboardTopbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false)
    if (typeof window === 'undefined') return
    const isTauri = !!(window as any).__TAURI_INTERNALS__
    const isTauriProd = isTauri && window.location.hostname === 'tauri.localhost'
    if (!isTauriProd) return
    e.preventDefault()
    const desktopHref = href === '/dashboard' ? '/dashboard.html' : `/dashboard${href.replace('/dashboard', '')}.html`
    window.location.assign(desktopHref)
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem('app-session')
      toast.success('Sesión cerrada correctamente')
      router.push('/auth/login')
    } catch (error) {
      toast.error('Error al cerrar sesión')
    }
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 flex flex-col">
            <SheetHeader className="p-6 border-b border-border text-left">
              <SheetTitle className="text-2xl font-bold">BlessFresh</SheetTitle>
              <p className="text-xs text-muted-foreground mt-1">Panel de Control</p>
            </SheetHeader>
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
                      isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
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
            <div className="p-4 border-t border-border">
              <Button onClick={() => { setOpen(false); handleLogout() }} variant="outline" className="w-full justify-start hover:bg-muted">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <h2 className="text-lg font-semibold text-foreground hidden md:block">Panel Principal</h2>
        <h2 className="text-lg font-bold text-blue-900 md:hidden">Tu Lavandería 🧺</h2>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
