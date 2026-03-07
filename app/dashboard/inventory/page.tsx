'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { InventoryTable } from '@/components/dashboard/inventory/inventory-table'
import { InventoryDialog } from '@/components/dashboard/inventory/inventory-dialog'

export default function InventoryPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Inventario</h1>
            <p className="text-muted-foreground mt-1">
              Control de stock de insumos de tu lavandería
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Insumo
          </Button>
        </div>

        <InventoryTable />
        <InventoryDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </div>
    </div>
  )
}
