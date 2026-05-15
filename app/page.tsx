"use client"

import { Loader2 } from "lucide-react"
import { Header } from "@/components/header"
import { HeroCover } from "@/components/hero-cover"
import { ProductCard } from "@/components/product-card"
import { useCart } from "@/hooks/use-cart"
import { useProducts } from "@/hooks/use-products"

export default function HomePage() {
  const { products, isLoading } = useProducts()
  const {
    items,
    totalItems,
    totalPrice,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart()

  return (
    <div className="min-h-screen bg-background">
      <Header
        cartItems={items}
        cartCount={totalItems}
        cartTotal={totalPrice}
        onUpdateCartItem={updateQuantity}
        onRemoveCartItem={removeFromCart}
        onClearCart={clearCart}
      />

      <main className="container mx-auto px-4 py-8">
        <HeroCover featuredProduct={products[0]} />

        <section id="produtos">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Nossos Produtos
              </h2>
              {!isLoading && (
                <p className="text-sm text-muted-foreground">
                  {products.length}{" "}
                  {products.length === 1
                    ? "camisa disponível"
                    : "camisas disponíveis"}
                </p>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Carregando produtos...
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16">
              <p className="mb-2 text-lg font-medium text-foreground">
                Nenhum produto disponível
              </p>
              <p className="text-sm text-muted-foreground">
                Novos produtos serão adicionados em breve.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="mt-16 border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Fortal Store. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
