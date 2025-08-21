"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { NavigationTabs } from "@/components/navigation-tabs";
import { AddressForm } from "@/components/address-form";
import { PaymentForm } from "@/components/payment-form";
import { CartEmptyWarning } from "@/components/cart-empty-warning";
import { OrderSummary } from "@/components/order-summary";
import { BottomNavigation } from "@/components/bottom-navigation";

// ✅ tipos e dados de produtos vêm do hook (client-safe)
import { useProducts, type AcaiCup, type CupSizeOptionWithLimits } from "@/hooks/use-products";

// 🔽 hooks padronizados ({ data, isLoading, error })
import { useAddons } from "@/hooks/use-addons";
import { useCreams } from "@/hooks/use-creams";
import { useToppings, type Topping } from "@/hooks/use-toppings";

import { AcaiCupSelector } from "@/components/AcaiCupSelector";
import { useCart } from "@/context/CartContext";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/context/OrderContext";

export default function ProdutosPage() {
  // PRODUCTS (copos)
  const {
    data: cupsData,
    isLoading: cupsLoading,
    error: cupsError,
  } = useProducts();
  const cupsDb = cupsData ?? [];

  // ADDONS
  const {
    data: addonsData,
    isLoading: addonsLoading,
    error: addonsError,
  } = useAddons();
  const addonsDb = addonsData ?? [];

  // CREAMS
  const {
    data: creamsData,
    isLoading: creamsLoading,
    error: creamsError,
  } = useCreams();
  const creams = creamsData ?? [];

  // TOPPINGS
  const {
    data: toppingsData,
    isLoading: toppingsLoading,
    error: toppingsError,
  } = useToppings();
  const toppingsDb = toppingsData ?? [];

  const { refreshOrders } = useOrders();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const { saveOrder, clearCart } = useCart();
  const router = useRouter();
  const { cart, addItem } = useCart();

  const toppingsRef = useRef<HTMLDivElement | null>(null);
  const creamsRef = useRef<HTMLDivElement | null>(null);
  const addonsRef = useRef<HTMLDivElement | null>(null);

  const searchParams = useSearchParams();

  // tipo inicial
  const initialTipo = (searchParams.get("tipo") || "entrega").toString();
  const [tipo, setTipo] = useState(initialTipo);

  // 🔹 ativa a aba inicial com base na URL (?tab=...)
  const allowedTabs = new Set(["produtos", "endereco", "pagamento"]);
  const tabParam = (searchParams.get("tab") || "produtos").toString();
  const initialTab = allowedTabs.has(tabParam) ? tabParam : "produtos";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // 🔹 mantém o estado sincronizado se a URL mudar (ex.: push/replace externos)
  useEffect(() => {
    const urlTab = (searchParams.get("tab") || "produtos").toString();
    if (allowedTabs.has(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Copo selecionado
  const [selectedCup, setSelectedCup] = useState<AcaiCup | null>(null);

  // Estados por ID
  const [selectedToppingIds, setSelectedToppingIds] = useState<number[]>([]);
  const [selectedExtraIds, setSelectedExtraIds] = useState<number[]>([]);
  const [selectedCreamIds, setSelectedCreamIds] = useState<number[]>([]);
  const maxToppings = selectedCup?.maxToppings ?? 0;

  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    zipCode: "",
    reference: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cardData, setCardData] = useState({ number: "", name: "", expiry: "", cvv: "" });

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleCupSelect = (cup: AcaiCup) => {
    setSelectedCup(cup);
    setSelectedToppingIds([]);
    setSelectedExtraIds([]);
    setSelectedCreamIds([]);

    setTimeout(() => {
      if (toppingsRef.current) {
        const yOffset = -100;
        const y = toppingsRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 100);
  };

  // Helpers do copo
  const cupCfg = (selectedCup ?? null) as CupSizeOptionWithLimits | null;
  const requiredCreams = cupCfg?.requiredCreams ?? 0;

  // ---------- filtros ----------
  const visibleToppings: Topping[] = useMemo(() => {
    if (!selectedCup) return [];
    const allow = (selectedCup as CupSizeOptionWithLimits).allowedToppingIds;
    return Array.isArray(allow) && allow.length ? toppingsDb.filter((t) => allow.includes(t.id)) : toppingsDb;
  }, [selectedCup, toppingsDb]);

  const visibleAddons = useMemo(() => {
    if (!selectedCup) return [];
    const allow = (selectedCup as CupSizeOptionWithLimits).allowedAddonIds;
    if (Array.isArray(allow)) {
      if (allow.length === 0) return [];
      return addonsDb.filter((a) => allow.includes(a.id));
    }
    return addonsDb;
  }, [selectedCup, addonsDb]);

  const visibleCreams = useMemo(() => {
    if (!requiredCreams) return [];
    const allow = (selectedCup as CupSizeOptionWithLimits)?.allowedCreamIds;
    if (Array.isArray(allow) && allow.length) {
      return creams.filter((c) => allow.includes(c.id));
    }
    return creams;
  }, [selectedCup, requiredCreams, creams]);

  // ---------- toggles ----------
  const handleToppingToggle = (toppingId: number) => {
    if (!selectedCup) return;
    const max = selectedCup.maxToppings;
    if (selectedToppingIds.includes(toppingId)) {
      setSelectedToppingIds(selectedToppingIds.filter((id) => id !== toppingId));
    } else if (selectedToppingIds.length < max) {
      setSelectedToppingIds([...selectedToppingIds, toppingId]);
    }
  };

  const handleExtraToggle = (extraId: number) => {
    if (selectedExtraIds.includes(extraId)) {
      setSelectedExtraIds(selectedExtraIds.filter((id) => id !== extraId));
    } else {
      setSelectedExtraIds([...selectedExtraIds, extraId]);
    }
  };

  const toggleCream = (id: number) => {
    if (!requiredCreams) return;
    setSelectedCreamIds((prev) => {
      const has = prev.includes(id);
      if (has) return prev.filter((x) => x !== id);
      if (prev.length >= requiredCreams) return prev;
      return [...prev, id];
    });
  };

  const handleAddToCart = (force = false) => {
    if (!selectedCup) return;

    const toppingsOk = selectedToppingIds.length === selectedCup.maxToppings;
    const creamsOk = requiredCreams ? selectedCreamIds.length === requiredCreams : true;
    if (!force && (!toppingsOk || !creamsOk)) return;

    const toppingNames = selectedToppingIds
      .map((id) => visibleToppings.find((t) => t.id === id)?.name)
      .filter(Boolean) as string[];

    const extraObjs = selectedExtraIds.map((id) => visibleAddons.find((a) => a.id === id)).filter(Boolean);
    const extrasNames = extraObjs.map((e) => e!.name);
    const extrasTotal = extraObjs.reduce((acc, e) => acc + (e?.price ?? 0), 0);

    const cremeNames = selectedCreamIds
      .map((id) => visibleCreams.find((c) => c.id === id)?.name)
      .filter(Boolean) as string[];

    const newItem = {
      id: Date.now(),
      name: `${selectedCup.name} com ${toppingNames.length} acompanhamentos`,
      price: selectedCup.price + extrasTotal, // cremes não somam
      quantity: 1,
      image: "/acai.webp",
      toppings: toppingNames,
      extras: extrasNames,
      cremes: cremeNames,
    };

    addItem(newItem);
    resetMontagem();
    document.getElementById("acai-cup-selector")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNextStep = () => {
    if (activeTab === "produtos") {
      if (cart.items.length === 0) return;
      setActiveTab(initialTipo === "retirada" ? "pagamento" : "endereco");
      router.replace(`/produtos?tab=${initialTipo === "retirada" ? "pagamento" : "endereco"}&tipo=${tipo}`, { scroll: false });
    } else if (activeTab === "endereco") {
      setActiveTab("pagamento");
      router.replace(`/produtos?tab=pagamento&tipo=${tipo}`, { scroll: false });
    } else if (activeTab === "pagamento") {
      if (!cart.paymentMethod) return;
      handleCreateOrder();
      clearCart();
    }
  };

  const handleCreateOrder = async () => {
    setIsCreatingOrder(true);
    try {
      await saveOrder();
      await refreshOrders?.();
      router.push("/pedidos");
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const resetMontagem = () => {
    setSelectedCup(null);
    setSelectedToppingIds([]);
    setSelectedExtraIds([]);
    setSelectedCreamIds([]);
  };

  // 🔹 troca de abas controlada + sincroniza URL
  const handleTabChange = (tab: string) => {
    const next = allowedTabs.has(tab) ? tab : "produtos";
    setActiveTab(next);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("tab", next);
    params.set("tipo", tipo);
    router.replace(`/produtos?${params.toString()}`, { scroll: false });
  };

  // Scroll automático: cremes (se exigidos) ou adicionais
  useEffect(() => {
    if (selectedCup && selectedToppingIds.length === selectedCup.maxToppings) {
      setTimeout(() => {
        const targetRef = requiredCreams > 0 ? creamsRef.current : addonsRef.current;
        if (targetRef) {
          const yOffset = -100;
          const y = targetRef.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 100);
    }
  }, [selectedToppingIds, selectedCup, requiredCreams]);

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50">
      <div className="flex-1">
        <NavigationTabs activeTab={activeTab} onTabChange={handleTabChange} tipo={tipo} initialTipo={initialTipo} />

        <div className="container mx-auto px-4 py-2 pb-60">
          {activeTab === "produtos" && (
            <div className="space-y-4">
              <div className="m-1 p-0 leading-none">
                <h1 className="text-xl font-bold text-center text-gray-800 m-0 p-0 leading-none">Monte seu Açaí</h1>
                <p className="text-center text-gray-600 m-1 p-1 text-xs leading-none">
                  Escolha um tamanho, acompanhamentos e adicionais opcionais.
                </p>
              </div>

              <div id="acai-cup-selector" className="mt-1">
                <h2 className="text-sm font-semibold mb-1">Tamanho do Copo</h2>

                {cupsError && (
                  <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    Não foi possível carregar os copos.
                  </div>
                )}
                {cupsLoading && !cupsError && <div className="mb-2 text-xs text-gray-500">Carregando opções…</div>}

                <AcaiCupSelector
                  cups={cupsDb}
                  selectedCup={selectedCup?.id ?? null}
                  onChange={(id) => {
                    const cup = cupsDb.find((c) => c.id === id);
                    if (cup) handleCupSelect(cup);
                  }}
                />
              </div>

              {selectedCup && (
                <>
                  {/* Acompanhamentos */}
                  <div className="mt-2" ref={toppingsRef}>
                    <h2 className="text-sm font-semibold mb-1">
                      Acompanhamentos ({selectedToppingIds.length}/{maxToppings})
                    </h2>

                    {toppingsError && (
                      <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        Não foi possível carregar os acompanhamentos.
                      </div>
                    )}
                    {toppingsLoading && !toppingsError && <div className="mb-2 text-xs text-gray-500">Carregando acompanhamentos…</div>}

                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {visibleToppings.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleToppingToggle(t.id)}
                          className={`flex flex-col items-center p-1.5 border rounded-xl transition-all ${
                            selectedToppingIds.includes(t.id) ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
                          }`}
                        >
                          {t.imageUrl && <img src={t.imageUrl} alt={t.name} className="w-14 h-14 rounded-full object-cover mb-1" />}
                          <span className="text-[11px] text-center text-gray-800 font-medium">{t.name}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Selecionados: {selectedToppingIds.length}/{selectedCup.maxToppings}</p>
                  </div>

                  {/* Cremes (obrigatórios por copo) */}
                  {requiredCreams > 0 && (
                    <div className="mt-2" ref={creamsRef}>
                      <h2 className="text-sm font-semibold mb-1">Cremes ({selectedCreamIds.length}/{requiredCreams})</h2>

                      {creamsError && (
                        <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                          Não foi possível carregar os cremes.
                        </div>
                      )}
                      {creamsLoading && !creamsError && <div className="mb-2 text-xs text-gray-500">Carregando cremes…</div>}

                      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {visibleCreams.map((c) => {
                          const active = selectedCreamIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              onClick={() => toggleCream(c.id)}
                              className={`flex flex-col items-center p-1.5 border rounded-xl transition-all ${
                                active ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
                              }`}
                            >
                              {c.imageUrl && <img src={c.imageUrl} alt={c.name} className="w-14 h-14 rounded-full object-cover mb-1" />}
                              <span className="text-[11px] text-center text-gray-800 font-medium">{c.name}</span>
                            </button>
                          );
                        })}
                      </div>

                      <p className="text-xs text-gray-500 mt-1">Selecionados: {selectedCreamIds.length}/{requiredCreams}</p>
                    </div>
                  )}

                  {/* feedback adicionais */}
                  {addonsError && (
                    <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      Não foi possível carregar os adicionais.
                    </div>
                  )}
                  {addonsLoading && !addonsError && <div className="mb-2 text-xs text-gray-500">Carregando adicionais…</div>}

                  {/* Adicionais (opcionais) */}
                  {visibleAddons.length > 0 && (
                    <div className="mt-2" ref={addonsRef}>
                      <h2 className="text-sm font-semibold mb-1">Adicionais (opcionais)</h2>
                      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {visibleAddons.map((extra) => (
                          <button
                            key={extra.id}
                            onClick={() => handleExtraToggle(extra.id)}
                            className={`flex flex-col items-center p-1.5 border rounded-xl transition-all ${
                              selectedExtraIds.includes(extra.id) ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
                            }`}
                          >
                            {extra.imageUrl && (
                              <img src={extra.imageUrl} alt={extra.name} className="w-14 h-14 rounded-full object-cover mb-1" />
                            )}
                            <span className="text-[11px] text-center text-gray-800 font-medium">{extra.name}</span>
                            <span className="text-[10px] text-gray-500">+R$ {extra.price.toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "endereco" && initialTipo === "entrega" && (
            <>
              <CartEmptyWarning show={cart.items.length === 0} currentTab={activeTab} />
              <AddressForm tipo={tipo} />
            </>
          )}

          {activeTab === "pagamento" && (
            <>
              <CartEmptyWarning show={cart.items.length === 0} currentTab={activeTab} />
              <PaymentForm
                cardData={cardData}
                onCardDataChange={setCardData}
                total={cart.items.reduce((sum, item) => {
                  const extrasTotal = (Array.isArray(item.extras) ? item.extras : []).reduce((acc, name) => {
                    const found = addonsDb.find((a) => a.name === name);
                    return acc + (found?.price ?? 0);
                  }, 0);
                  return sum + item.price + extrasTotal;
                }, 0)}
                tipo={tipo}
                onTipoChange={setTipo}
                deliveryAddress={deliveryAddress}
                onDeliveryAddressChange={setDeliveryAddress}
                initialTipo={initialTipo}
              />
            </>
          )}
        </div>

        <OrderSummary
          subtotal={cart.items.reduce((sum, item) => sum + item.price, 0)}
          deliveryFee={0}
          total={cart.items.reduce((sum, item) => sum + item.price, 0)}
          itemCount={cart.items.reduce((total, item) => total + item.quantity, 0)}
          currentTab={activeTab}
          setTab={handleTabChange}
          tipo={tipo}
          initialTipo={initialTipo}
          hasItems={cart.items.length > 0}
          canAddAcai={
            !!selectedCup &&
            selectedToppingIds.length === (selectedCup?.maxToppings ?? 0) &&
            (requiredCreams === 0 || selectedCreamIds.length === requiredCreams)
          }
          hasSelectedCup={!!selectedCup}
          onNextStep={handleNextStep}
          onAddAcai={handleAddToCart}
          draftCupPrice={selectedCup?.price ?? 0}
          draftExtraIds={selectedCup ? selectedExtraIds : []}
        />
      </div>

      {isCreatingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl px-6 py-4 text-center shadow-lg">
            <p className="text-sm sm:text-base font-medium">Criando pedido...</p>
            <div className="mt-4 w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}
