"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { gerarPix } from "@/utils/pix"
import { Check, Copy } from "lucide-react"
import {
  CreditCard,
  Smartphone,
  Banknote,
  QrCode,
} from "lucide-react"

interface CardData {
  number: string
  name: string
  expiry: string
  cvv: string
}

interface Address {
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  zipCode: string
  reference: string
}

interface PaymentFormProps {
  paymentMethod: string
  onPaymentMethodChange: (method: string) => void
  cardData: CardData
  onCardDataChange: (data: CardData) => void
  total: number
  tipo: string | null
  onTipoChange: (tipo: string) => void
  deliveryAddress: Address
  onDeliveryAddressChange: (address: Address) => void
  initialTipo: string | null
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

export function PaymentForm({
  paymentMethod,
  onPaymentMethodChange,
  cardData,
  onCardDataChange,
  total,
  tipo,
  onTipoChange,
  deliveryAddress,
  onDeliveryAddressChange,
  initialTipo,
}: PaymentFormProps) {
  const formTopRef = useRef<HTMLDivElement>(null)
  const [showPixCode, setShowPixCode] = useState(false)
  const [isLoadingCEP, setIsLoadingCEP] = useState(false)
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [cepError, setCepError] = useState("")
  const [selectedCardBrand, setSelectedCardBrand] = useState("")
  const [changeFor, setChangeFor] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [tipoDropdownOpen, setTipoDropdownOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const pixCode = gerarPix(
    "38873758827",
    "AçaidoChef",
    "Bebedouro",
    total,
    "PedidoOnline"
  )

  const handleAddressInputChange = (field: keyof Address, value: string) => {
    onDeliveryAddressChange({ ...deliveryAddress, [field]: value })
  }

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/(\d{5})(\d{3})/, "$1-$2")
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

      onDeliveryAddressChange({
        ...deliveryAddress,
        zipCode: formatZipCode(data.cep),
        street: data.logradouro || deliveryAddress.street,
        neighborhood: data.bairro || deliveryAddress.neighborhood,
        city: data.localidade || deliveryAddress.city,
        complement: data.complemento || deliveryAddress.complement,
      })

      setCepStatus("success")
      setIsLoadingCEP(false)

      setTimeout(() => {
        const numberInput = document.getElementById("number-payment")
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
      handleAddressInputChange("zipCode", formatted)
      const cleanCEP = formatted.replace(/\D/g, "")
      if (cleanCEP.length === 8) {
        searchCEP(formatted)
      } else {
        setCepStatus("idle")
        setCepError("")
      }
    }
  }

  const generatePixCode = () => {
    setShowPixCode(true)
  }

  const showAddressSection = tipo === "entrega" && initialTipo === "retirada"

  useEffect(() => {
    if (showAddressSection) {
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [tipo, initialTipo])

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0 pb-8">
      <div className="m-1 p-0 leading-none">
        <h1 className="text-xl font-bold text-center text-gray-800 m-0 p-0 leading-none">
          Selecione a Forma de Pagamento
        </h1>
        <p className="text-center text-gray-600 m-1 p-1 text-xs leading-none">
          Escolha uma das opções disponíveis para finalizar seu pedido com segurança.
        </p>
      </div>

      <div className="bg-blue-50 p-3 rounded-xl">
        <p className="text-sm text-blue-800">
          <span className="text-red-500">*</span> Selecione uma forma de pagamento para continuar
        </p>
      </div>

      <RadioGroup value={paymentMethod} onValueChange={onPaymentMethodChange}>
        {/* Cartão */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 border rounded-xl hover:bg-gray-50">
            <RadioGroupItem value="card" id="card" />
            <CreditCard className="w-5 h-5 text-blue-600" />
            <Label htmlFor="card" className="flex-1 cursor-pointer font-medium">
              Cartão de Crédito/Débito
            </Label>
          </div>

          {paymentMethod === "card" && (
            <div className="ml-8 space-y-4 p-4 bg-gray-50 rounded-xl">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center mb-3">
                  <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-800">Pagamento na Máquina</h3>
                </div>
                <p className="text-blue-700 text-sm mb-4">
                  O pagamento será processado na máquina de cartão no momento da <strong>{tipo === "entrega" ? "entrega" : "retirada"}</strong>.
                </p>
                <div className="mt-4 bg-white p-3 rounded-xl border border-blue-200">
                  <p className="text-xs text-blue-700">
                    <strong>Importante:</strong> Tenha seu cartão em mãos no momento da {tipo === "entrega" ? "entrega" : "retirada"}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PIX */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 border rounded-xl hover:bg-gray-50">
            <RadioGroupItem value="pix" id="pix" />
            <Smartphone className="w-5 h-5 text-purple-600" />
            <Label htmlFor="pix" className="flex-1 cursor-pointer font-medium">
              PIX
            </Label>
          </div>

          {paymentMethod === "pix" && (
            <div className="ml-8 space-y-4 p-4 bg-gray-50 rounded-xl">
              {showPixCode ? (
                <div className="text-center space-y-4">
                  <div className="bg-white p-4 rounded-xl border-2 border-dashed border-purple-300">
                    <QrCode className="w-24 h-24 mx-auto mb-4 text-purple-600" />
                    <p className="text-xs text-gray-600 mb-2">Código PIX:</p>
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      className="w-full text-xs font-mono bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl flex items-center justify-between min-h-[48px]"
                    >
                      <span className="break-all text-left flex-1">{pixCode}</span>
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600 ml-2" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500 ml-2" />
                      )}
                    </Button>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-xl">
                    <p className="text-sm text-yellow-800">
                      <strong>Importante:</strong> O pagamento deve ser realizado em até 30 minutos.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">Clique no botão abaixo para gerar o código PIX</p>
                  <Button onClick={generatePixCode} className="bg-purple-600 hover:bg-purple-700 rounded-xl">
                    <QrCode className="w-4 h-4 mr-2" />
                    Gerar Código PIX
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dinheiro */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 border rounded-xl hover:bg-gray-50">
            <RadioGroupItem value="cash" id="cash" />
            <Banknote className="w-5 h-5 text-green-600" />
            <Label htmlFor="cash" className="flex-1 cursor-pointer font-medium">
              Dinheiro
            </Label>
          </div>

          {paymentMethod === "cash" && (
            <div className="ml-8 space-y-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <Label htmlFor="changeFor" className="text-sm font-medium">
                  Precisa de troco para quanto?
                </Label>
                <Input
                  id="changeFor"
                  ref={inputRef}
                  placeholder="Ex: R$ 50,00"
                  className="mt-1 rounded-xl"
                  inputMode="numeric"
                  value={changeFor}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "")
                    const cents = Number(raw) / 100
                    setChangeFor(
                      isNaN(cents)
                        ? ""
                        : cents.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                    )
                  }}
                  onFocus={() => {
                    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
                  }}
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <p className="text-sm text-blue-800">
                  <strong>Lembre-se:</strong> Tenha o valor exato ou informe o valor para troco.
                </p>
              </div>
            </div>
          )}
        </div>
      </RadioGroup>
    </div>
  )
}
