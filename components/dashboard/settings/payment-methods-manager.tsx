'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { Trash2, Plus } from 'lucide-react'

const paymentMethodSchema = z.object({
  name: z.string().min(1, 'El nombre del método de pago es requerido'),
})

type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>

interface PaymentMethod {
  id: string
  name: string
}

export function PaymentMethodsManager() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      name: '',
    },
  })

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/payment-methods')
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data)
      }
    } catch (error) {
      toast.error('Error al cargar métodos de pago')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (values: PaymentMethodFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment method')
      }

      const data = await response.json()
      setPaymentMethods([...paymentMethods, ...data])
      form.reset()
      toast.success('Método de pago creado correctamente')
    } catch (error) {
      toast.error('Error al crear el método de pago')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      // TODO: Implement delete endpoint
      setPaymentMethods(paymentMethods.filter(m => m.id !== id))
      toast.success('Método de pago eliminado correctamente')
    } catch (error) {
      toast.error('Error al eliminar el método de pago')
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Payment Method Form */}
      <Card>
        <CardHeader>
          <CardTitle>Agregar Nuevo Método de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-4">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Nombre del método de pago (ej: Tarjeta, Transferencia)"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-1"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Payment Methods List */}
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Cargando métodos de pago...</p>
          ) : paymentMethods.length === 0 ? (
            <p className="text-muted-foreground">No hay métodos de pago aún. Crea uno arriba.</p>
          ) : (
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
                >
                  <Badge variant="secondary">{method.name}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(method.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
