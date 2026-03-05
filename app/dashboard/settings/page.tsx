'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoriesManager } from '@/components/dashboard/settings/categories-manager'
import { PaymentMethodsManager } from '@/components/dashboard/settings/payment-methods-manager'

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground mt-1">
            Administra las categorías y métodos de pago de tu negocio
          </p>
        </div>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
            <TabsTrigger value="payment-methods">Métodos de Pago</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="mt-6">
            <CategoriesManager />
          </TabsContent>

          <TabsContent value="payment-methods" className="mt-6">
            <PaymentMethodsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
