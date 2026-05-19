"use client"

import { useCallback, useEffect, useState } from "react"
import { LogOut, RefreshCw, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { AuthProvider, useAuth } from "@/components/admin/auth-provider"
import { LoginForm } from "@/components/admin/login-form"
import { OrderNotesPanel } from "@/components/admin/order-notes-panel"
import { OrdersPanel } from "@/components/admin/orders-panel"
import { PushNotificationSettings } from "@/components/admin/push-notification-settings"
import { ProductForm } from "@/components/admin/product-form"
import { ProductList } from "@/components/admin/product-list"
import { Button } from "@/components/ui/button"
import { useOrderNotes } from "@/hooks/use-order-notes"
import { useOrders } from "@/hooks/use-orders"
import { useProducts } from "@/hooks/use-products"
import { toast } from "@/hooks/use-toast"
import type { Order, Product } from "@/lib/types"

function AdminDashboard() {
  const { isAuthenticated, logout } = useAuth()
  const { products, isLoading, deleteProduct, refreshProducts } = useProducts()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const handleNewOrders = useCallback((incomingOrders: Order[]) => {
    const latestOrder = incomingOrders[0]

    toast({
      title:
        incomingOrders.length === 1
          ? "Novo pedido recebido"
          : `${incomingOrders.length} novos pedidos recebidos`,
      description: `${latestOrder.customer.name} acabou de finalizar um pedido.`,
    })

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([220, 100, 220])
    }
  }, [])

  const {
    orders,
    isLoading: isOrdersLoading,
    newOrderCount,
    refreshOrders,
    markOrderAsSeen,
  } = useOrders(isAuthenticated, handleNewOrders)
  const {
    notes,
    isLoading: isNotesLoading,
    refreshOrderNotes,
    createNote,
    deleteNote,
  } = useOrderNotes(isAuthenticated)

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) {
      return
    }

    try {
      setIsDeleting(id)
      await deleteProduct(id)
      setEditingProduct((currentProduct) =>
        currentProduct?.id === id ? null : currentProduct
      )
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
      alert(
        error instanceof Error
          ? error.message
          : "Nao foi possivel excluir o produto."
      )
    } finally {
      setIsDeleting(null)
    }
  }

  const handleRefreshAll = async () => {
    await Promise.all([refreshProducts(), refreshOrders(), refreshOrderNotes()])
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-foreground">
                FORTAL STORE
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Painel Admin
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleRefreshAll()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void logout()}
              className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Gerenciar Loja
          </h1>
          <p className="text-muted-foreground">
            Cadastre produtos, acompanhe pedidos e confirme novas compras.
          </p>
        </div>

        <PushNotificationSettings />

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <ProductForm
            onSuccess={() => void refreshProducts()}
            productToEdit={editingProduct}
            onCancelEdit={() => setEditingProduct(null)}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <ProductList
              products={products}
              onEdit={(product) => setEditingProduct(product)}
              onDelete={(id) => void handleDelete(id)}
              isDeleting={isDeleting}
            />
          )}
        </div>

        <div className="mt-8 grid gap-8 2xl:grid-cols-[1.2fr_0.8fr]">
          <OrdersPanel
            orders={orders}
            isLoading={isOrdersLoading}
            newOrderCount={newOrderCount}
            onMarkAsSeen={(id) => void markOrderAsSeen(id)}
          />

          <OrderNotesPanel
            notes={notes}
            isLoading={isNotesLoading}
            onCreateNote={async (input) => {
              await createNote(input)
              toast({
                title: "Anotacao salva",
                description: "Sua anotacao da loja foi guardada no painel.",
              })
            }}
            onDeleteNote={async (id) => {
              await deleteNote(id)
              toast({
                title: "Anotacao removida",
                description: "A anotacao foi excluida do painel.",
              })
            }}
          />
        </div>
      </main>
    </div>
  )
}

export default function AdminPage() {
  return (
    <AuthProvider>
      <AdminDashboard />
    </AuthProvider>
  )
}
