'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

interface Expense {
  id: string
  date: string
  categories?: { name: string }
  type: 'materials' | 'operating'
  amount: number
  supplier: string
  description?: string
}

export function ExpensesTable() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/expenses')
      if (!response.ok) {
        throw new Error('Failed to fetch expenses')
      }
      const data = await response.json()
      setExpenses(data)
    } catch (error) {
      toast.error('Error al cargar gastos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete')
      }
      setExpenses(expenses.filter(e => e.id !== id))
      toast.success('Gasto eliminado correctamente')
    } catch (error) {
      toast.error('Error al eliminar el gasto')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando gastos...</p>
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-card border border-border rounded-lg">
        <p className="text-muted-foreground">No hay gastos registrados aún</p>
        <p className="text-sm text-muted-foreground mt-1">
          Comienza agregando tu primer gasto
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                {formatDate(expense.date)}
              </TableCell>
              <TableCell>{expense.categories?.name || 'N/A'}</TableCell>
              <TableCell>
                <Badge
                  variant={expense.type === 'materials' ? 'default' : 'secondary'}
                >
                  {expense.type === 'materials' ? 'Materiales' : 'Operativo'}
                </Badge>
              </TableCell>
              <TableCell>{expense.supplier}</TableCell>
              <TableCell className="text-right font-semibold">
                ${expense.amount.toFixed(2)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {expense.description || '-'}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(expense.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
