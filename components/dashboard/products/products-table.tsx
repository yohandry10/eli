'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Trash2, Edit2 } from 'lucide-react'
import { getProducts, deleteProduct } from '@/lib/services'

interface Product {
  id: string; name: string; categories?: { name: string }; default_price: number; is_active: boolean
}

export function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const data = await getProducts()
      setProducts(data as Product[])
    } catch { toast.error('Error al cargar productos') }
    finally { setIsLoading(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id)
      setProducts(products.filter(p => p.id !== id))
      toast.success('Producto eliminado correctamente')
    } catch { toast.error('Error al eliminar el producto') }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Cargando productos...</p></div>
  if (products.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 bg-card border border-border rounded-lg">
      <p className="text-muted-foreground">No hay servicios aún</p>
      <p className="text-sm text-muted-foreground mt-1">Comienza agregando tu primer servicio (Ej: Ropa, Sábanas)</p>
    </div>
  )

  return (
    <div className="border border-border rounded-lg overflow-hidden"><div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Servicio</TableHead><TableHead>Categoría</TableHead>
            <TableHead>Tipo de Precio</TableHead><TableHead className="text-right">Precio Base</TableHead>
            <TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.categories?.name || '—'}</TableCell>
              <TableCell>
                <Badge variant={product.default_price > 0 ? 'default' : 'secondary'}>
                  {product.default_price > 0 ? 'Por Kilo' : 'Precio Variable'}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">
                {product.default_price > 0 ? `S/ ${product.default_price.toFixed(2)}/kg` : '—'}
              </TableCell>
              <TableCell>
                <Badge variant={product.is_active ? 'default' : 'secondary'}>{product.is_active ? 'Activo' : 'Inactivo'}</Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="ghost" size="sm"><Edit2 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div></div>
  )
}
