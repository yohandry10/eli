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
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { getInventoryItems, deleteInventoryItem } from '@/lib/services'

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  min_stock: number
  cost_per_unit: number
  notes?: string
}

const categoryLabels: Record<string, string> = {
  detergente: 'Detergente',
  suavizante: 'Suavizante',
  bolsas: 'Bolsas',
  otros: 'Otros',
}

const unitLabels: Record<string, string> = {
  kg: 'kg',
  litros: 'L',
  unidades: 'uds',
}

export function InventoryTable() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      setIsLoading(true)
      const data = await getInventoryItems()
      setItems(data as InventoryItem[])
    } catch {
      toast.error('Error al cargar inventario')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteInventoryItem(id)
      setItems(items.filter((i) => i.id !== id))
      toast.success('Insumo eliminado correctamente')
    } catch {
      toast.error('Error al eliminar el insumo')
    }
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando inventario...</p>
      </div>
    )

  if (items.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-card border border-border rounded-lg">
        <p className="text-muted-foreground">No hay insumos registrados aún</p>
      </div>
    )

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead className="text-right">Stock Mín.</TableHead>
            <TableHead className="text-right">Costo/Unidad</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isLowStock = item.quantity <= item.min_stock
            return (
              <TableRow key={item.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {categoryLabels[item.category] || item.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className={isLowStock ? 'text-destructive font-bold' : ''}>
                    {item.quantity} {unitLabels[item.unit] || item.unit}
                  </span>
                  {isLowStock && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Bajo
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {item.min_stock} {unitLabels[item.unit] || item.unit}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  S/ {item.cost_per_unit.toFixed(2)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.notes || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
