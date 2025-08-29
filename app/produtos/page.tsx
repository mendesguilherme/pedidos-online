"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { NavigationTabs } from "@/components/navigation-tabs";
import { AddressForm } from "@/components/address-form";
import { PaymentForm } from "@/components/payment-form";
import { CartEmptyWarning } from "@/components/cart-empty-warning";
import { OrderSummary } from "@/components/order-summary";
import { BottomNavigation } from "@/components/bottom-navigation";
import { CategoryTabs } from "@/components/category-tabs";

// produtos (client-safe)
import { useProducts, type Product, type ProductOptionWithLimits } from "@/hooks/use-products";

// hooks padronizados
import { useAddons } from "@/hooks/use-addons";
import { useToppings, type Topping } from "@/hooks/use-toppings";

import { ProductSelector } from "@/components/ProductSelector";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrderContext";

/* ============================================================
   Página
   ============================================================ */
export default function ProdutosPage() {
  // PRODUCTS
  const { data: productsData, isLoading: productsLoading, error: productsError } = useProducts();
  const productsDb = productsData ?? [];

  // ADDONS
  const { data: addonsData, isLoading: addonsLoading, error: addonsError } = useAddons();
  const addonsDb = addonsData ?? [];

  // TOPPINGS
  const { data: toppingsData, isLoading: toppingsLoading, error: toppingsError } = useToppings();
  const toppingsDb = toppingsData ?? [];

  const { refreshOrders } = useOrders();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const { saveOrder, clearCart } = useCart();
  const router = useRouter();
  const { cart, addItem } = useCart();

  const toppingsRef = useRef<HTMLDivElement | null>(null);
  const addonsRef = useRef<HTMLDivElement | null>(null);

  const searchParams = useSearchParams();

  // tipo inicial
  const initialTipo = (searchParams.get("tipo") || "entrega").toString();
  const [tipo, setTipo] = useState(initialTipo);

  // tabs
  const allowedTabs = new Set(["produtos", "endereco", "pagamento"]);
  const tabParam = (searchParams.get("tab") || "produtos").toString();
  const initialTab = allowedTabs.has(tabParam) ? tabParam : "produtos";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    const urlTab = (searchParams.get("tab") || "produtos").toString();
    if (allowedTabs.has(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Produto ativo (para toppings/adicionais)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Quantidades escolhidas (seleção múltipla)
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const setQty = useCallback((id: number, qty: number) => {
    setQuantities((q) => {
      const next = { ...q };
      if (!qty || qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }, []);

  // Estados (toppings/adicionais) do produto ATIVO
  const [selectedToppingIds, setSelectedToppingIds] = useState<number[]>([]);
  const [selectedExtraIds, setSelectedExtraIds] = useState<number[]>([]);
  const maxToppings = useMemo(() => {
    const base = selectedProduct?.maxToppings ?? 0;
    const allow = (selectedProduct as ProductOptionWithLimits | null)?.allowedToppingIds;
    return Array.isArray(allow) && allow.length === 0 ? 0 : base;
  }, [selectedProduct]);

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

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSelectedToppingIds([]);
    setSelectedExtraIds([]);

    setTimeout(() => {
      if (toppingsRef.current) {
        const yOffset = -100;
        const y = toppingsRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 100);
  };

  // Helpers do produto
  const productCfg = (selectedProduct ?? null) as ProductOptionWithLimits | null;

  // ---------- filtros (apenas p/ produto ativo) ----------
  const visibleToppings: Topping[] = useMemo(() => {
    if (!selectedProduct) return [];
    const allow = (selectedProduct as ProductOptionWithLimits).allowedToppingIds;
    if (Array.isArray(allow)) {
      if (allow.length === 0) return [];                  // ← esconder
      return toppingsDb.filter((t) => allow.includes(t.id));
    }
    return toppingsDb;                                     // ← sem restrição
  }, [selectedProduct, toppingsDb]);

  const visibleAddons = useMemo(() => {
    if (!selectedProduct) return [];
    const allow = (selectedProduct as ProductOptionWithLimits).allowedAddonIds;
    if (Array.isArray(allow)) {
      if (allow.length === 0) return [];
      return addonsDb.filter((a) => allow.includes(a.id));
    }
    return addonsDb;
  }, [selectedProduct, addonsDb]);

  const mustFillToppings = useMemo(() => {
    const max = selectedProduct?.maxToppings ?? 0;
    const hasVisibleToppings = visibleToppings.length > 0;
    return max > 0 && hasVisibleToppings;
  }, [selectedProduct?.maxToppings, visibleToppings]);

  // ---------- toggles ----------
  const handleToppingToggle = (toppingId: number) => {
    if (!selectedProduct) return;
    const max = selectedProduct.maxToppings;
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

  // ➕ Agora adiciona TODOS os itens com qty > 0.
  // Para o produto ativo, inclui toppings/adicionais; os demais vão "simples".
  const handleAddToCart = (force = false) => {
    const entries = Object.entries(quantities).filter(([, q]) => Number(q) > 0);
    if (entries.length === 0) return;

    // Se o produto ativo tiver quantidade > 0 e toppings obrigatórios, valida
    const activeQty = selectedProduct ? quantities[selectedProduct.id] ?? 0 : 0;
    if (selectedProduct && activeQty > 0) {
      const toppingsOk = selectedToppingIds.length === (selectedProduct.maxToppings ?? 0);
      if (!force && mustFillToppings && !toppingsOk) return;
    }

    // Função auxiliar para montar item “simples”
    const makeSimpleItem = (p: Product, qty: number) => {
      const productImage =
        (p as any)?.image || (p as any)?.imageUrl || (p as any)?.image_url || "/placeholder.svg";
      return {
        id: Date.now() + Math.floor(Math.random() * 100000),
        name: p.name,
        price: p.price,
        quantity: qty,
        image: productImage,
        toppings: [] as string[],
        extras: [] as string[],
      };
    };

    // 1) Se houver produto ativo com qty > 0, monta com toppings/adicionais
    if (selectedProduct && activeQty > 0) {
      const toppingNames = selectedToppingIds
        .map((id) => visibleToppings.find((t) => t.id === id)?.name)
        .filter(Boolean) as string[];

      const extraObjs = selectedExtraIds
        .map((id) => visibleAddons.find((a) => a.id === id))
        .filter(Boolean);
      const extrasNames = extraObjs.map((e) => e!.name);
      const extrasTotal = extraObjs.reduce((acc, e) => acc + (e?.price ?? 0), 0);

      const productImage =
        (selectedProduct as any)?.image ||
        (selectedProduct as any)?.imageUrl ||
        (selectedProduct as any)?.image_url ||
        "/placeholder.svg";

      addItem({
        id: Date.now(),
        name: `${selectedProduct.name} com ${toppingNames.length} acompanhamentos`,
        price: Number(selectedProduct.price) + Number(extrasTotal),
        quantity: activeQty,
        image: productImage,
        toppings: toppingNames,
        extras: extrasNames,
      });
    }

    // 2) Demais produtos com qty > 0 vão simples
    for (const [idStr, qty] of entries) {
      const id = Number(idStr);
      if (selectedProduct && id === selectedProduct.id) continue;
      const p = productsDb.find((x) => x.id === id);
      if (!p) continue;
      addItem(makeSimpleItem(p, Number(qty)));
    }

    // reset de montagem (mantém quantidades? Vamos limpar para evitar duplicidades)
    setSelectedProduct(null);
    setSelectedToppingIds([]);
    setSelectedExtraIds([]);
    setQuantities({});

    // dá um scroll back para o selector
    document.getElementById("product-selector")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNextStep = () => {
    if (activeTab === "produtos") {
      if (cart.items.length === 0) return;
      setActiveTab(initialTipo === "retirada" ? "pagamento" : "endereco");
      router.replace(
        `/produtos?tab=${initialTipo === "retirada" ? "pagamento" : "endereco"}&tipo=${tipo}`,
        { scroll: false }
      );
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

  // troca de abas + sincroniza URL
  const handleTabChange = (tab: string) => {
    const next = allowedTabs.has(tab) ? tab : "produtos";
    setActiveTab(next);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("tab", next);
    params.set("tipo", tipo);
    router.replace(`/produtos?${params.toString()}`, { scroll: false });
  };

  // ==================== CATEGORIAS ====================
  type Cat = { id: string; name: string };
  const categories: Cat[] = useMemo(() => {
    const seen = new Map<string, { name: string; pos: number }>();
    for (const p of productsDb) {
      const id = String(p.category?.id ?? "uncat");
      const name = String(p.category?.name ?? "Outros");
      const pos = Number(p.category?.position ?? 9999);
      if (!seen.has(id)) seen.set(id, { name, pos });
    }
    return Array.from(seen, ([id, v]) => ({ id, name: v.name, pos: v.pos }))
      .sort((a, b) => a.pos - b.pos || a.name.localeCompare(b.name))
      .map(({ id, name }) => ({ id, name }));
  }, [productsDb]);

  // refs das sections por categoria
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const setSectionRef = useCallback((cid: string) => {
    return (el: HTMLDivElement | null) => {
      sectionRefs.current[cid] = el;
    };
  }, []);

  // medida da barra de categorias (para sticky das seções)
  const catBarRef = useRef<HTMLDivElement | null>(null);
  const [catBarH, setCatBarH] = useState(0);
  useEffect(() => {
    const upd = () => setCatBarH(catBarRef.current?.offsetHeight ?? 0);
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  // ==================== BARRA DOCKABLE (esconde topo/abas) ====================
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerH, setHeaderH] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [compactHeader, setCompactHeader] = useState(false);

  // mede altura do header quando visível
  useEffect(() => {
    const update = () => setHeaderH(headerRef.current?.offsetHeight ?? 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        setCompactHeader(!e.isIntersecting);
      },
      { root: null, threshold: 0, rootMargin: "0px" }
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, []);

  // --- Persistência de categoria na URL & scroll suave ---
  const catFromURL = (searchParams.get("cat") ?? null) as string | null;

  // categoria ativa (scroll-spy)
  const [activeCategory, setActiveCategory] = useState<string | null>(
    catFromURL ?? categories[0]?.id ?? null
  );

  // scroll p/ seção
  const scrollToCategory = (cid: string) => {
    const el = sectionRefs.current[cid];
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - (catBarH + 8);
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  // handler chamado pelas tabs/gaveta: atualiza ?cat=... e faz scroll
  const handleCategoryChange = (cid: string) => {
    setActiveCategory(cid);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("cat", cid);
    router.replace(`/produtos?${params.toString()}`, { scroll: false });
    requestAnimationFrame(() => scrollToCategory(cid));
  };

  // quando entrar via URL com ?cat=..., rola até a seção após render
  useEffect(() => {
    if (!catFromURL) return;
    const t = setTimeout(() => scrollToCategory(catFromURL), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length, catBarH, catFromURL]);

  // scroll-spy que atualiza activeCategory (sem mexer na URL por enquanto)
  useEffect(() => {
    if (!categories.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target) {
          const id = (visible.target as HTMLElement).dataset["cid"] || null;
          if (id) setActiveCategory(id);
        }
      },
      {
        root: null,
        rootMargin: `${-(catBarH + 8)}px 0px -80% 0px`,
        threshold: [0, 0.1, 0.5, 1],
      }
    );
    for (const { id } of categories) {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [categories, catBarH]);

  // Mapa de preços e prévia da seleção múltipla
  const priceMap = useMemo(
    () => new Map<number, number>(productsDb.map(p => [p.id, Number(p.price ?? 0)])),
    [productsDb]
  );

  const draftSelectionBaseTotal = useMemo(() => {
    const entries = Object.entries(quantities);
    const sum = entries.reduce((acc, [idStr, q]) => {
      const id = Number(idStr);
      const qty = Number(q);
      const price = priceMap.get(id) ?? 0;
      return acc + price * qty;
    }, 0);
    return Math.round(sum * 100) / 100;
  }, [quantities, priceMap]);

  const draftActiveQty = useMemo(
    () => (selectedProduct ? Number(quantities[selectedProduct.id] ?? 0) : 0),
    [selectedProduct, quantities]
  );

  // ==================== RENDER ====================
  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50">
      <div className="flex-1">
        {/* TOPO (some quando compactHeader = true) */}
        <div
          ref={headerRef}
          className={`sticky top-0 z-40 bg-white transition-all duration-200 ${compactHeader ? "hidden" : ""}`}
        >
          <NavigationTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            tipo={tipo}
            initialTipo={initialTipo}
          />
        </div>

        {/* sentinel para saber quando esconder o topo */}
        <div ref={sentinelRef} aria-hidden className="h-1" />

        {/* BARRA DE CATEGORIAS – agora realmente ocupa o topo quando o header some */}
        {activeTab === "produtos" && (
          <div
            ref={catBarRef}
            className="z-30"
            style={{ position: "sticky", top: compactHeader ? 0 : headerH }}
          >
            <CategoryTabs
              categories={categories}
              activeId={activeCategory}
              onChange={handleCategoryChange}
            />
          </div>
        )}

        {/* CONTEÚDO */}
        <div className="container mx-auto px-4 py-2 pb-60">
          {activeTab === "produtos" && (
            <div className="space-y-6">
              {/* AGRUPA PRODUTOS POR CATEGORIA EM SEÇÕES */}
              {categories.map(({ id: cid, name }) => {
                const prods = productsDb.filter((p) => String(p.category?.id ?? "uncat") === cid);
                if (!prods.length) return null;

                return (
                  <div key={cid} data-cid={cid} ref={setSectionRef(cid)} className="scroll-mt-24">
                    {/* DIVISOR DE CATEGORIA – full-bleed + sticky até a próxima */}
                    <div className="-mx-4 sticky z-20" style={{ top: (catBarH || 0) }}>
                      <div className="bg-gray-100 px-4 py-2">
                        <h2 className="text-[13px] sm:text-sm font-semibold text-gray-800 uppercase tracking-wide">
                          {name}
                        </h2>
                      </div>
                    </div>

                    <div id="product-selector" className="mt-2">
                      {productsError && (
                        <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                          Não foi possível carregar os produtos.
                        </div>
                      )}
                      {productsLoading && !productsError && (
                        <div className="mb-2 text-xs text-gray-500">Carregando opções…</div>
                      )}

                      <ProductSelector
                        products={prods.map((p) => ({
                          ...p,
                          image: (p as any).image ?? (p as any).imageUrl ?? "",
                        }))}
                        selectedProductId={selectedProduct?.id ?? null}
                        onChange={(id) => {
                          const p = prods.find((x) => x.id === id);
                          if (p) handleProductSelect(p);
                        }}
                        quantities={quantities}
                        onQuantityChange={setQty}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Se existir produto ativo, mostram-se as outras seções */}
              {selectedProduct && (
                <>
                  {/* Acompanhamentos */}
                  {visibleToppings.length > 0 && (
                    <div className="mt-2" ref={toppingsRef}>
                      <h2 className="text-sm font-semibold mb-1">
                        Acompanhamentos ({selectedToppingIds.length}/{maxToppings})
                      </h2>

                      {toppingsError && (
                        <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                          Não foi possível carregar os acompanhamentos.
                        </div>
                      )}
                      {toppingsLoading && !toppingsError && (
                        <div className="mb-2 text-xs text-gray-500">Carregando acompanhamentos…</div>
                      )}

                      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {visibleToppings.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleToppingToggle(t.id)}
                            className={`flex flex-col items-center p-1.5 border rounded-xl transition-all ${
                              selectedToppingIds.includes(t.id)
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {t.imageUrl && (
                              <img
                                src={t.imageUrl}
                                alt={t.name}
                                className="w-14 h-14 rounded-full object-cover mb-1"
                              />
                            )}
                            <span className="text-[11px] text-center text-gray-800 font-medium">
                              {t.name}
                            </span>
                          </button>
                        ))}
                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        Selecionados: {selectedToppingIds.length}/{selectedProduct.maxToppings}
                      </p>
                    </div>
                  )}

                  {/* feedback adicionais */}
                  {addonsError && (
                    <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      Não foi possível carregar os adicionais.
                    </div>
                  )}
                  {addonsLoading && !addonsError && (
                    <div className="mb-2 text-xs text-gray-500">Carregando adicionais…</div>
                  )}

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
                              selectedExtraIds.includes(extra.id)
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {extra.imageUrl && (
                              <img
                                src={extra.imageUrl}
                                alt={extra.name}
                                className="w-14 h-14 rounded-full object-cover mb-1"
                              />
                            )}
                            <span className="text-[11px] text-center text-gray-800 font-medium">
                              {extra.name}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              +R$ {extra.price.toFixed(2)}
                            </span>
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
                  const extrasTotal = (Array.isArray(item.extras) ? item.extras : []).reduce(
                    (acc, name) => {
                      const found = addonsDb.find((a) => a.name === name);
                      return acc + (found?.price ?? 0);
                    },
                    0
                  );
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
          canAddProduct={
            Object.values(quantities).some((q) => Number(q) > 0) &&
            (!selectedProduct ||
              (quantities[selectedProduct.id] ?? 0) === 0 ||
              selectedToppingIds.length === (selectedProduct?.maxToppings ?? 0))
          }
          hasSelectedProduct={Object.values(quantities).some((q) => Number(q) > 0)}
          onNextStep={handleNextStep}
          onAddProduct={handleAddToCart}
          // para prévia dos extras do ativo:
          draftProductPrice={selectedProduct?.price ?? 0}
          draftExtraIds={selectedProduct ? selectedExtraIds : []}
          mustFillToppings={mustFillToppings}
          // 🔹 novos:
          draftSelectionBaseTotal={draftSelectionBaseTotal}
          draftActiveQty={draftActiveQty}
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
