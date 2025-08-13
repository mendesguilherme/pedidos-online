// app/admin/page.tsx
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { buildActionLink } from "@/lib/admin-actions";
import RealtimeRefresher from "./_components/RealtimeRefresher";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

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

function resumoItens(cart: any): string {
  const items = Array.isArray(cart?.items) ? cart.items : [];
  if (!items.length) return "—";
  return items
    .map((it: any) => {
      const q = it?.quantity ?? 1;
      const tops = it?.toppings?.length ? ` | Toppings: ${it.toppings.join(", ")}` : "";
      const extras = it?.extras?.length ? ` | Extras: ${it.extras.join(", ")}` : "";
      return `${q}x ${it?.name ?? "item"} (${fmtBRL(it?.price)})${tops}${extras}`;
    })
    .join(" • ");
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

export default async function AdminPedidosPage({ searchParams }: PageProps) {
  const sp = Object.fromEntries(
    Object.entries(searchParams ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  ) as Record<string, string | undefined>;

  // paginação / limites
  const page = Math.max(1, Number.parseInt(sp.p ?? "1") || 1);
  const perRaw = Number.parseInt(sp.rpp ?? "25") || 25;
  const rpp = Math.max(1, Math.min(perRaw, 50));

  // filtros
  const f_code = sp.code?.trim();
  const f_status = sp.status?.trim();
  const f_tipo = sp.tipo?.trim();
  const f_pgto = sp.pgto?.trim();
  const f_total_min = sp.tmin?.trim();
  const f_total_max = sp.tmax?.trim();
  const f_created_from = sp.cf?.trim();
  const f_created_to = sp.ct?.trim();

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
  if (f_status) query = query.eq("status", f_status);
  if (f_tipo) query = query.eq("tipo", f_tipo);
  if (f_pgto) query = query.eq("payment_method", f_pgto);

  if (f_total_min && !Number.isNaN(Number(f_total_min))) query = query.gte("total", Number(f_total_min));
  if (f_total_max && !Number.isNaN(Number(f_total_max))) query = query.lte("total", Number(f_total_max));

  if (f_created_from) query = query.gte("created_at", f_created_from);
  if (f_created_to) query = query.lte("created_at", f_created_to + "T23:59:59.999Z");

  const offset = (page - 1) * rpp;
  query = query.order("created_at", { ascending: false }).range(offset, offset + rpp - 1);

  const { data, error, count } = await query;

  if (error) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-bold">Admin • Pedidos</h1>
        <p className="mt-4 text-red-600">Falha ao carregar pedidos: {error.message}</p>
      </main>
    );
  }

  const totalRows = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / rpp));
  const orders = (data ?? []) as Order[];

  // links de ação com redirect a /admin
  const base = (process.env.APP_BASE_URL || "").replace(/\/+$/, "");
  const redirect = `${base}/admin`;

  const enriched = await Promise.all(
    orders.map(async (o) => {
      const aceitar = await buildActionLink(o.id, "aceitar", { redirect, v: "html" });
      const negar = await buildActionLink(o.id, "negar", { redirect, v: "html" });
      return { ...o, links: { aceitar, negar } };
    })
  );

  const currentQS: Record<string, string | undefined> = {
    code: f_code,
    status: f_status,
    tipo: f_tipo,
    pgto: f_pgto,
    tmin: f_total_min,
    tmax: f_total_max,
    cf: f_created_from,
    ct: f_created_to,
    rpp: String(rpp),
  };

  return (
    <main className="mx-auto max-w-6xl p-6">
      {/* ativa live-update sem recarregar manual */}
      <RealtimeRefresher />
      
      <h1 className="text-2xl font-bold">Admin • Pedidos</h1>
      <p className="text-sm text-gray-500 mt-2">
        Clique em Aceitar/Negar para atualizar o status. Você retornará a esta página após a ação.
      </p>      

      {/* Filtros — grid responsiva */}
      <form
        method="get"
        className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 rounded-xl border p-4 bg-white"
      >
        <div className="min-w-0 lg:col-span-3">
          <label className="block text-xs text-gray-500">Código</label>
          <input name="code" defaultValue={f_code ?? ""} className="mt-1 w-full rounded-md border px-2 py-1" />
        </div>

        <div className="min-w-0 lg:col-span-2">
          <label className="block text-xs text-gray-500">Status</label>
          <input
            name="status"
            defaultValue={f_status ?? ""}
            className="mt-1 w-full rounded-md border px-2 py-1"
            placeholder="pendente / em_preparo / cancelado"
          />
        </div>

        <div className="min-w-0 lg:col-span-2">
          <label className="block text-xs text-gray-500">Tipo</label>
          <input
            name="tipo"
            defaultValue={f_tipo ?? ""}
            className="mt-1 w-full rounded-md border px-2 py-1"
            placeholder="entrega / retirada"
          />
        </div>

        <div className="min-w-0 lg:col-span-2">
          <label className="block text-xs text-gray-500">Pagamento</label>
          <input
            name="pgto"
            defaultValue={f_pgto ?? ""}
            className="mt-1 w-full rounded-md border px-2 py-1"
            placeholder="card / cash / pix ..."
          />
        </div>

        <div className="min-w-0 lg:col-span-1">
          <label className="block text-xs text-gray-500">Total Mín</label>
          <input
            name="tmin"
            defaultValue={f_total_min ?? ""}
            className="mt-1 w-full rounded-md border px-2 py-1"
            type="number"
            step="0.01"
          />
        </div>

        <div className="min-w-0 lg:col-span-1">
          <label className="block text-xs text-gray-500">Total Máx</label>
          <input
            name="tmax"
            defaultValue={f_total_max ?? ""}
            className="mt-1 w-full rounded-md border px-2 py-1"
            type="number"
            step="0.01"
          />
        </div>

        <div className="min-w-0 lg:col-span-2">
          <label className="block text-xs text-gray-500">Criado de</label>
          <input name="cf" defaultValue={f_created_from ?? ""} className="mt-1 w-full rounded-md border px-2 py-1" type="date" />
        </div>

        <div className="min-w-0 lg:col-span-2">
          <label className="block text-xs text-gray-500">Criado até</label>
          <input name="ct" defaultValue={f_created_to ?? ""} className="mt-1 w-full rounded-md border px-2 py-1" type="date" />
        </div>

        <div className="min-w-0 lg:col-span-2">
          <label className="block text-xs text-gray-500">Linhas por página</label>
          <select name="rpp" defaultValue={String(rpp)} className="mt-1 w-full rounded-md border px-2 py-1">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-12 flex gap-2 pt-1">
          <button className="rounded-md bg-gray-900 px-3 py-2 text-white hover:bg-black">Aplicar filtros</button>
          <a href="/admin" className="rounded-md bg-gray-200 px-3 py-2 hover:bg-gray-300">Limpar</a>
        </div>
      </form>

      {/* Tabela */}
      <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Código</th>
              <th className="px-3 py-2 text-left">Criado</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Total</th>
              <th className="px-3 py-2 text-left">Pagamento</th>
              <th className="px-3 py-2 text-left">Itens</th>
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {enriched.map((o) => (
              <tr key={o.id} className="align-top">
                <td className="px-3 py-2 font-medium">{o.order_code ?? o.id.slice(0, 8)}</td>
                <td className="px-3 py-2">{new Date(o.created_at).toLocaleString("pt-BR")}</td>
                <td className="px-3 py-2">{o.status}</td>
                <td className="px-3 py-2">{o.tipo ?? "—"}</td>
                <td className="px-3 py-2">{fmtBRL(o.total)}</td>
                <td className="px-3 py-2">{o.payment_method ?? "—"}</td>
                <td className="px-3 py-2 max-w-[360px]">
                  <div className="text-gray-700">{resumoItens(o.cart)}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <a
                      href={o.links.aceitar}
                      className="rounded-md bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700"
                    >
                      Aceitar
                    </a>
                    <a
                      href={o.links.negar}
                      className="rounded-md bg-rose-600 px-3 py-1 text-white hover:bg-rose-700"
                    >
                      Negar
                    </a>
                  </div>
                </td>
              </tr>
            ))}

            {!enriched.length && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* paginação */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-700">
        <div>
          {totalRows.toLocaleString("pt-BR")} resultado(s) • Página {page} de {totalPages}
        </div>
        <div className="flex gap-2">
          <a
            className={`rounded-md border px-3 py-1 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-gray-50"}`}
            href={page <= 1 ? "#" : buildQS(currentQS, { p: String(page - 1) })}
          >
            ← Anterior
          </a>
          <a
            className={`rounded-md border px-3 py-1 ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-gray-50"}`}
            href={page >= totalPages ? "#" : buildQS(currentQS, { p: String(page + 1) })}
          >
            Próxima →
          </a>
        </div>
      </div>
    </main>
  );
}
