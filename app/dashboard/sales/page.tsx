'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { SalesTable } from '@/components/dashboard/sales/sales-table'
import { SalesDialog } from '@/components/dashboard/sales/sales-dialog'

export default function SalesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Ventas</h1>
            <p className="text-muted-foreground mt-1">
              Administra tus registros de ventas y transacciones
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Venta
          </Button>
        </div>

        <SalesTable />
        <SalesDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </div>
    </div>
  )
}
