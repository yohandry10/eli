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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Trash2, Plus } from 'lucide-react'
import { getCategories, createCategory } from '@/lib/services'

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre de la categoría es requerido'),
  type: z.enum(['product', 'expense']),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface Category {
  id: string
  name: string
}

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'product',
    },
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const data = await getCategories()
      setCategories(data as Category[])
    } catch (error) {
      toast.error('Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (values: CategoryFormValues) => {
    setIsSubmitting(true)
    try {
      const data = await createCategory(values)
      setCategories([...categories, ...(data as Category[])])
      form.reset()
      toast.success('Categoría creada correctamente')
    } catch (error) {
      toast.error('Error al crear la categoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      // TODO: Implement delete endpoint
      setCategories(categories.filter(c => c.id !== id))
      toast.success('Categoría eliminada correctamente')
    } catch (error) {
      toast.error('Error al eliminar la categoría')
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Category Form */}
      <Card>
        <CardHeader>
          <CardTitle>Agregar Nueva Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="flex gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="Nombre de la categoría"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="product">Producto</SelectItem>
                          <SelectItem value="expense">Gasto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Cargando categorías...</p>
          ) : categories.length === 0 ? (
            <p className="text-muted-foreground">No hay categorías aún. Crea una arriba.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
                >
                  <Badge variant="secondary">{category.name}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
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
