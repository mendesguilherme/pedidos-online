// app/painel/_tabs/productsTabs.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save, Trash2, Plus, Image as ImageIcon, ListChecks } from "lucide-react";
import ImageUploader from "../_components/ImageUploader";

/* ===== Tipos ===== */
type Category = { id: string; name: string; active: boolean };
type Topping  = { id: number; name: string; imageUrl: string };
type Addon    = { id: number; name: string; imageUrl: string };

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  imageMeta?: any | null; // <- otimização via image_meta
  maxToppings: number;
  volumeMl: number;
  category_id: string | null;
  category?: { id: string; name: string; active: boolean } | null;
  allowedToppingIds?: number[];
  allowedAddonIds?: number[];
  active: boolean;
  slug: string | null;
  position: number;
};

const field =
  "mt-1 w-full h-10 rounded-xl border bg-white px-3 text-[15px] " +
  "border-[hsl(var(--border))] focus:outline-none focus:ring-2 " +
  "focus:ring-[hsl(var(--ring))]/40 focus:border-[hsl(var(--border))]";

const btnPager = "h-9 rounded-xl px-3"; // pager igual ao de Pedidos
const RPP = 25; // máximo 25 linhas por página

/* ===== helpers de moeda (iguais aos de Addons) ===== */
const fmtBRL = (v?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

function parseBRLToNumber(input: string): number {
  const s = String(input).trim()
    .replace(/\s/g, "")
    .replace(/[R$\u00A0]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** Campo de moeda inline (BRL no input, value é number) */
function InlineCurrency({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [txt, setTxt] = useState<string>(fmtBRL(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => { if (!focused) setTxt(fmtBRL(value)); }, [value, focused]);

  function handleFocus() { setFocused(true); setTxt(String(value ?? 0).replace(".", ",")); }
  function handleBlur()  { const n = parseBRLToNumber(txt); onChange(n); setTxt(fmtBRL(n)); setFocused(false); }
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setTxt(next);
    onChange(parseBRLToNumber(next));
  }

  return (
    <input
      className="h-9 w-20 rounded-xl border border-slate-300 bg-white px-2 text-sm text-right"
      value={txt}
      inputMode="decimal"
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
    />
  );
}

/** Inputs inline pequenos */
function InlineText({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      className="h-9 w-full rounded-xl border border-slate-300 bg-white px-2 text-sm"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
function InlineNumber({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      className="h-9 w-16 rounded-xl border border-slate-300 bg-white px-2 text-sm text-right"
      value={Number.isFinite(value as any) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

/** Tri-state label */
function triLabel(arr: number[] | undefined) {
  if (typeof arr === "undefined") return "Sem restrição";
  if (Array.isArray(arr) && arr.length === 0) return "Esconder";
  return `${arr?.length ?? 0} selecionado(s)`;
}

/** Usa image_meta (se existir) para retornar srcs ideais */
function pickThumb(meta: any | null | undefined, fallback?: string | null) {
  if (!meta || !meta.sources) return { avif: undefined, webp: undefined, img: fallback ?? undefined };
  const s = meta.sources;
  const avif = s["avif-64"]?.url || s["avif-128"]?.url || s["avif-256"]?.url;
  const webp = s["webp-64"]?.url || s["webp-128"]?.url || s["webp-256"]?.url;
  const img  = avif || webp || fallback || undefined;
  return { avif, webp, img };
}

/* ===== Componente ===== */
export default function ProductsTabs() { 
  const [rows, setRows] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [toppings, setToppings]     = useState<Topping[]>([]);
  const [addons, setAddons]         = useState<Addon[]>([]);
  const [loading, setLoading]       = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 🔹 Overlay “Salvando alterações...”
  const [busy, setBusy] = useState<{ open: boolean; text: string }>({ open: false, text: "" });

  // paginação local (25 por página)
  const [page, setPage] = useState(1);
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / RPP));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * RPP;
    return rows.slice(start, start + RPP);
  }, [rows, page]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

  // form create
  const [form, setForm] = useState({
    name: "", description: "", price: "0.00", imageUrl: "",
    maxToppings: 0, volumeMl: 0, categoryId: "",
    // 🔹 recebe o meta quando usar o uploader “detached”
    imageMeta: null as any | null,
  });

  // Modais
  const infoRef = useRef<HTMLDialogElement | null>(null);
  const confirmRef = useRef<HTMLDialogElement | null>(null);
  const pickRef = useRef<HTMLDialogElement | null>(null);

  // Modal de upload (por linha)
  const uploadRef = useRef<HTMLDialogElement | null>(null);
  const [uploadRow, setUploadRow] = useState<Product | null>(null);

  // Modal de upload “detached” (pré-criação)
  const createUploadRef = useRef<HTMLDialogElement | null>(null);

  // 🔹 Tela de edição de detalhes
  const editRef = useRef<HTMLDialogElement | null>(null);
  const [editRow, setEditRow] = useState<Product | null>(null);

  const [infoMsg, setInfoMsg] = useState("");
  const [confirmData, setConfirmData] = useState<{ id: number; name: string } | null>(null);

  // Picker state (toppings/addons)
  const [pickFor, setPickFor] = useState<{ id: number; kind: "toppings" | "addons" } | null>(null);
  const currentRow = useMemo(() => rows.find(r => r.id === pickFor?.id), [rows, pickFor]);

  function showInfo(msg: string) { setInfoMsg(msg); try { infoRef.current?.showModal(); } catch {} }
  function closeInfo() { try { infoRef.current?.close() } catch {}; setInfoMsg(""); }
  function openConfirm(id: number, name: string) { setConfirmData({ id, name }); try { confirmRef.current?.showModal() } catch {} }
  function closeConfirm() { try { confirmRef.current?.close() } catch {}; setConfirmData(null); }
  function openPicker(id: number, kind: "toppings" | "addons") { setPickFor({ id, kind }); try { pickRef.current?.showModal() } catch {} }
  function closePicker() { try { pickRef.current?.close() } catch {}; setPickFor(null); }
  function openUpload(row: Product) { setUploadRow(row); try { uploadRef.current?.showModal(); } catch {} }
  function closeUpload() { try { uploadRef.current?.close(); } catch {}; setUploadRow(null); }

  function openCreateUpload() {
    setForm(f => ({ ...f, imageUrl: "", imageMeta: null }));
    try { createUploadRef.current?.showModal(); } catch {}
  }
  function closeCreateUpload() { try { createUploadRef.current?.close(); } catch {} }

  // abrir/fechar edição
  function openEdit(row: Product) {
    setEditRow({
      ...row,
      description: row.description ?? "",
      price: Number(row.price ?? 0),
      category_id: row.category_id ?? "",
      volumeMl: Number(row.volumeMl ?? 0),
      maxToppings: Number(row.maxToppings ?? 0),
    });
    try { editRef.current?.showModal(); } catch {}
  }
  function closeEdit() { try { editRef.current?.close(); } catch {}; setEditRow(null); }

  async function fetchAll() {
    setLoading(true);
    try {
      const [pr, cr, tr, ar] = await Promise.all([
        fetch("/api/products?admin=1", { cache: "no-store" }).then(r => r.json()).catch(() => ({})),
        fetch("/api/categories",      { cache: "no-store" }).then(r => r.json()).catch(() => ({})),
        fetch("/api/toppings",        { cache: "no-store" }).then(r => r.json()).catch(() => ({})),
        fetch("/api/addons",          { cache: "no-store" }).then(r => r.json()).catch(() => ({})),
      ]);

      // Mapeia image/image_url -> imageUrl; image_meta -> imageMeta
      const raw = (pr?.data ?? []) as any[];
      const mapped = raw.map((r) => ({
        ...r,
        imageUrl: r.imageUrl ?? r.image ?? r.image_url ?? null,
        imageMeta: r.image_meta ?? r.imageMeta ?? null,
      })) as Product[];

      setRows(mapped);
      setCategories(((cr?.data ?? []) as any[]).filter(c => c.active));
      setToppings((tr?.data ?? []) as Topping[]);
      setAddons((ar?.data ?? []) as Addon[]);
    } finally { setLoading(false); }
  }
  useEffect(() => { fetchAll(); }, []);

  /** CREATE */
  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return showInfo("Informe o nome do produto.");

    const priceNum = parseFloat((form.price || "0").toString().replace(",", "."));
    if (!Number.isFinite(priceNum) || priceNum < 0) return showInfo("Preço inválido.");

    if (!form.categoryId) return showInfo("Selecione a categoria.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: form.description || "",
          price: priceNum,
          image_url: form.imageUrl || "",
          image_meta: form.imageMeta ?? null,
          maxToppings: Number(form.maxToppings || 0),
          volumeMl: Number(form.volumeMl || 0),
          categoryId: form.categoryId,
          position: 0,
        }),
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) return showInfo(payload?.error || `Falha ao criar (HTTP ${res.status}).`);
      setForm({ name:"", description:"", price:"0.00", imageUrl:"", maxToppings:0, volumeMl:0, categoryId:"", imageMeta: null });
      await fetchAll();
      showInfo("Produto criado com sucesso!");
    } catch (err:any) {
      showInfo(`Falha ao criar: ${String(err?.message ?? err)}`);
    } finally { setSubmitting(false); }
  }

  /** PATCH helper */
  async function patch(
    id: number,
    body: any,
    opts?: { silent?: boolean; overlayText?: string }
  ) {
    setLoading(true);
    if (opts?.overlayText) setBusy({ open: true, text: opts.overlayText });
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const msg = payload?.error || `Falha ao editar (HTTP ${res.status}).`;
        if (!opts?.silent) showInfo(msg);
        return;
      }
      await fetchAll();
      if (!opts?.silent) showInfo("Edição realizada com sucesso!");
    } finally {
      setLoading(false);
      if (opts?.overlayText) setBusy({ open: false, text: "" });
    }
  }

  /** DELETE (soft) */
  async function confirmAndDelete() {
    const id = confirmData?.id;
    if (!id && id !== 0) return closeConfirm();
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) { closeConfirm(); return showInfo(payload?.error || `Falha ao excluir (HTTP ${res.status}).`); }
      await fetchAll(); closeConfirm(); showInfo("Produto excluído com sucesso!");
    } finally { setLoading(false); }
  }

  // linha observada (para status de toppings/addons dentro do dialog)
  const editRowLive = useMemo(
    () => (editRow ? rows.find(r => r.id === editRow.id) ?? editRow : null),
    [rows, editRow]
  );

  /** UI */
  return (
    <div className="mt-4">
      {/* Inserção */}
      <form onSubmit={createProduct} className="rounded-xl border bg-white p-4 grid grid-cols-1 md:grid-cols-8 gap-3">
        <div className="md:col-span-4">
          <Label className="text-xs text-gray-500">Nome</Label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={field} required />
        </div>
        <div className="md:col-span-4">
          <Label className="text-xs text-gray-500">Descrição</Label>
          <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={field} placeholder="Opcional" />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs text-gray-500">Categoria</Label>
          <select
            value={form.categoryId}
            onChange={e => setForm(f => ({...f, categoryId: e.target.value}))}
            className={`${field} leading-[2.5rem] appearance-none pr-8`}
          >
            <option value="">Selecione</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs text-gray-500">Preço</Label>
          <Input type="number" step="0.01" inputMode="decimal" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} className={field} />
        </div>
        <div>
          <Label className="text-xs text-gray-500">Máx. Acompanh.</Label>
          <div className="flex justify-center">
            <Input type="number" value={form.maxToppings} onChange={e => setForm(f => ({ ...f, maxToppings: Number(e.target.value) }))} className={`${field} w-24`} />
          </div>
        </div>
        <div>
          <Label className="text-xs text-gray-500">Volume (ml)</Label>
          <Input type="number" value={form.volumeMl} onChange={e => setForm(f => ({...f, volumeMl: Number(e.target.value)}))} className={field}/>
        </div>
        <div className="md:col-span-3">
          <Label className="text-xs text-gray-500">Imagem (URL)</Label>
          <Input value={form.imageUrl} onChange={e => setForm(f => ({...f, imageUrl: e.target.value}))} className={field} placeholder="https://..."/>
        </div>
        {/* Botão uploader “detached” */}
        <div className="md:col-span-1 flex items-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl w-full"
            onClick={openCreateUpload}
            title="Selecionar imagem"
          >
            <ImageIcon className="w-4 h-4 mr-1" /> Imagem
          </Button>
        </div>
        <div className="flex items-end">
          <Button type="submit" className="rounded-xl w-full" disabled={submitting}>
            <Plus className="w-4 h-4 mr-2" />
            {submitting ? "Adicionando..." : "Adicionar"}
          </Button>
        </div>
      </form>

      {/* Tabela */}
      <div className="mt-4 overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm table-fixed">
          {/* 4 colunas: Ativo | Nome | Imagem | Ações */}
          <colgroup>
            <col className="w-[120px]" />
            <col className="w-[40%]" />
            <col className="w-[32%]" />
            <col className="w-[180px]" />
          </colgroup>
          <thead className="bg-[hsl(var(--primary))] text-white">
            <tr className="divide-x divide-white/30">
              <th className="px-3 py-2 text-left">Ativo</th>
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Imagem</th>
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {pagedRows.map((r) => {
              const thumb = pickThumb(r.imageMeta, r.imageUrl);
              return (
                <tr key={r.id} className="divide-x divide-slate-200">
                  {/* ativo */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Switch checked={!!r.active} onCheckedChange={(val) => patch(r.id, { active: val }, { silent: true })} />
                      <span className={`inline-flex items-center rounded-xl border px-2 py-1 text-xs font-medium ${
                        r.active ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                 : "border-slate-300 bg-slate-50 text-slate-600"
                      }`}>{r.active ? "Ativo" : "Inativo"}</span>
                    </div>
                  </td>

                  {/* nome */}
                  <td className="px-3 py-2 min-w-[260px]">
                    <InlineText
                      value={r.name}
                      onChange={(v) => setRows(rs => rs.map(x => x.id === r.id ? ({...x, name: v}) : x))}
                    />
                  </td>

                  {/* imagem */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-md border border-slate-200 overflow-hidden bg-white flex items-center justify-center">
                        {thumb.img ? (
                          <picture>
                            {thumb.avif && <source srcSet={thumb.avif} type="image/avif" />}
                            {thumb.webp && <source srcSet={thumb.webp} type="image/webp" />}
                            <img src={thumb.img} alt={r.name} className="h-full w-full object-cover" />
                          </picture>
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 w-24 sm:w-32 md:w-40">
                        <InlineText
                          value={r.imageUrl ?? ""}
                          placeholder="https://..."
                          onChange={(v) => setRows(rs => rs.map(x => x.id === r.id ? ({...x, imageUrl: v}) : x))}
                        />
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-xl shrink-0"
                        onClick={() => openUpload(r)}
                        title="Trocar imagem"
                      >
                        <ImageIcon className="w-4 h-4 mr-1" /> Imagem
                      </Button>
                    </div>
                  </td>

                  {/* ações */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm" variant="outline" className="h-8 rounded-xl"
                        onClick={() => patch(r.id, {
                          name: r.name,
                          image_url: r.imageUrl ?? "",
                          active: r.active,
                        }, { overlayText: "Salvando alterações..." })}
                      >
                        <Save className="w-4 h-4 mr-1" /> Salvar
                      </Button>

                      <Button size="sm" variant="outline" className="h-8 rounded-xl" onClick={() => openConfirm(r.id, r.name)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Excluir
                      </Button>

                      <Button
                        size="sm" variant="outline" className="h-8 rounded-xl"
                        onClick={() => openEdit(r)}
                      >
                        Editar detalhes
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!rows.length && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                  {loading ? "Carregando..." : "Nenhum produto"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* paginação (mesma da aba Pedidos) */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-700">
        <div>{totalRows.toLocaleString("pt-BR")} resultado(s) • Página {page} de {totalPages}</div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className={`${btnPager} ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
            onClick={() => page > 1 && setPage(page - 1)}
          >
            ← Anterior
          </Button>

          <Button
            variant="outline"
            className={`${btnPager} ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
            onClick={() => page < totalPages && setPage(page + 1)}
          >
            Próxima →
          </Button>
        </div>
      </div>

      {/* Modal: Upload “detached” para inserção */}
      <dialog ref={createUploadRef} className="rounded-xl border p-0 w-full max-w-sm">
        <form method="dialog" className="p-5">
          <h3 className="text-base font-semibold mb-3">Imagem do novo produto</h3>

          <ImageUploader
            entity="product"
            detached
            value={form.imageUrl || null}
            onChange={(url: string | null, meta?: any) => {
              setForm(f => ({ ...f, imageUrl: url || "", imageMeta: meta ?? null }));
              closeCreateUpload();
            }}
            label="Imagem (opcional)"
          />

          <div className="mt-4 flex justify-center">
            <button
              autoFocus
              className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm hover:bg-black"
              onClick={closeCreateUpload}
            >
              Fechar
            </button>
          </div>
        </form>
      </dialog>

      {/* Modal: Upload de imagem (por linha) */}
      <dialog ref={uploadRef} className="rounded-xl border p-0 w-full max-w-sm">
        <form method="dialog" className="p-5">
          <h3 className="text-base font-semibold mb-3">
            {uploadRow ? `Imagem de "${uploadRow.name}"` : "Imagem"}
          </h3>

          {uploadRow && (
            <ImageUploader
              entity="product"
              entityId={String(uploadRow.id)}
              value={uploadRow.imageUrl ?? null}
              onChange={(url: string | null, meta?: any) => {
                if (url) {
                  setRows((rs) =>
                    rs.map((x) =>
                      x.id === uploadRow.id
                        ? { ...x, imageUrl: url, imageMeta: meta ?? x.imageMeta }
                        : x
                    )
                  );
                  closeUpload();
                  showInfo("Imagem atualizada com sucesso!");
                } else {
                  void patch(uploadRow.id, { image_url: "" }, { silent: true });
                  setRows((rs) =>
                    rs.map((x) =>
                      x.id === uploadRow.id
                        ? { ...x, imageUrl: "", imageMeta: null }
                        : x
                    )
                  );
                  closeUpload();
                  showInfo("Imagem removida.");
                }
              }}
            />
          )}

          <div className="mt-4 flex justify-center">
            <button
              autoFocus
              className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm hover:bg-black"
              onClick={closeUpload}
            >
              Fechar
            </button>
          </div>
        </form>
      </dialog>      
      
      {/* MODAL: Edição de detalhes */}
      <dialog ref={editRef} className="rounded-xl border p-0 w-full max-w-lg">
        <form method="dialog" className="p-5">
          <h3 className="text-base font-semibold mb-3">
            {editRow ? `Editar detalhes de "${editRow.name}"` : "Editar detalhes"}
          </h3>

          {editRow && (
            <div className="grid grid-cols-1 md:grid-cols-8 gap-3">
              {/* Descrição + Categoria */}
              <div className="md:col-span-5">
                <Label className="text-xs text-gray-500">Descrição</Label>
                <Input
                  value={editRow.description ?? ""}
                  onChange={(e) => setEditRow(er => er ? ({ ...er, description: e.target.value }) : er)}
                  className={field}
                  placeholder="Opcional"
                />
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs text-gray-500">Categoria</Label>
                <select
                  value={editRow.category_id ?? ""}
                  onChange={(e) => setEditRow(er => er ? ({ ...er, category_id: e.target.value || "" }) : er)}
                  className={`${field} leading-[2.5rem] appearance-none pr-8`}
                >
                  <option value="">Selecione</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Preço (expandir e alinhar à esquerda) */}
              <div className="md:col-span-3">
                <Label className="text-xs text-gray-500">Preço</Label>
                <div className="mt-1 h-10 flex items-center w-full [&>input]:w-full [&>input]:text-left">
                  <InlineCurrency
                    value={editRow.price ?? 0}
                    onChange={(v) => setEditRow(er => er ? ({ ...er, price: v }) : er)}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs text-gray-500 whitespace-nowrap">Volume (ml)</Label>
                <Input
                  type="number"
                  value={Number(editRow.volumeMl ?? 0)}
                  onChange={(e) => setEditRow(er => er ? ({ ...er, volumeMl: Number(e.target.value || 0) }) : er)}
                  className={field}
                />
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs text-gray-500 whitespace-nowrap">Máx. Acompanh.</Label>
                <Input
                  type="number"
                  value={Number(editRow.maxToppings ?? 0)}
                  onChange={(e) => setEditRow(er => er ? ({ ...er, maxToppings: Number(e.target.value || 0) }) : er)}
                  className={field}
                />
              </div>

              {/* Acompanhamentos */}
              <div className="md:col-span-8">
                <Label className="text-xs text-gray-500">Acompanhamentos</Label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex h-10 items-center rounded-xl border px-3 text-sm border-slate-300 bg-white">
                    {triLabel(editRowLive?.allowedToppingIds)}
                  </span>
                  <Button
                    size="sm" variant="outline" className="h-10 rounded-xl"
                    onClick={() => editRow && openPicker(editRow.id, "toppings")}
                    type="button"
                  >
                    <ListChecks className="w-4 h-4 mr-1" /> Editar
                  </Button>
                </div>
              </div>

              {/* Adicionais */}
              <div className="md:col-span-8">
                <Label className="text-xs text-gray-500">Adicionais</Label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex h-10 items-center rounded-xl border px-3 text-sm border-slate-300 bg-white">
                    {triLabel(editRowLive?.allowedAddonIds)}
                  </span>
                  <Button
                    size="sm" variant="outline" className="h-10 rounded-xl"
                    onClick={() => editRow && openPicker(editRow.id, "addons")}
                    type="button"
                  >
                    <ListChecks className="w-4 h-4 mr-1" /> Editar
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              className="rounded-xl bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300"
              onClick={closeEdit}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded-xl bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black"
              onClick={async () => {
                if (!editRow) return closeEdit();
                const live = rows.find(r => r.id === editRow.id);
                await patch(editRow.id, {
                  description: editRow.description ?? "",
                  price: Number(editRow.price ?? 0),
                  category_id: editRow.category_id || null,
                  volume_ml: Number(editRow.volumeMl ?? 0),
                  max_toppings: Number(editRow.maxToppings ?? 0),
                  allowed_topping_ids: live?.allowedToppingIds ?? null,
                  allowed_addon_ids: live?.allowedAddonIds ?? null,
                }, { overlayText: "Salvando alterações..." });
                closeEdit();
              }}
            >
              Salvar
            </button>
          </div>
        </form>
      </dialog>

      {/* Confirmar exclusão */}
      <dialog ref={confirmRef} className="rounded-xl border p-0 w-full max-w-sm">
        <form method="dialog" className="p-5 text-center">
          <h3 className="text-base font-semibold mb-1">Excluir produto</h3>
          <p className="text-sm text-gray-600">
            Tem certeza que deseja excluir <span className="font-semibold">{confirmData?.name ?? "este produto"}</span>?
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button value="cancel" className="rounded-xl bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300" onClick={closeConfirm}>Cancelar</button>
            <button type="button" className="rounded-xl bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black" onClick={confirmAndDelete}>
              Confirmar exclusão
            </button>
          </div>
        </form>
      </dialog>

      {/* Mensagens */}
      <dialog ref={infoRef} className="rounded-xl border p-0 w-full max-w-sm">
        <form method="dialog" className="p-5 text-center">
          <p className="text-base font-semibold">{infoMsg}</p>
          <div className="mt-4 flex justify-center">
            <button autoFocus className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm hover:bg-black" onClick={closeInfo}>OK</button>
          </div>
        </form>
      </dialog>

      {/* Picker de Toppings/Addons */}
      <dialog ref={pickRef} className="rounded-xl border p-0 w-full max-w-md">
        <form method="dialog" className="p-4">
          <div className="text-base font-semibold text-center mb-2">
            {pickFor?.kind === "toppings" ? "Selecionar Toppings" : "Selecionar Adicionais"}
          </div>

          <p className="text-xs text-gray-600 text-center mb-3">
            • <b>Sem restrição</b>: permite todos — • <b>Esconder</b>: não mostra — • <b>Selecionar</b>: escolha a lista
          </p>

          <div className="max-h-[360px] overflow-y-auto grid grid-cols-1 gap-1">
            {(pickFor?.kind === "toppings" ? toppings : addons).map((it) => {
              const isToppings = pickFor?.kind === "toppings";
              const row = currentRow;
              const isChecked = isToppings
                ? !!row?.allowedToppingIds?.includes(it.id)
                : !!row?.allowedAddonIds?.includes(it.id);

              return (
                <label key={it.id} className="flex items-center gap-2 rounded-lg border p-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={isChecked}
                    onChange={(e) => {
                      if (!pickFor || !row) return;
                      const checked = e.target.checked;
                      const id = it.id;

                      if (pickFor.kind === "toppings") {
                        const cur = row.allowedToppingIds ?? [];
                        const next = checked ? (cur.includes(id) ? cur : [...cur, id]) : cur.filter((x) => x !== id);
                        setRows((rs) => rs.map((x) => (x.id === row.id ? { ...x, allowedToppingIds: next } : x)));
                      } else {
                        const cur = row.allowedAddonIds ?? [];
                        const next = checked ? (cur.includes(id) ? cur : [...cur, id]) : cur.filter((x) => x !== id);
                        setRows((rs) => rs.map((x) => (x.id === row.id ? { ...x, allowedAddonIds: next } : x)));
                      }
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md border border-slate-200 overflow-hidden bg-white flex items-center justify-center">
                      {it.imageUrl ? (
                        <img src={it.imageUrl} alt={it.name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span className="text-sm">{it.name}</span>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <button type="button" className="rounded-xl bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300" onClick={() => closePicker()}>
              Cancelar
            </button>
            <button
              type="button"
              className="rounded-xl bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black"
              onClick={async () => {
                if (!currentRow || !pickFor) return closePicker();
                if (pickFor.kind === "toppings") {
                  await patch(currentRow.id, { allowed_topping_ids: currentRow.allowedToppingIds ?? [] }, { silent: true });
                } else {
                  await patch(currentRow.id, { allowed_addon_ids: currentRow.allowedAddonIds ?? [] }, { silent: true });
                }
                closePicker();
                showInfo("Edição realizada com sucesso!");
              }}
            >
              Salvar seleção
            </button>
            <button
              type="button"
              className="rounded-xl border px-3 py-2 text-sm"
              onClick={async () => {
                if (!currentRow || !pickFor) return closePicker();
                if (pickFor.kind === "toppings") await patch(currentRow.id, { allowed_topping_ids: null }, { silent: true });
                else await patch(currentRow.id, { allowed_addon_ids: null }, { silent: true });
                closePicker(); showInfo("Definido como 'Sem restrição'.");
              }}
            >
              Sem restrição
            </button>
            <button
              type="button"
              className="rounded-xl border px-3 py-2 text-sm"
              onClick={async () => {
                if (!currentRow || !pickFor) return closePicker();
                if (pickFor.kind === "toppings") await patch(currentRow.id, { allowed_topping_ids: [] }, { silent: true });
                else await patch(currentRow.id, { allowed_addon_ids: [] }, { silent: true });
                closePicker(); showInfo("Definido como 'Esconder'.");
              }}
            >
              Esconder
            </button>
          </div>
        </form>
      </dialog>

      {/* 🔹 Overlay global de processo (igual ao “Criando pedido...”) */}
      {busy.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl px-6 py-4 text-center shadow-lg">
            <p className="text-sm sm:text-base font-medium">{busy.text || "Processando..."}</p>
            <div className="mt-4 w-8 h-8 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
}
