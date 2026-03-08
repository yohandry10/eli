'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoriesManager } from '@/components/dashboard/settings/categories-manager'
import { PaymentMethodsManager } from '@/components/dashboard/settings/payment-methods-manager'
import { Download, Monitor } from 'lucide-react'
import { toast } from 'sonner'

const WINDOWS_INSTALLERS = [
  { versionLabel: 'v1.0.3', build: '0.1.3', fileName: 'LavaPro-setup-0.1.3.exe' },
  { versionLabel: 'v1.0.2', build: '0.1.2', fileName: 'LavaPro-setup-0.1.2.exe' },
  { versionLabel: 'v1.0.1', build: '0.1.1', fileName: 'LavaPro-setup-0.1.1.exe' },
] as const

export default function SettingsPage() {
  const [isResolvingDownload, setIsResolvingDownload] = useState(false)
  const latestInstaller = WINDOWS_INSTALLERS[0]

  const startDownload = (url: string, downloadFileName: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = downloadFileName
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleDownloadWindows = async () => {
    if (isResolvingDownload) return

    setIsResolvingDownload(true)

    try {
      for (const installer of WINDOWS_INSTALLERS) {
        const installerUrl = `/downloads/${installer.fileName}`

        try {
          const response = await fetch(installerUrl, { method: 'HEAD', cache: 'no-store' })
          if (!response.ok) continue

          startDownload(installerUrl, `BlessFresh-setup-${installer.build}.exe`)

          if (installer.fileName === latestInstaller.fileName) {
            toast.success('Descarga iniciada.')
          } else {
            toast.warning(
              `La versión ${latestInstaller.versionLabel} no está disponible. Se descargó ${installer.versionLabel}.`
            )
          }

          return
        } catch {
          continue
        }
      }

      toast.error('No hay instalador disponible en este momento. Contacta a soporte.')
    } finally {
      setIsResolvingDownload(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground mt-1">
            Administra las categorías y métodos de pago de tu negocio
          </p>
        </div>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
            <TabsTrigger value="payment-methods">Métodos de Pago</TabsTrigger>
            <TabsTrigger value="desktop">App de escritorio</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="mt-6">
            <CategoriesManager />
          </TabsContent>

          <TabsContent value="payment-methods" className="mt-6">
            <PaymentMethodsManager />
          </TabsContent>

          <TabsContent value="desktop" className="mt-6">
            <div className="rounded-xl border bg-card p-8 flex flex-col items-center text-center gap-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Monitor className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1">App de escritorio</h2>
                <p className="text-muted-foreground text-sm">
                  Instala BlessFresh en tu PC para usarlo sin navegador, más rápido y siempre disponible.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadWindows}
                disabled={isResolvingDownload}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {isResolvingDownload ? 'Verificando instalador...' : 'Descargar para Windows'}
              </button>
              <p className="text-xs text-muted-foreground">
                {latestInstaller.versionLabel} · Windows 10/11 · 64-bit
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
