"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, Trash2, Home, Minus, Plus } from "lucide-react";
import { isRestaurantOpen } from "@/utils/business-hours";

const DEFAULT_DELIVERY_FEE = 0;
const round2 = (n: number) => Math.round(n * 100) / 100;
const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CarrinhoPage() {
  const router = useRouter();
  const { cart, removeItem, updateQuantity } = useCart();
  const cartItems = cart.items;
  const isOpen = isRestaurantOpen();

  const subtotal = useMemo(
    () =>
      round2(
        (cartItems ?? []).reduce(
          (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
          0
        )
      ),
    [cartItems]
  );

  const deliveryFee = useMemo(() => {
    if (cart?.tipo !== "entrega") return 0;
    const feeFromCart = (cart as any)?.deliveryFee;
    const fee = feeFromCart != null ? Number(feeFromCart) : DEFAULT_DELIVERY_FEE;
    return round2(Math.max(0, fee));
  }, [cart?.tipo, (cart as any)?.deliveryFee]);

  const total = useMemo(() => round2(subtotal + deliveryFee), [subtotal, deliveryFee]);

  const handleSeeProducts = () => {
    if (!isOpen) {
      router.push("/");
      return;
    }
    router.push("/produtos");
  };

  // 🔹 agora envia também o tipo para a página de produtos
  const handleFinalize = () => {
    if (!isOpen || cartItems.length === 0) return;
    const tipo = encodeURIComponent((cart?.tipo ?? "entrega").toString());
    router.push(`/produtos?tab=endereco&tipo=${tipo}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-sm">
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2 rounded-xl">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <ShoppingCart className="w-5 h-5 mr-1 text-gray-600" />
              <h1 className="text-lg font-bold text-gray-800">Carrinho</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-gray-800 text-xs rounded-xl"
            >
              <Home className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Menu Principal</span>
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-3 py-5 pb-20">
          {cartItems.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="text-center py-10 rounded-xl">
                <ShoppingCart className="w-14 h-14 mx-auto mb-3 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-600 mb-1">Carrinho vazio</h2>
                <p className="text-gray-500 mb-5">Adicione itens ao seu carrinho para continuar</p>
                <div className="space-y-2">
                  <Button onClick={handleSeeProducts} disabled={!isOpen} className="w-full text-sm py-2 px-4 rounded-xl">
                    Ver Produtos
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="w-full text-sm py-2 px-4 rounded-xl"
                  >
                    Voltar ao Menu Principal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => {
                const toppingsList = Array.isArray(item.toppings) ? item.toppings : [];
                const cremesList = Array.isArray(item.cremes) ? item.cremes : [];
                const extrasList = Array.isArray(item.extras) ? item.extras : [];

                return (
                  <Card key={item.id} className="rounded-xl">
                    <CardContent className="p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded"
                        />

                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-sm">{item.name}</h3>

                          {toppingsList.length > 0 && (
                            <p className="text-xs text-gray-600">
                              <strong>Acompanhamentos:</strong> {toppingsList.join(", ")}
                            </p>
                          )}

                          {cremesList.length > 0 && (
                            <p className="text-xs text-gray-600">
                              <strong>Cremes:</strong> {cremesList.join(", ")}
                            </p>
                          )}

                          {extrasList.length > 0 && (
                            <p className="text-xs text-gray-600">
                              <strong>Adicionais:</strong> {extrasList.join(", ")}
                            </p>
                          )}

                          <p className="text-green-600 font-bold text-sm mt-1">{fmtBRL(item.price)}</p>
                        </div>

                        {/* Ações à direita: quantidade + lixeira */}
                        <div className="self-stretch flex items-center justify-end gap-2">
                          <div className="inline-flex items-center rounded-xl border px-2 py-1 gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity ?? 1) - 1))}
                              className={`p-1 ${!isOpen ? "opacity-40 cursor-not-allowed" : ""}`}
                              aria-label="Diminuir quantidade"
                              title="Diminuir quantidade"
                              disabled={!isOpen}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="min-w-[2ch] text-center">{item.quantity ?? 1}</span>
                            <button
                              onClick={() => updateQuantity(item.id, (item.quantity ?? 1) + 1)}
                              className={`p-1 ${!isOpen ? "opacity-40 cursor-not-allowed" : ""}`}
                              aria-label="Aumentar quantidade"
                              title="Aumentar quantidade"
                              disabled={!isOpen}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            aria-label="Remover item"
                            title="Remover item"
                            disabled={!isOpen}
                            className={`w-10 h-10 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 ${
                              !isOpen ? "opacity-40 pointer-events-none" : ""
                            }`}
                          >
                            <Trash2 className="w-6 h-6" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="rounded-xl">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{fmtBRL(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Taxa de entrega:</span>
                      <span>{fmtBRL(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base">
                      <span>Total:</span>
                      <span className="text-green-600">{fmtBRL(total)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mt-3">
                    <Button
                      className="w-full text-sm py-2 rounded-xl"
                      onClick={handleFinalize}
                      disabled={cartItems.length === 0 || !isOpen}
                    >
                      Finalizar Compra
                    </Button>

                    <Button
                      className="w-full text-sm py-2 rounded-xl"
                      onClick={() => router.push("/produtos")}
                      disabled={!isOpen}
                    >
                      Continuar Comprando
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full bg-transparent text-sm py-2 rounded-xl"
                      onClick={() => router.push("/")}
                    >
                      Voltar ao Menu Principal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
