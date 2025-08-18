// data/cart.ts

export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
  toppings: string[]   // Acompanhamentos obrigatórios
  extras: string[]     // Adicionais opcionais
  cremes?: string[]
}

export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  zipCode: string
  reference?: string
}

export interface Cart {
  items: CartItem[]
  deliveryAddress: Address | null
  paymentMethod: string  
  tipo: "entrega" | "retirada" | null
}
