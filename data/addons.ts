// src/data/addons.ts

export interface Extras {
  id: number
  name: string
  price: number
}

export const addons: Extras[] = [
  // R$ 2,00
  { id: 1, name: "Leite Condensado", price: 2.0 },
  { id: 2, name: "Leite Ninho", price: 2.0 },
  { id: 3, name: "Paçoca", price: 2.0 },
  { id: 4, name: "Granola", price: 2.0 },
  { id: 5, name: "Confete", price: 2.0 },
  { id: 6, name: "Ovomaltine", price: 2.0 },
  { id: 7, name: "Farinha Láctea", price: 2.0 },
  { id: 8, name: "Chocoboll", price: 2.0 },
  { id: 9, name: "Gotas de Chocolate", price: 2.0 },
  { id: 10, name: "Amendoim", price: 2.0 },
  { id: 11, name: "Mel", price: 2.0 },
  { id: 12, name: "Oreo", price: 2.0 },
  { id: 13, name: "Bis Branco", price: 2.0 },
  { id: 14, name: "Bis Preto", price: 2.0 },
  { id: 15, name: "Banana", price: 2.0 },
  { id: 16, name: "Uva", price: 2.0 },

  // R$ 3,00
  { id: 17, name: "Morango", price: 3.0 },
  { id: 18, name: "Kiwi", price: 3.0 },
  { id: 19, name: "Kit Kat", price: 3.0 },
  { id: 20, name: "Bombom Ouro Branco", price: 3.0 },
  { id: 21, name: "Bombom Sonho de Valsa", price: 3.0 },

  // R$ 4,00
  { id: 22, name: "Creme de Avelã", price: 4.0 },
  { id: 23, name: "Prestígio", price: 4.0 },
  { id: 24, name: "Creme de Leite Ninho", price: 4.0 },
  { id: 25, name: "Chocowaffer Branco", price: 4.0 },
]
