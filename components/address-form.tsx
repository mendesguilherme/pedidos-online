"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useCart } from "@/context/CartContext"
import type { Address } from "@/data/cart"

interface AddressFormProps {
  tipo: string | null
  pickupTime?: string
  onPickupTimeChange?: (time: string) => void
}

interface ViaCEPResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export function AddressForm({ tipo }: AddressFormProps) {
  const { cart, updateAddress } = useCart()

  const [isLoadingCEP, setIsLoadingCEP] = useState(false)
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [cepError, setCepError] = useState("")

  const address: Address = cart.deliveryAddress || {
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    zipCode: "",
    reference: "",
  }

  const handleInputChange = (field: keyof Address, value: string) => {
    updateAddress({ ...address, [field]: value })
  }

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/(\d{5})(\d{3})/, "$1-$2")
  }

  const searchCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, "")
    if (cleanCEP.length !== 8) {
      setCepStatus("idle")
      setCepError("")
      return
    }

    setIsLoadingCEP(true)
    setCepStatus("loading")
    setCepError("")

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
      const data: ViaCEPResponse = await response.json()

      if (data.erro) {
        setCepStatus("error")
        setCepError("CEP não encontrado")
        setIsLoadingCEP(false)
        return
      }

      updateAddress({
        ...address,
        zipCode: formatZipCode(data.cep),
        street: data.logradouro || address.street,
        neighborhood: data.bairro || address.neighborhood,
        city: data.localidade || address.city,
        complement: data.complemento || address.complement,
      })

      setCepStatus("success")
      setIsLoadingCEP(false)

      setTimeout(() => {
        const numberInput = document.getElementById("number")
        if (numberInput) numberInput.focus()
      }, 100)
    } catch (error) {
      setCepStatus("error")
      setCepError("Erro ao buscar CEP. Tente novamente.")
      setIsLoadingCEP(false)
    }
  }

  const handleZipCodeChange = (value: string) => {
    const formatted = formatZipCode(value)
    if (formatted.length <= 9) {
      handleInputChange("zipCode", formatted)

      const cleanCEP = formatted.replace(/\D/g, "")
      if (cleanCEP.length === 8) {
        searchCEP(formatted)
      } else {
        setCepStatus("idle")
        setCepError("")
      }
    }
  }

  return (
    <div className="address-fields space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="m-1 p-0 leading-none">
        <h1 className="text-xl font-bold text-center text-gray-800 m-0 p-0 leading-none">
          Informe seu Endereço
        </h1>
        <p className="text-center text-gray-600 m-1 p-1 text-xs leading-none">
          Preencha os campos abaixo para receber seu pedido com segurança.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          <div className="col-span-full">
            <Label htmlFor="zipCode" className="text-sm font-medium">CEP <span className="text-red-500">*</span></Label>
            <div className="relative mt-1">
              <Input
                id="zipCode"
                placeholder="00000-000"
                value={address.zipCode}
                onChange={(e) => handleZipCodeChange(e.target.value)}
                className={`rounded-xl pr-10 ${
                  cepStatus === "success"
                    ? "border-green-500"
                    : cepStatus === "error"
                    ? "border-red-500"
                    : ""
                }`}
                maxLength={9}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {cepStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                {cepStatus === "success" && <CheckCircle className="w-4 h-4 text-green-500" />}
                {cepStatus === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
              </div>
            </div>
            {cepStatus === "success" && (
              <p className="text-xs text-green-600 mt-1">CEP encontrado! Campos preenchidos automaticamente.</p>
            )}
            {cepStatus === "error" && <p className="text-xs text-red-500 mt-1">{cepError}</p>}
            <p className="text-xs text-gray-500 mt-1">Digite o CEP para preenchimento automático</p>
          </div>

          <InputField id="street" label="Rua/Avenida" required value={address.street} onChange={handleInputChange} disabled={isLoadingCEP} />
          <InputField id="number" label="Número" required value={address.number} onChange={handleInputChange} />
          <InputField id="complement" label="Complemento" value={address.complement} onChange={handleInputChange} />
          <InputField id="neighborhood" label="Bairro" required value={address.neighborhood} onChange={handleInputChange} disabled={isLoadingCEP} />
          <InputField id="city" label="Cidade" required value={address.city} onChange={handleInputChange} disabled={isLoadingCEP} />

          <div className="col-span-full">
            <Label htmlFor="reference" className="text-sm font-medium">Ponto de Referência</Label>
            <Textarea
              id="reference"
              placeholder="Ex: Próximo ao supermercado, portão azul..."
              value={address.reference}
              onChange={(e) => handleInputChange("reference", e.target.value)}
              className="resize-none rounded-xl"
              rows={3}
            />
          </div>
        </div>

        <div className="bg-green-50 p-3 rounded-xl border border-green-200">
          <h3 className="font-semibold text-green-800 mb-1">Taxa de Entrega:</h3>
          <p className="text-green-700 text-sm sm:text-base">R$ 5,00 - Tempo estimado: 30-45 minutos</p>
        </div>
      </div>
    </div>
  )
}

function InputField({ id, label, value, onChange, required = false, disabled = false }: any) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(id, e.target.value)}
        disabled={disabled}
        className="rounded-xl"
      />
    </div>
  )
}
