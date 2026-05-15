"use client"

import { useState } from "react"
import Image from "next/image"
import { CreditCard, Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { CartItem } from "@/lib/types"

interface CartSheetProps {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onClearCart: () => void
}

function CartItemImage({ item }: { item: CartItem }) {
  if (item.imageUrl.startsWith("data:")) {
    return (
      <img
        src={item.imageUrl}
        alt={item.name}
        className="h-full w-full object-cover"
      />
    )
  }

  return (
    <Image
      src={item.imageUrl}
      alt={item.name}
      fill
      sizes="72px"
      className="object-cover"
    />
  )
}

export function CartSheet({
  items,
  totalItems,
  totalPrice,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartSheetProps) {
  const router = useRouter()
  const badgeCount = totalItems > 9 ? "9+" : totalItems
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  function handleCheckout() {
    try {
      setIsCheckingOut(true)
      router.push("/checkout")
    } catch (error) {
      console.error("Erro ao abrir checkout:", error)
      setIsCheckingOut(false)
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {badgeCount}
            </span>
          )}
          <span className="sr-only">Abrir carrinho</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full border-l border-border sm:max-w-md">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>Carrinho</SheetTitle>
          <SheetDescription>
            {totalItems === 0
              ? "Seu carrinho esta vazio."
              : `${totalItems} item(ns) adicionados.`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 rounded-full bg-secondary p-4">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground">
              Nenhum item no carrinho
            </p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
              Adicione produtos para ver todos eles aqui.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border bg-card p-3"
                  >
                    <div className="flex gap-3">
                      <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-secondary">
                        <CartItemImage item={item} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="line-clamp-2 text-sm font-semibold text-foreground">
                              {item.name}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge className="bg-primary/15 text-primary">
                                {item.team}
                              </Badge>
                              <Badge variant="outline">Tam. {item.size}</Badge>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => onRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remover item</span>
                          </Button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                onUpdateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              <Minus className="h-3.5 w-3.5" />
                              <span className="sr-only">Diminuir quantidade</span>
                            </Button>

                            <span className="w-6 text-center text-sm font-semibold text-foreground">
                              {item.quantity}
                            </span>

                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                onUpdateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span className="sr-only">Aumentar quantidade</span>
                            </Button>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              R$ {item.price.toFixed(2).replace(".", ",")} cada
                            </p>
                            <p className="text-base font-bold text-accent">
                              R$ {(item.price * item.quantity)
                                .toFixed(2)
                                .replace(".", ",")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <SheetFooter className="border-t border-border bg-background pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              <div className="w-full space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Itens</span>
                    <span>{totalItems}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Total
                    </span>
                    <span className="text-xl font-bold text-accent">
                      R$ {totalPrice.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={isCheckingOut || items.length === 0}
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Abrindo checkout...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Finalizar compra
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onClearCart}
                  disabled={isCheckingOut}
                >
                  Limpar carrinho
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
