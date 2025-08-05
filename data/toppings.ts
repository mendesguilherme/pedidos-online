// src/data/toppings.ts

export interface Topping {
  id: number
  name: string
  imageUrl: string
}

export const toppings: Topping[] = [
  { id: 1, name: "Leite Condensado", imageUrl: "/images/addons/leite-condensado.avif" },
  { id: 2, name: "Leite Ninho", imageUrl: "/images/addons/leite-ninho.avif" },
  { id: 3, name: "Paçoca", imageUrl: "/images/addons/pacoca.avif" },
  { id: 4, name: "Granola", imageUrl: "/images/addons/granola.avif" },
  { id: 5, name: "Confete", imageUrl: "/images/addons/confete.avif" },
  { id: 6, name: "Ovomaltine", imageUrl: "/images/addons/ovomaltine.avif" },
  { id: 7, name: "Farinha Láctea", imageUrl: "/images/addons/farinha-lactea.avif" },
  { id: 8, name: "Chocoboll", imageUrl: "/images/addons/chocoboll.avif" },
  { id: 9, name: "Amendoim", imageUrl: "/images/addons/amendoim.avif" },
  { id: 10, name: "Gotas de Chocolate", imageUrl: "/images/addons/gotas-de-chocolate.avif" },
  { id: 11, name: "Mel", imageUrl: "/images/addons/mel.avif" },
  { id: 12, name: "Uva", imageUrl: "/images/addons/uva.avif" },
  { id: 13, name: "Banana", imageUrl: "/images/addons/banana.avif" },
  { id: 14, name: "Morango", imageUrl: "/images/addons/morango.avif" },
  { id: 15, name: "Kiwi", imageUrl: "/images/addons/kiwi.avif" },
]
