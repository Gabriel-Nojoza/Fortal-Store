"use client"

import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { CartSheet } from "@/components/cart-sheet"
import type { CartItem } from "@/lib/types"

interface HeaderProps {
  cartItems?: CartItem[]
  cartCount?: number
  cartTotal?: number
  onUpdateCartItem?: (itemId: string, quantity: number) => void
  onRemoveCartItem?: (itemId: string) => void
  onClearCart?: () => void
}

export function Header({
  cartItems = [],
  cartCount = 0,
  cartTotal = 0,
  onUpdateCartItem,
  onRemoveCartItem,
  onClearCart,
}: HeaderProps) {
  const canShowCart =
    onUpdateCartItem && onRemoveCartItem && onClearCart

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <ShoppingBag className="h-8 w-8 text-primary" />
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-foreground">
              FORTAL STORE
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Camisas de Time
            </span>
          </div>
        </Link>

        {canShowCart ? (
          <CartSheet
            items={cartItems}
            totalItems={cartCount}
            totalPrice={cartTotal}
            onUpdateQuantity={onUpdateCartItem}
            onRemoveItem={onRemoveCartItem}
            onClearCart={onClearCart}
          />
        ) : null}
      </div>
    </header>
  )
}
