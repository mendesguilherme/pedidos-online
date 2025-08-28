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
  "mt-1 w-full h-10 rounded-xl border border-purple-300 bg-white px-3 text-[15px] " +
  "focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300";

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
          // 🔹 envia a URL e o META (se veio do uploader “detached”)
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
  async function patch(id: number, body: any, opts?: { silent?: boolean }) {
    setLoading(true);
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
    } finally { setLoading(false); }
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
        {/* 🔹 Botão para abrir o uploader “detached” (pré-criação) */}
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
          {/* colgroup em UMA linha (evita hidratação quebrar) */}
          <colgroup><col className="w-[22%]" /><col className="w-[18%]" /><col className="w-[90px]" /><col className="w-[14%]" /><col className="w-[20%]" /><col className="w-[84px]" /><col className="w-[96px]" /><col className="w-[12%]" /><col className="w-[12%]" /><col className="w-[120px]" /><col className="w-[180px]" /></colgroup>
          <thead className="bg-[hsl(var(--primary))] text-white">
            <tr className="divide-x divide-white/30">
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Descrição</th>
              <th className="px-3 py-2 text-left">Preço</th>
              <th className="px-3 py-2 text-left">Categoria</th>
              <th className="px-3 py-2 text-left">Imagem</th>
              <th className="px-3 py-2 text-left">Volume</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Máx. Acomp.</th>
              <th className="px-3 py-2 text-left">Acompanhamentos</th>
              <th className="px-3 py-2 text-left">Adicionais</th>
              <th className="px-3 py-2 text-left">Ativo</th>
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((r) => {
              const thumb = pickThumb(r.imageMeta, r.imageUrl);
              return (
                <tr key={r.id} className="divide-x divide-slate-200">
                  {/* nome */}
                  <td className="px-3 py-2 min-w-[260px]">
                    <InlineText
                      value={r.name}
                      onChange={(v) => setRows(rs => rs.map(x => x.id === r.id ? ({...x, name: v}) : x))}
                    />
                  </td>

                  {/* descrição */}
                  <td className="px-3 py-2 min-w-[220px]">
                    <InlineText
                      value={r.description}
                      onChange={(v) => setRows(rs => rs.map(x => x.id === r.id ? ({...x, description: v}) : x))}
                      placeholder="Opcional"
                    />
                  </td>

                  {/* preço */}
                  <td className="px-3 py-2">
                    <InlineCurrency
                      value={r.price}
                      onChange={(v) => setRows(rs => rs.map(x => x.id === r.id ? ({...x, price: v}) : x))}
                    />
                  </td>

                  {/* categoria */}
                  <td className="px-3 py-2">
                    <select
                      className="h-9 rounded-xl border border-slate-300 bg-white px-2 text-sm"
                      value={r.category_id ?? ""}
                      onChange={(e) => {
                        const val = e.target.value || null;
                        setRows(rs => rs.map(x => x.id === r.id ? ({...x, category_id: val}) : x));
                      }}
                    >
                      <option value="">—</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  
                  {/* imagem (preview otimizado + caminho + botão) */}
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

                      {/* campo do caminho (um pouco menor para caber o botão ao lado) */}
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

                  {/* volume */}
                  <td className="px-3 py-2">
                    <InlineNumber
                      value={r.volumeMl}
                      onChange={(v) => setRows(rs => rs.map(x => x.id === r.id ? ({...x, volumeMl: v}) : x))}
                    />
                  </td>

                  {/* máx. acompanh. */}
                  <td className="px-3 py-2">
                    <div className="flex justify-center">
                      <InlineNumber
                        value={r.maxToppings}
                        onChange={(v) => setRows(rs => rs.map(x => x.id === r.id ? ({...x, maxToppings: v}) : x))}
                      />
                    </div>
                  </td>

                  {/* Acompanhamentos (status + editar) */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-xl border px-2 py-1 text-xs font-medium border-slate-300 bg-slate-50 text-slate-700">
                        {triLabel(r.allowedToppingIds)}
                      </span>
                      <Button size="sm" variant="outline" className="h-8 rounded-xl"
                        onClick={() => openPicker(r.id, "toppings")}
                        title="Selecionar acompanhamentos">
                        <ListChecks className="w-4 h-4 mr-1" /> Editar
                      </Button>
                    </div>
                  </td>

                  {/* Adicionais (status + editar) */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-xl border px-2 py-1 text-xs font-medium border-slate-300 bg-slate-50 text-slate-700">
                        {triLabel(r.allowedAddonIds)}
                      </span>
                      <Button size="sm" variant="outline" className="h-8 rounded-xl"
                        onClick={() => openPicker(r.id, "addons")}
                        title="Selecionar adicionais">
                        <ListChecks className="w-4 h-4 mr-1" /> Editar
                      </Button>
                    </div>
                  </td>

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

                  {/* ações */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm" variant="outline" className="h-8 rounded-xl"
                        onClick={() => patch(r.id, {
                          name: r.name,
                          description: r.description,
                          price: r.price,
                          category_id: r.category_id,
                          volume_ml: r.volumeMl,
                          max_toppings: r.maxToppings,
                          image_url: r.imageUrl ?? "",
                        })}
                      >
                        <Save className="w-4 h-4 mr-1" /> Salvar
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 rounded-xl" onClick={() => openConfirm(r.id, r.name)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!rows.length && (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-gray-500">
                  {loading ? "Carregando..." : "Nenhum produto"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
                  // ✅ atualiza imediatamente: URL + META locais (preview troca na hora)
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
                  // Remoção
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
              const isChecked = isToppings
                ? !!currentRow?.allowedToppingIds?.includes(it.id)
                : !!currentRow?.allowedAddonIds?.includes(it.id);

              return (
                <label key={it.id} className="flex items-center gap-2 rounded-lg border p-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={isChecked}
                    onChange={(e) => {
                      if (!pickFor || !currentRow) return;
                      const checked = e.target.checked;
                      const id = it.id;

                      if (pickFor.kind === "toppings") {
                        const cur = currentRow.allowedToppingIds ?? [];
                        const next = checked ? (cur.includes(id) ? cur : [...cur, id]) : cur.filter((x) => x !== id);
                        setRows((rs) => rs.map((x) => (x.id === currentRow.id ? { ...x, allowedToppingIds: next } : x)));
                      } else {
                        const cur = currentRow.allowedAddonIds ?? [];
                        const next = checked ? (cur.includes(id) ? cur : [...cur, id]) : cur.filter((x) => x !== id);
                        setRows((rs) => rs.map((x) => (x.id === currentRow.id ? { ...x, allowedAddonIds: next } : x)));
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
    </div>
  );
}
