// src/data/addons.ts

export interface Extras {
  id: number
  name: string
  price: number
  imageUrl: string
}

export const addons: Extras[] = [
  // R$ 2,00
  { id: 1, name: "Leite Condensado", price: 2.0, imageUrl: "/images/addons/leite-condensado.avif" },
  { id: 2, name: "Leite Ninho", price: 2.0, imageUrl: "/images/addons/leite-ninho.avif" },
  { id: 3, name: "Paçoca", price: 2.0, imageUrl: "/images/addons/pacoca.avif" },
  { id: 4, name: "Granola", price: 2.0, imageUrl: "/images/addons/granola.avif" },
  { id: 5, name: "Confete", price: 2.0, imageUrl: "/images/addons/confete.avif" },
  { id: 6, name: "Ovomaltine", price: 2.0, imageUrl: "/images/addons/ovomaltine.avif" },
  { id: 7, name: "Farinha Láctea", price: 2.0, imageUrl: "/images/addons/farinha-lactea.avif" },
  { id: 8, name: "Chocoboll", price: 2.0, imageUrl: "/images/addons/chocoboll.avif" },
  { id: 9, name: "Gotas de Chocolate", price: 2.0, imageUrl: "/images/addons/gotas-de-chocolate.avif" },
  { id: 10, name: "Amendoim", price: 2.0, imageUrl: "/images/addons/amendoim.avif" },
  { id: 11, name: "Mel", price: 2.0, imageUrl: "/images/addons/mel.avif" },
  { id: 12, name: "Oreo", price: 2.0, imageUrl: "/images/addons/oreo.avif" },
  { id: 13, name: "Bis Branco", price: 2.0, imageUrl: "/images/addons/bis-branco.avif" },
  { id: 14, name: "Bis Preto", price: 2.0, imageUrl: "/images/addons/bis-preto.avif" },
  { id: 15, name: "Banana", price: 2.0, imageUrl: "/images/addons/banana.avif" },
  { id: 16, name: "Uva", price: 2.0, imageUrl: "/images/addons/uva.avif" },

  // R$ 3,00
  { id: 17, name: "Morango", price: 3.0, imageUrl: "/images/addons/morango.avif" },
  { id: 18, name: "Kiwi", price: 3.0, imageUrl: "/images/addons/kiwi.avif" },
  { id: 19, name: "Kit Kat", price: 3.0, imageUrl: "/images/addons/kit-kat.avif" },
  { id: 20, name: "Bombom Ouro Branco", price: 3.0, imageUrl: "/images/addons/bombom-ouro-branco.avif" },
  { id: 21, name: "Bombom Sonho de Valsa", price: 3.0, imageUrl: "/images/addons/bombom-sonho-de-valsa.avif" },

  // R$ 4,00
  { id: 22, name: "Creme de Avelã", price: 4.0, imageUrl: "/images/addons/creme-de-avela.avif" },
  { id: 23, name: "Prestígio", price: 4.0, imageUrl: "/images/addons/prestigio.avif" },
  { id: 24, name: "Creme de Leite Ninho", price: 4.0, imageUrl: "/images/addons/creme-de-leite-ninho.avif" },
  { id: 25, name: "Chocowaffer Branco", price: 4.0, imageUrl: "/images/addons/chocowaffer-branco.avif" },
]
