// src/data/products.ts

export interface Product {
  id: number
  name: string
  description: string
  price: number
  image: string
  category: string
}

export const products: Product[] = [
  {
    id: 1,
    name: "Hambúrguer Clássico",
    description: "Pão artesanal, carne bovina 180g, queijo, alface, tomate e molho especial",
    price: 25.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "Hambúrgueres",
  },
  {
    id: 2,
    name: "Pizza Margherita",
    description: "Molho de tomate, mussarela, manjericão fresco e azeite",
    price: 32.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "Pizzas",
  },
  {
    id: 3,
    name: "Batata Frita",
    description: "Batatas crocantes temperadas com sal e ervas",
    price: 12.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "Acompanhamentos",
  },
  {
    id: 4,
    name: "Refrigerante Lata",
    description: "Coca-Cola, Guaraná ou Fanta - 350ml",
    price: 5.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "Bebidas",
  },
  {
    id: 5,
    name: "Hambúrguer Bacon",
    description: "Pão brioche, carne 200g, bacon crocante, queijo cheddar e cebola caramelizada",
    price: 29.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "Hambúrgueres",
  },
  {
    id: 6,
    name: "Suco Natural",
    description: "Laranja, limão ou maracujá - 400ml",
    price: 8.9,
    image: "/placeholder.svg?height=200&width=200",
    category: "Bebidas",
  },
]
