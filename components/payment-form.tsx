"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import {
  CreditCard,
  Smartphone,
  Banknote,
  QrCode,
  Store,
  Truck,
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
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

  const handleAddressInputChange = (field: keyof Address, value: string) => {
    onDeliveryAddressChange({ ...deliveryAddress, [field]: value })
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

      // Focar no campo número após preencher
      setTimeout(() => {
        const numberInput = document.getElementById("number-payment")
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
      handleAddressInputChange("zipCode", formatted)

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

  const generatePixCode = () => {
    setShowPixCode(true)
  }

  // Mostrar seção de endereço apenas se for entrega E o tipo inicial for retirada
  const showAddressSection = tipo === "entrega" && initialTipo === "retirada"

  useEffect(() => {
  if (tipo === "entrega" && initialTipo === "retirada") {
        formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, [tipo, initialTipo])

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0 pb-8">
      {/* Seleção de Tipo de Pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Tipo de Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={tipo || ""} onValueChange={onTipoChange}>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="retirada" id="retirada-payment" />
              <Store className="w-5 h-5 text-blue-600" />
              <Label htmlFor="retirada-payment" className="flex-1 cursor-pointer font-medium">
                Retirada na Loja
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="entrega" id="entrega-payment" />
              <Truck className="w-5 h-5 text-green-600" />
              <Label htmlFor="entrega-payment" className="flex-1 cursor-pointer font-medium">
                Entrega (+R$ 5,00)
              </Label>
            </div>
          </RadioGroup>

          {tipo === "retirada" && (
            <div className="mt-4 bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Store className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-800">Informações para Retirada</h3>
              </div>
              <p className="text-blue-700 text-sm">
                <strong>Endereço:</strong> Rua das Flores, 123 - Centro, São Paulo/SP
                <br />
                <strong>Horário:</strong> Segunda a Sexta: 11h às 22h | Sábado e Domingo: 12h às 23h
                <br />
                <strong>Tempo de preparo:</strong> Aproximadamente 20-30 minutos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerta de Endereço Obrigatório */}
      {showAddressSection &&
        (!deliveryAddress.street ||
          !deliveryAddress.number ||
          !deliveryAddress.neighborhood ||
          !deliveryAddress.city ||
          !deliveryAddress.zipCode) && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-orange-800">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">Endereço de entrega obrigatório</p>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                Para continuar com a entrega, preencha todos os campos obrigatórios do endereço abaixo.
              </p>
            </CardContent>
          </Card>
        )}

      {/* Endereço de Entrega (apenas se entrega E tipo inicial for retirada) */}
      {showAddressSection && (
        <div ref={formTopRef}>
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-green-600 mr-2" />
                <CardTitle className="text-lg sm:text-xl">Endereço de Entrega</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="zipCode-payment" className="text-sm font-medium">
                    CEP <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="zipCode-payment"
                      placeholder="00000-000"
                      value={deliveryAddress.zipCode}
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
                  <Label htmlFor="street-payment" className="text-sm font-medium">
                    Rua/Avenida <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="street-payment"
                    placeholder="Nome da rua"
                    value={deliveryAddress.street}
                    onChange={(e) => handleAddressInputChange("street", e.target.value)}
                    className="mt-1"
                    disabled={isLoadingCEP}
                  />
                </div>

                <div>
                  <Label htmlFor="number-payment" className="text-sm font-medium">
                    Número <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="number-payment"
                    placeholder="123"
                    value={deliveryAddress.number}
                    onChange={(e) => handleAddressInputChange("number", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="complement-payment" className="text-sm font-medium">
                    Complemento
                  </Label>
                  <Input
                    id="complement-payment"
                    placeholder="Apto, Bloco, etc."
                    value={deliveryAddress.complement}
                    onChange={(e) => handleAddressInputChange("complement", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="neighborhood-payment" className="text-sm font-medium">
                    Bairro <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="neighborhood-payment"
                    placeholder="Nome do bairro"
                    value={deliveryAddress.neighborhood}
                    onChange={(e) => handleAddressInputChange("neighborhood", e.target.value)}
                    className="mt-1"
                    disabled={isLoadingCEP}
                  />
                </div>

                <div>
                  <Label htmlFor="city-payment" className="text-sm font-medium">
                    Cidade <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city-payment"
                    placeholder="Nome da cidade"
                    value={deliveryAddress.city}
                    onChange={(e) => handleAddressInputChange("city", e.target.value)}
                    className="mt-1"
                    disabled={isLoadingCEP}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="reference-payment" className="text-sm font-medium">
                    Ponto de Referência
                  </Label>
                  <Textarea
                    id="reference-payment"
                    placeholder="Ex: Próximo ao supermercado, portão azul..."
                    value={deliveryAddress.reference}
                    onChange={(e) => handleAddressInputChange("reference", e.target.value)}
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Forma de Pagamento */}
      <Card>
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg sm:text-xl">Forma de Pagamento</CardTitle>
          <p className="text-sm text-gray-600">
            Total: <span className="font-bold text-green-600">R$ {total.toFixed(2).replace(".", ",")}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="text-red-500">*</span> Selecione uma forma de pagamento para continuar
            </p>
          </div>

          <RadioGroup value={paymentMethod} onValueChange={onPaymentMethodChange}>
            {/* Cartão de Crédito/Débito */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="card" id="card" />
                <CreditCard className="w-5 h-5 text-blue-600" />
                <Label htmlFor="card" className="flex-1 cursor-pointer font-medium">
                  Cartão de Crédito/Débito
                </Label>
              </div>

              {paymentMethod === "card" && (
                <div className="ml-8 space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center mb-3">
                      <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-blue-800">Pagamento na Máquina</h3>
                    </div>
                    <p className="text-blue-700 text-sm mb-4">
                      O pagamento será processado na máquina de cartão no momento da{" "}
                      <strong>{tipo === "entrega" ? "entrega" : "retirada"}</strong>.
                    </p>                    

                    <div className="mt-4 bg-white p-3 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700">
                        <strong>Importante:</strong> Tenha seu cartão em mãos no momento da{" "}
                        {tipo === "entrega" ? "entrega" : "retirada"}. Aceitamos pagamento por aproximação
                        (contactless), chip e senha, ou tarja magnética.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PIX */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="pix" id="pix" />
                <Smartphone className="w-5 h-5 text-purple-600" />
                <Label htmlFor="pix" className="flex-1 cursor-pointer font-medium">
                  PIX
                </Label>
              </div>

              {paymentMethod === "pix" && (
                <div className="ml-8 space-y-4 p-4 bg-gray-50 rounded-lg">
                  {!showPixCode ? (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-4">Clique no botão abaixo para gerar o código PIX</p>
                      <Button onClick={generatePixCode} className="bg-purple-600 hover:bg-purple-700">
                        <QrCode className="w-4 h-4 mr-2" />
                        Gerar Código PIX
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="bg-white p-4 rounded-lg border-2 border-dashed border-purple-300">
                        <QrCode className="w-24 h-24 mx-auto mb-4 text-purple-600" />
                        <p className="text-xs text-gray-600 mb-2">Código PIX:</p>
                        <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                          00020126580014BR.GOV.BCB.PIX013636297073-0001-0000-0000-000000000000520400005303986540
                          {total.toFixed(2)}5802BR5925RESTAURANTE SABOR LTDA6009SAO PAULO62070503***6304ABCD
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Importante:</strong> O pagamento deve ser realizado em até 30 minutos.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dinheiro */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="cash" id="cash" />
                <Banknote className="w-5 h-5 text-green-600" />
                <Label htmlFor="cash" className="flex-1 cursor-pointer font-medium">
                  Dinheiro
                </Label>
              </div>

              {paymentMethod === "cash" && (
                <div className="ml-8 space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="changeFor" className="text-sm font-medium">
                      Precisa de troco para quanto?
                    </Label>
                    <Input
                      id="changeFor"
                      placeholder="Ex: R$ 50,00"
                      className="mt-1"
                      type="number"
                      step="0.01"
                      min={total}
                    />
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Lembre-se:</strong> Tenha o valor exato ou informe o valor para troco.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  )
}
