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
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { getClients, deleteClient } from '@/lib/services'

interface Client {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  notes?: string
}

export function ClientsTable() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      const data = await getClients()
      setClients(data as Client[])
    } catch {
      toast.error('Error al cargar clientes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteClient(id)
      setClients(clients.filter((c) => c.id !== id))
      toast.success('Cliente eliminado correctamente')
    } catch {
      toast.error('Error al eliminar el cliente')
    }
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando clientes...</p>
      </div>
    )

  if (clients.length === 0)
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-card border border-border rounded-lg">
        <p className="text-muted-foreground">No hay clientes registrados aún</p>
      </div>
    )

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell>{client.email || '-'}</TableCell>
              <TableCell>{client.address || '-'}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {client.notes || '-'}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(client.id)}
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
