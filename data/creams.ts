// src/data/creams.ts
export interface Cream {
  id: number
  name: string
  imageUrl: string
}

export const creams: Cream[] = [
  { id: 1, name: "Creme de Amendoim",        imageUrl: "/images/addons/creme-pacoca-amendoim.avif" },
  { id: 2, name: "Creme de Trufa ao Leite",  imageUrl: "/images/addons/creme-trufa-leite.avif" },
  { id: 3, name: "Creme de Leite Ninho",     imageUrl: "/images/addons/creme-de-leite-ninho.avif" },
  { id: 4, name: "Chocowaffer Branco",       imageUrl: "/images/addons/chocowaffer-branco.avif" },
]
