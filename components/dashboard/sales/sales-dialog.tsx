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
import { toast } from 'sonner'
import { Loader2, Weight, DollarSign } from 'lucide-react'

const salesSchema = z.object({
  date: z.string(),
  product_id: z.string().min(1, 'Selecciona un servicio'),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  unit_price: z.coerce.number().min(0.01, 'El precio debe ser mayor a 0'),
  payment_method_id: z.string().min(1, 'Selecciona un método de pago'),
})

type SalesFormValues = z.infer<typeof salesSchema>

interface Product {
  id: string
  name: string
  default_price: number
}

interface SalesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SalesDialog({ open, onOpenChange }: SalesDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      product_id: '',
      quantity: 1,
      unit_price: 0,
      payment_method_id: '',
    },
  })

  const quantity = form.watch('quantity')
  const unitPrice = form.watch('unit_price')
  const isPerKg = selectedProduct ? selectedProduct.default_price > 0 : false
  const total = (Number(quantity) || 0) * (Number(unitPrice) || 0)

  useEffect(() => {
    if (open) {
      fetchProducts()
      fetchPaymentMethods()
      setSelectedProduct(null)
      form.reset({
        date: new Date().toISOString().split('T')[0],
        product_id: '',
        quantity: 1,
        unit_price: 0,
        payment_method_id: '',
      })
    }
  }, [open])

  // Cuando se selecciona un producto, auto-llena el precio si es por kilo
  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId)
    setSelectedProduct(product || null)
    if (product && product.default_price > 0) {
      // Servicio por kilo: el precio se llena automáticamente
      form.setValue('unit_price', product.default_price)
      form.setValue('quantity', 1)
    } else {
      // Precio variable: limpiamos
      form.setValue('unit_price', 0)
      form.setValue('quantity', 1)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch products')
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods')
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data)
      }
    } catch (error) {
      console.error('Failed to fetch payment methods')
    }
  }

  const onSubmit = async (values: SalesFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Error al registrar venta')
      }

      toast.success('Venta registrada correctamente')
      form.reset()
      onOpenChange(false)
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar la venta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Venta</DialogTitle>
          <DialogDescription>
            Ingresa los datos del servicio prestado
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Fecha */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Servicio - Botones Grandes */}
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">¿Qué servicio vas a registrar?</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {products.map((product) => {
                        const isSelected = field.value === product.id
                        const isKg = product.default_price > 0
                        return (
                          <div
                            key={product.id}
                            onClick={() => {
                              if (!isLoading) {
                                field.onChange(product.id)
                                handleProductChange(product.id)
                              }
                            }}
                            className={`
                              cursor-pointer rounded-xl border-2 p-4 transition-all
                              ${isSelected
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-muted hover:border-primary/40 hover:bg-muted/50'}
                            `}
                          >
                            <div className="font-semibold text-foreground mb-1">
                              {product.name}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center">
                              {isKg ? (
                                <><Weight className="w-3 h-3 mr-1 inline" /> Por Kilo (S/ {product.default_price})</>
                              ) : (
                                <><DollarSign className="w-3 h-3 mr-1 inline" /> Precio Variable</>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Si es por kilo: mostrar campo de Kilos claramente */}
            {selectedProduct && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Weight className="h-3.5 w-3.5" />
                        {isPerKg ? 'Kilos (kg)' : 'Cantidad'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={isPerKg ? '0.0' : '1'}
                          step={isPerKg ? '0.1' : '1'}
                          min="0"
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
                  name="unit_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {isPerKg ? 'Precio/kg (S/.)' : 'Precio (S/.)'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          {...field}
                          // Si es por kilo, el precio se rellena solo pero puede editarlo
                          readOnly={false}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Total calculado MEGA DESTACADO */}
            {selectedProduct && total > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex justify-between items-center shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-emerald-800 uppercase tracking-wider">
                    Total a Cobrar
                  </span>
                  <span className="text-xs text-emerald-600/80 mt-1">
                    {isPerKg ? `${quantity} kg × S/ ${unitPrice}` : 'Monto manual'}
                  </span>
                </div>
                <span className="text-3xl font-black text-emerald-700">
                  S/ {total.toFixed(2)}
                </span>
              </div>
            )}

            {/* Método de pago */}
            <FormField
              control={form.control}
              name="payment_method_id"
              render={({ field }) => (
                <FormItem className="pt-2">
                  <FormLabel>Método de Pago</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="¿Cómo pagó el cliente?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full text-md font-semibold mt-4 h-12"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {isLoading ? 'Registrando...' : 'Confirmar y Registrar Venta'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
