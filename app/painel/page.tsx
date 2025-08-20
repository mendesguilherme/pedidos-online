// app/painel/page.tsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";
import { buildActionLink } from "@/lib/admin-actions";
import RealtimeRefresher from "./_components/RealtimeRefresher";
import DenyWithReasonButton from "./_components/DenyWithReasonButton";
import LogoutButton from "./_components/LogoutButton";
import { allowedActionsFor } from "@/lib/orders-workflow"; // mantém
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

const btnCellBase = "h-9 min-w-[140px] justify-center rounded-xl whitespace-nowrap";
const btnChipBase = "rounded-xl whitespace-nowrap justify-center";

const btnNotify =
  `${btnChipBase} h-8 min-w-[160px] border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`;

const btnAceitar =
  `${btnCellBase} border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`;

const btnNegar =
  `${btnCellBase} border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100`;

const btnSaiu =
  `${btnCellBase} border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100`;

const btnEntregue =
  `${btnCellBase} border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100`;

const btnPager = "h-9 rounded-xl px-3";

const baseField =
  "mt-1 w-full h-10 rounded-xl border border-purple-300 bg-white px-3 text-[15px] \
focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300";

const inputClass  = baseField;
const selectClass = `${baseField} leading-[2.5rem] appearance-none pr-8`;
const dateClass   = `${baseField} [&_::-webkit-datetime-edit]:leading-[2.5rem]`;
const btnPrimary  = "rounded-xl bg-gray-900 px-3 py-2 text-white hover:bg-black";
const btnGhost    = "rounded-xl bg-gray-200 px-3 py-2 hover:bg-gray-300";

type Order = {
  id: string;
  order_code: string | null;
  created_at: string;
  status: string;
  tipo: string | null;
  total: number | null;
  payment_method: string | null;
  cart: any | null;
  address: any | null;
  client_id: string | null;
};

function fmtBRL(v?: number | null) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);
}

/** Endereço curto para listagem */
function resumoEndereco(address: any, tipo?: string | null): string {
  if (tipo !== "entrega") return "Retirada no local";
  const a = address ?? {};
  const linha1 = [a.street, a.number].filter(Boolean).join(", ");
  const linha2 = [a.neighborhood].filter(Boolean).join("");
  const linha3 = [a.city, a.zipCode].filter(Boolean).join(" - ");
  return [linha1, linha2, linha3].filter(Boolean).join(" • ");
}

/** Data de hoje em São Paulo no formato YYYY-MM-DD */
function todayInSaoPaulo(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const day = parts.find((p) => p.type === "day")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const year = parts.find((p) => p.type === "year")!.value;
  return `${year}-${month}-${day}`;
}

/** Converte um ISO UTC do banco para string PT-BR em Brasília */
function fmtDateBR_SP(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** Mapeia método de pagamento para PT-BR */
function labelPgto(v?: string | null) {
  if (!v) return "—";
  const map: Record<string, string> = {
    card: "Cartão",
    credit_card: "Cartão",
    debit_card: "Cartão (débito)",
    cash: "Dinheiro",
    money: "Dinheiro",
    pix: "PIX",
    boleto: "Boleto",
  };
  return map[v] ?? v.charAt(0).toUpperCase() + v.slice(1);
}

function buildQS(
  current: Record<string, string | undefined>,
  overrides: Record<string, string | undefined | null>
) {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(current)) if (v) merged[k] = v;
  for (const [k, v] of Object.entries(overrides)) {
    if (v === null) delete merged[k];
    else if (typeof v !== "undefined") merged[k] = v as string;
  }
  const u = new URLSearchParams(merged);
  const s = u.toString();
  return s ? `?${s}` : "";
}

type PageProps = { searchParams?: Record<string, string | string[] | undefined> };

/** Tipo auxiliar só para tipar o que adicionamos em runtime */
type EnrichedOrder = Order & {
  actions: string[];
  links: {
    aceitar: string;
    negar: string;
    saiu: string;
    entregue: string;
    notify: string;
  };
};

/** Label amigável do status para exibição na tabela */
function uiStatusLabel(status: string, tipo?: string | null) {
  const isEntrega = (tipo ?? "").toLowerCase() === "entrega";
  if (status === "saiu_para_entrega" && !isEntrega) return "Pronto p/ retirada";
  return status.replaceAll("_", " ");
}

/** ====================== NOVO: pill de status (mais visível) ====================== */
const statusPillBase =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";

function statusPillClass(status: string) {
  switch (status) {
    case "pendente":
      return `${statusPillBase} border-amber-300 bg-amber-50 text-amber-800`;
    case "em_preparo":
      return `${statusPillBase} border-sky-300 bg-sky-50 text-sky-800`;
    case "saiu_para_entrega":
      return `${statusPillBase} border-indigo-300 bg-indigo-50 text-indigo-800`;
    case "entregue":
      return `${statusPillBase} border-emerald-300 bg-emerald-50 text-emerald-800`;
    case "cancelado":
      return `${statusPillBase} border-rose-300 bg-rose-50 text-rose-800`;
    default:
      return `${statusPillBase} border-slate-300 bg-slate-50 text-slate-700`;
  }
}
/** =============================================================================== */

/** Componente da célula de itens: mostra cada copo com espaço e inclui Cremes */
function ItensResumo({ cart }: { cart: any }) {
  const items = Array.isArray(cart?.items) ? cart.items : [];
  if (!items.length) return <span>—</span>;

  return (
    <div className="text-gray-700 space-y-2">
      {items.map((it: any, idx: number) => {
        const q = it?.quantity ?? 1;
        const price = fmtBRL(it?.price ?? 0);
        const tops = Array.isArray(it?.toppings) && it.toppings.length > 0 ? it.toppings as string[] : [];
        const cremes = Array.isArray(it?.cremes) && it.cremes.length > 0 ? it.cremes as string[] : [];
        const extras = Array.isArray(it?.extras) && it.extras.length > 0 ? it.extras as string[] : [];

        return (
          <div key={idx} className="leading-tight">
            <div className="font-medium">
              {q}x {it?.name ?? "item"} ({price})
            </div>
            {(tops.length > 0 || cremes.length > 0 || extras.length > 0) && (
              <div className="text-xs text-gray-600 space-y-0.5">               
                {tops.length > 0 && (
                  <div>
                    <span className="font-semibold">Acompanhamentos:</span> {tops.join(", ")}
                  </div>
                )}
                {extras.length > 0 && (
                  <div>
                    <span className="font-semibold">Adicionais:</span> {extras.join(", ")}
                  </div>
                )}
                {cremes.length > 0 && (
                  <div>
                    <span className="font-semibold">Cremes:</span> {cremes.join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default async function AdminPedidosPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  const sp = Object.fromEntries(
    Object.entries(searchParams ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  ) as Record<string, string | undefined>;

  // paginação / limites (máx 50)
  const page = Math.max(1, Number.parseInt(sp.p ?? "1") || 1);
  const perRaw = Number.parseInt(sp.rpp ?? "25") || 25;
  const rpp = Math.max(1, Math.min(perRaw, 50));

  // filtros vindos da URL
  const f_code = sp.code?.trim();
  const f_status = sp.status?.trim();
  const f_tipo = sp.tipo?.trim();
  const f_pgto = sp.pgto?.trim();
  const f_total_min = sp.tmin?.trim();
  const f_total_max = sp.tmax?.trim();

  // datas (se não vierem, HOJE por padrão)
  const defaultDay = todayInSaoPaulo();
  const f_created_from = sp.cf?.trim() || defaultDay;
  const f_created_to = sp.ct?.trim() || f_created_from;

  const supa = adminClient();

  // query com filtros
  let query = supa
    .from("orders")
    .select(
      `
      id, order_code, created_at, status, tipo, total, payment_method, cart, address, client_id
    `,
      { count: "exact" }
    );

  if (f_code) query = query.ilike("order_code", `%${f_code}%`);
  if (f_status && !["todos", "all"].includes(f_status)) query = query.eq("status", f_status);
  if (f_tipo && !["todos", "all"].includes(f_tipo)) query = query.eq("tipo", f_tipo);
  if (f_pgto && !["todos", "all"].includes(f_pgto)) query = query.eq("payment_method", f_pgto);

  if (f_total_min && !Number.isNaN(Number(f_total_min))) query = query.gte("total", Number(f_total_min));
  if (f_total_max && !Number.isNaN(Number(f_total_max))) query = query.lte("total", Number(f_total_max));

  // janela do dia em UTC-3
  const fromISO = `${f_created_from}T00:00:00-03:00`;
  const toISO = `${f_created_to}T23:59:59.999-03:00`;
  query = query.gte("created_at", fromISO).lte("created_at", toISO);

  // ordenação + range (paginação)
  const offset = (page - 1) * rpp;
  query = query.order("created_at", { ascending: false }).range(offset, offset + rpp - 1);

  const { data, error, count } = await query;

  if (error) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Admin • Pedidos</h1>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{session?.user?.name ?? "Admin"}</span>
            <LogoutButton />
          </div>
        </div>
        <p className="mt-4 text-red-600">Falha ao carregar pedidos: {error.message}</p>
      </main>
    );
  }

  const totalRows = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / rpp));
  const orders = (data ?? []) as Order[];

  // links com redirect a /painel
  const base = (process.env.APP_BASE_URL || "").replace(/\/+$/, "");
  const redirect = `${base}/painel`;

  // monta ações e links (inclui notify do n8n)
  const enriched: EnrichedOrder[] = await Promise.all(
    orders.map(async (o) => {
      const aceitar = await buildActionLink(o.id, "aceitar", { redirect, v: "html" });
      const negar = await buildActionLink(o.id, "negar", { redirect, v: "html" });
      const saiu = await buildActionLink(o.id, "saiu_para_entrega", { redirect, v: "html" });
      const entregue = await buildActionLink(o.id, "entregue", { redirect, v: "html" });
      const notify = `${base}/api/admin/notify-order?id=${encodeURIComponent(o.id)}&redirect=${encodeURIComponent(
        redirect
      )}&v=html`;

      const actions = allowedActionsFor({ status: o.status as any, tipo: o.tipo as any });

      return {
        ...(o as Order),
        actions,
        links: { aceitar, negar, saiu, entregue, notify },
      };
    })
  );

  const currentQS: Record<string, string | undefined> = {
    code: f_code || undefined,
    status: f_status || undefined,
    tipo: f_tipo || undefined,
    pgto: f_pgto || undefined,
    tmin: f_total_min || undefined,
    tmax: f_total_max || undefined,
    cf: f_created_from || undefined,
    ct: f_created_to || undefined,
    rpp: String(rpp),
  };

  return (
    <main className="mx-auto max-w-6xl p-6">
      <RealtimeRefresher />

      {/* topo com título, nome e logout */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Admin • Pedidos</h1>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{session?.user?.name ?? "Admin"}</span>
          <LogoutButton />
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-2">
        Clique em Aceitar/Negar para atualizar o status. Você retornará a esta página após a ação.
      </p>

      {/* Filtros — grid responsiva */}
      <form
        method="get"
        className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 rounded-xl border p-4 bg-white [--border:0_0%85%]"
      >
        {/* ... (filtros inalterados) ... */}
        <div className="min-w-0 lg:col-span-3">
          <Label className="text-xs text-gray-500">Código</Label>
          <Input
            name="code"
            defaultValue={currentQS.code ?? ""}
            className={`${inputClass} h-[42px] border-[hsl(0,0%,85%)] focus:border-[hsl(0,0%,85%)]`}
          />
        </div>
        {/* demais filtros permanecem exatamente iguais */}
        {/* ... */}
        <div className="sm:col-span-2 lg:col-span-12 flex gap-2 pt-1">
          <button className={btnPrimary}>Aplicar filtros</button>
          <Link href="/painel" className={btnGhost}>Limpar</Link>
        </div>
      </form>

      {/* Tabela */}
      <div className="mt-6 overflow-x-auto rounded-xl border bg-white [--border:0_0%85%]">
        <table className="min-w-full text-sm">
          <thead className="bg-[hsl(var(--primary))] text-white">
            <tr className="divide-x divide-white/30">
              <th className="px-3 py-2 text-left">Código</th>
              <th className="px-3 py-2 text-left">Criado</th>
              {/* 🔸 renomeado */}
              <th className="px-3 py-2 text-left">Status do Pedido</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Total</th>
              <th className="px-3 py-2 text-left">Pagamento</th>
              <th className="px-3 py-2 text-left">Itens</th>
              <th className="px-3 py-2 text-left">Endereço</th>
              {/* 🔸 renomeado */}
              <th className="px-3 py-2 text-left">Atualizar status para</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {enriched.map((o) => (
              <tr
                key={o.id}
                className={`align-top ${o.status === "entregue" ? "bg-gray-100" : o.status === "cancelado" ? "bg-red-100" : ""} divide-x divide-slate-200`}
              >
                <td className="px-3 py-2 font-medium">{o.order_code ?? o.id.slice(0, 8)}</td>
                <td className="px-3 py-2">{fmtDateBR_SP(o.created_at)}</td>

                {/* Status + botão Enviar WhatsApp (condicional) */}
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {/* 🔸 pill mais visível */}
                    <span className={statusPillClass(o.status)}>
                      {uiStatusLabel(o.status, o.tipo)}
                    </span>

                    {o.status !== "pendente" && o.status !== "cancelado" && (
                      <Button
                        asChild
                        size="sm"
                        className="h-8 rounded-xl px-2 text-xs leading-none whitespace-nowrap
                                  bg-emerald-600 hover:bg-emerald-600/90 text-white
                                  border border-emerald-600 focus-visible:ring-emerald-600/30"
                      >
                        <a href={o.links.notify} title="Enviar os detalhes no WhatsApp">
                          Enviar WhatsApp
                        </a>
                      </Button>
                    )}
                  </div>
                </td>

                <td className="px-3 py-2">{o.tipo ?? "—"}</td>
                <td className="px-3 py-2">{fmtBRL(o.total)}</td>
                <td className="px-3 py-2">{labelPgto(o.payment_method)}</td>

                <td className="px-3 py-2 max-w-[420px]">
                  <ItensResumo cart={o.cart} />
                </td>

                <td className="px-3 py-2 max-w-[320px]">
                  <div className="text-gray-700">{resumoEndereco(o.address ?? o.cart?.deliveryAddress, o.tipo)}</div>
                </td>

                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {o.actions.includes("aceitar") && (
                      <Button asChild variant="outline" className={btnAceitar}>
                        <a href={o.links.aceitar}>Aceitar</a>
                      </Button>
                    )}
                    { o.actions.includes("negar") && (
                      <DenyWithReasonButton orderId={o.id} className={btnNegar} />
                    )}
                    {o.actions.includes("saiu_para_entrega") && (
                      <Button asChild variant="outline" className={btnSaiu}>
                        <a href={o.links.saiu}>
                          {(o.tipo ?? "").toLowerCase() === "entrega" ? "Saiu p/ entrega" : "Pronto p/ retirada"}
                        </a>
                      </Button>
                    )}
                    {o.actions.includes("entregue") && (
                      <Button asChild variant="outline" className={btnEntregue}>
                        <a href={o.links.entregue}>Entregue</a>
                      </Button>
                    )}
                  </div>
                </td>

              </tr>
            ))}

            {!enriched.length && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* (restante do arquivo permanece exatamente igual) */}
      {/* ... modal Negar, script e paginação ... */}
    </main>
  );
}
