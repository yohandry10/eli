'use client'

import { useEffect, useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { getCategories, createProduct } from '@/lib/services'

const productsSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  category_id: z.string().optional(),
  pricing_type: z.enum(['per_kg', 'variable']),
  default_price: z.coerce.number().min(0),
  is_active: z.boolean().optional().default(true),
})

type ProductsFormValues = z.infer<typeof productsSchema>

interface ProductsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductsDialog({ open, onOpenChange }: ProductsDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  const form = useForm<ProductsFormValues>({
    resolver: zodResolver(productsSchema),
    defaultValues: {
      name: '',
      category_id: '',
      pricing_type: 'per_kg',
      default_price: 0,
      is_active: true,
    },
  })

  const pricingType = form.watch('pricing_type')

  useEffect(() => {
    if (open) {
      fetchCategories()
      form.reset({
        name: '',
        category_id: '',
        pricing_type: 'per_kg',
        default_price: 0,
        is_active: true,
      })
    }
  }, [open])

  const fetchCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories')
    }
  }

  const onSubmit = async (values: ProductsFormValues) => {
    setIsLoading(true)
    try {
      const priceToSave = values.pricing_type === 'variable' ? 0 : values.default_price

      await createProduct({
        name: values.name,
        default_price: priceToSave,
        is_active: values.is_active,
        category_id: values.category_id || undefined,
      })

      toast.success('Servicio creado correctamente')
      form.reset()
      onOpenChange(false)
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Error al crear el servicio')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Producto o Servicio</DialogTitle>
          <DialogDescription>
            Define el servicio y cómo se calculará el precio
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Nombre */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Servicio</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Ropa, Sábanas/Frazadas"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de precio */}
            <FormField
              control={form.control}
              name="pricing_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Precio</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo de precio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="per_kg">Por Kilo (precio × kg)</SelectItem>
                      <SelectItem value="variable">Precio Variable (se define en cada venta)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Precio por kilo — solo si es per_kg */}
            {pricingType === 'per_kg' && (
              <FormField
                control={form.control}
                name="default_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio por Kilo (S/.)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="3.00"
                        step="0.01"
                        min="0"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {pricingType === 'variable' && (
              <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                💡 El precio se ingresará manualmente en cada venta
              </p>
            )}

            {/* Categoría (opcional) */}
            {categories.length > 0 && (
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Activo */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Servicio Activo</FormLabel>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Guardando...' : 'Crear Servicio'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
