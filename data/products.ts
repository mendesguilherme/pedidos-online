// src/data/products.ts  (ou o arquivo onde você define `acaiCups`)

export interface CupSizeOption {
  id: number
  name: string
  description: string
  price: number
  image: string
  maxToppings: number
  volumeMl: number
}

/** Versão com whitelists por ID (opcionais) */
export interface CupSizeOptionWithLimits extends CupSizeOption {
  allowedToppingIds?: number[]
  allowedAddonIds?: number[]
  /** nº de cremes obrigatórios para este copo (0 = não exige) */
  requiredCreams?: number
  /** se definido, restringe os cremes possíveis por ID */
  allowedCreamIds?: number[]
}

export type AcaiCup = CupSizeOption | CupSizeOptionWithLimits

export const acaiCups: AcaiCup[] = [
  {
    id: 1,
    name: "Copo de Açaí 330ml",
    description: "Monte com até 3 acompanhamentos",
    price: 15.0,
    image: "/images/330.webp",
    maxToppings: 3,
    volumeMl: 330,
  },
  {
    id: 2,
    name: "Copo de Açaí 550ml",
    description: "Monte com até 3 acompanhamentos",
    price: 20.0,
    image: "/images/550.webp",
    maxToppings: 3,
    volumeMl: 550,
  },
  {
    id: 3,
    name: "Copo de Açaí 770ml",
    description: "Monte com até 4 acompanhamentos",
    price: 26.0,
    image: "/images/770.webp",
    maxToppings: 4,
    volumeMl: 770,
  },
  {
    id: 4,
    name: "Copo de Fondue 330ml",
    description: "Monte com até 3 acompanhamentos",
    price: 24.0,
    image: "/images/330.webp",
    maxToppings: 3,
    volumeMl: 330,
    
    allowedToppingIds: [12, 13, 14, 15],
    allowedAddonIds:   [],
    
    requiredCreams: 2,
    allowedCreamIds: [1, 2, 3, 4], 
  },
]
