'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ExpensesTable } from '@/components/dashboard/expenses/expenses-table'
import { ExpensesDialog } from '@/components/dashboard/expenses/expenses-dialog'

export default function ExpensesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gastos</h1>
            <p className="text-muted-foreground mt-1">
              Registra y administra los gastos de tu negocio
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Gasto
          </Button>
        </div>

        <ExpensesTable />
        <ExpensesDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </div>
    </div>
  )
}
