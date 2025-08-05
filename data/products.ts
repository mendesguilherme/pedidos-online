// data/acaiCups.ts
export interface CupSizeOption {
  id: number
  name: string
  description: string
  price: number
  image: string
  maxToppings: number
  volumeMl: number
}

export const acaiCups: CupSizeOption[] = [
  {
    id: 1,
    name: "Copo de Açaí 330ml",
    description: "Monte com até 3 acompanhamentos",
    price: 15.0,
    image: "/images/acai330.jpg",
    maxToppings: 3,
    volumeMl: 330,
  },
  {
    id: 2,
    name: "Copo de Açaí 550ml",
    description: "Monte com até 3 acompanhamentos",
    price: 20.0,
    image: "/images/acai550.jpg",
    maxToppings: 3,
    volumeMl: 550,
  },
  {
    id: 3,
    name: "Copo de Açaí 770ml",
    description: "Monte com até 4 acompanhamentos",
    price: 26.0,
    image: "/images/acai770.jpg",
    maxToppings: 4,
    volumeMl: 770,
  },
]
