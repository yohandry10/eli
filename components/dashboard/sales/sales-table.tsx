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
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

interface Sale {
  id: string
  date: string
  products?: { name: string }
  quantity: number
  unit_price: number
  total: number
  payment_methods?: { name: string }
}

export function SalesTable() {
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/sales')
      if (!response.ok) {
        throw new Error('Failed to fetch sales')
      }
      const data = await response.json()
      setSales(data)
    } catch (error) {
      toast.error('Error al cargar ventas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/sales/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete')
      }
      setSales(sales.filter(s => s.id !== id))
      toast.success('Venta eliminada correctamente')
    } catch (error) {
      toast.error('Error al eliminar la venta')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando ventas...</p>
      </div>
    )
  }

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-card border border-border rounded-lg">
        <p className="text-muted-foreground">No hay ventas registradas aún</p>
        <p className="text-sm text-muted-foreground mt-1">
          Comienza agregando tu primera venta
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead className="text-right">Kilos / Cant.</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Método de Pago</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  {formatDate(sale.date)}
                </TableCell>
                <TableCell>{sale.products?.name || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  {sale.unit_price > 0 ? `${sale.quantity} kg` : sale.quantity}
                </TableCell>
                <TableCell className="text-right">
                  S/ {sale.unit_price.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  S/ {sale.total.toFixed(2)}
                </TableCell>
                <TableCell>{sale.payment_methods?.name || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(sale.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
