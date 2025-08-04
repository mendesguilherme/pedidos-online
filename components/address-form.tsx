"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface Address {
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  zipCode: string
  reference: string
}

interface AddressFormProps {
  tipo: string | null
  address: Address
  onAddressChange: (address: Address) => void
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

export function AddressForm({ tipo, address, onAddressChange }: AddressFormProps) {
  const [isLoadingCEP, setIsLoadingCEP] = useState(false)
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [cepError, setCepError] = useState("")

  const handleInputChange = (field: keyof Address, value: string) => {
    onAddressChange({ ...address, [field]: value })
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

      // Preencher os campos automaticamente
      onAddressChange({
        ...address,
        zipCode: formatZipCode(data.cep),
        street: data.logradouro || address.street,
        neighborhood: data.bairro || address.neighborhood,
        city: data.localidade || address.city,
        complement: data.complemento || address.complement,
      })

      setCepStatus("success")
      setIsLoadingCEP(false)

      // Focar no campo número após preencher
      setTimeout(() => {
        const numberInput = document.getElementById("number")
        if (numberInput) {
          numberInput.focus()
        }
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

      // Buscar CEP automaticamente quando completo
      const cleanCEP = formatted.replace(/\D/g, "")
      if (cleanCEP.length === 8) {
        searchCEP(formatted)
      } else {
        setCepStatus("idle")
        setCepError("")
      }
    }
  }

  // Adicionar validação no início do componente
  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <Card>
        <CardHeader className="text-center pb-4">
          <MapPin className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-green-600" />
          <CardTitle className="text-lg sm:text-xl">Endereço de Entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="zipCode" className="text-sm font-medium">
                CEP <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Input
                  id="zipCode"
                  placeholder="00000-000"
                  value={address.zipCode}
                  onChange={(e) => handleZipCodeChange(e.target.value)}
                  className={`pr-10 ${
                    cepStatus === "success" ? "border-green-500" : cepStatus === "error" ? "border-red-500" : ""
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

            <div className="sm:col-span-2">
              <Label htmlFor="street" className="text-sm font-medium">
                Rua/Avenida <span className="text-red-500">*</span>
              </Label>
              <Input
                id="street"
                placeholder="Nome da rua"
                value={address.street}
                onChange={(e) => handleInputChange("street", e.target.value)}
                className="mt-1"
                disabled={isLoadingCEP}
              />
            </div>

            <div>
              <Label htmlFor="number" className="text-sm font-medium">
                Número <span className="text-red-500">*</span>
              </Label>
              <Input
                id="number"
                placeholder="123"
                value={address.number}
                onChange={(e) => handleInputChange("number", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="complement" className="text-sm font-medium">
                Complemento
              </Label>
              <Input
                id="complement"
                placeholder="Apto, Bloco, etc."
                value={address.complement}
                onChange={(e) => handleInputChange("complement", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="neighborhood" className="text-sm font-medium">
                Bairro <span className="text-red-500">*</span>
              </Label>
              <Input
                id="neighborhood"
                placeholder="Nome do bairro"
                value={address.neighborhood}
                onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                className="mt-1"
                disabled={isLoadingCEP}
              />
            </div>

            <div>
              <Label htmlFor="city" className="text-sm font-medium">
                Cidade <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                placeholder="Nome da cidade"
                value={address.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className="mt-1"
                disabled={isLoadingCEP}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="reference" className="text-sm font-medium">
                Ponto de Referência
              </Label>
              <Textarea
                id="reference"
                placeholder="Ex: Próximo ao supermercado, portão azul..."
                value={address.reference}
                onChange={(e) => handleInputChange("reference", e.target.value)}
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Taxa de Entrega:</h3>
            <p className="text-green-700 text-sm sm:text-base">R$ 5,00 - Tempo estimado: 30-45 minutos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
