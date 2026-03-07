'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { createInventoryItem } from '@/lib/services'

const inventorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  category: z.string().min(1, 'Selecciona una categoría'),
  quantity: z.coerce.number().min(0, 'La cantidad no puede ser negativa'),
  unit: z.string().min(1, 'Selecciona una unidad'),
  min_stock: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo'),
  cost_per_unit: z.coerce.number().min(0, 'El costo no puede ser negativo'),
  notes: z.string().optional(),
})

type InventoryFormValues = z.infer<typeof inventorySchema>

interface InventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InventoryDialog({ open, onOpenChange }: InventoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: '',
      category: '',
      quantity: 0,
      unit: '',
      min_stock: 0,
      cost_per_unit: 0,
      notes: '',
    },
  })

  const onSubmit = async (values: InventoryFormValues) => {
    setIsLoading(true)
    try {
      await createInventoryItem({
        name: values.name,
        category: values.category,
        quantity: values.quantity,
        unit: values.unit,
        min_stock: values.min_stock,
        cost_per_unit: values.cost_per_unit,
        notes: values.notes || undefined,
      })
      toast.success('Insumo creado correctamente')
      form.reset()
      onOpenChange(false)
      window.location.reload()
    } catch {
      toast.error('Error al crear el insumo')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Insumo</DialogTitle>
          <DialogDescription>
            Registra un nuevo insumo en tu inventario
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre del insumo"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="detergente">Detergente</SelectItem>
                        <SelectItem value="suavizante">Suavizante</SelectItem>
                        <SelectItem value="bolsas">Bolsas</SelectItem>
                        <SelectItem value="otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kg">Kilogramos</SelectItem>
                        <SelectItem value="litros">Litros</SelectItem>
                        <SelectItem value="unidades">Unidades</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad Actual</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        step="0.1"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Mínimo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        step="0.1"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cost_per_unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Costo por Unidad (S/.)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas sobre el insumo"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Creando...' : 'Crear Insumo'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
