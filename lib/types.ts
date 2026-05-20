export interface SizeStock {
  size: string
  quantity: number
}

export interface Product {
  id: string
  name: string
  team: string
  price: number
  description: string
  sizes: SizeStock[]
  imageUrl: string
  createdAt: string
}

export interface CartItem {
  id: string
  productId: string
  name: string
  team: string
  price: number
  imageUrl: string
  size: string
  quantity: number
}

export type PaymentMethod = "pix" | "cartao"
export type DeliveryMethod = "moto-uber" | "retirada"
export type OrderStatus = "novo" | "visualizado"

export interface OrderAddress {
  street: string
  number: string
  neighborhood: string
  reference?: string
}

export interface OrderCustomer {
  name: string
  whatsapp: string
}

export interface Order {
  id: string
  customer: OrderCustomer
  paymentMethod: PaymentMethod
  deliveryMethod: DeliveryMethod
  address: OrderAddress | null
  notes: string
  items: CartItem[]
  totalItems: number
  totalPrice: number
  status: OrderStatus
  createdAt: string
}

export interface OrderNote {
  id: string
  title: string
  reference?: string
  content: string
  createdAt: string
  updatedAt: string
  orderId?: string | null
  customerName?: string | null
}

export interface StoredPushSubscription {
  endpoint: string
  expirationTime: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushSubscriptionRecord {
  id: string
  subscription: StoredPushSubscription
  deviceName: string
  userAgent: string
  createdAt: string
  updatedAt: string
}
