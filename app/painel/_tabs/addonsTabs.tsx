// app/painel/_tabs/addonsTabs.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save, Trash2, Plus, Image as ImageIcon } from "lucide-react";

type ImageSources = Record<string, { url: string; size: number; format: string }>;
type ImageMeta = {
  bucket?: string;
  folder?: string;
  original?: { width?: number | null; height?: number | null; mime?: string | null };
  sizes?: number[];
  formats?: string[];
  sources?: ImageSources;
  updated_at?: string;
} | null;

type Addon = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  image_meta?: ImageMeta; // pode vir do GET
  active?: boolean;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

const field =
  "mt-1 w-full h-10 rounded-xl border bg-white px-3 text-[15px] " +
  "border-[hsl(var(--border))] focus:outline-none focus:ring-2 " +
  "focus:ring-[hsl(var(--ring))]/40 focus:border-[hsl(var(--border))]";

const btnPager = "h-9 rounded-xl px-3"; // pager igual ao usado na aba Pedidos
const RPP = 25; // máximo 25 linhas por página

// helpers de moeda
const fmtBRL = (v?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

function parseBRLToNumber(input: string): number {
  const s = String(input)
    .trim()
    .replace(/\s/g, "")
    .replace(/[R$\u00A0]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

// escolhe miniatura 64px a partir do image_meta
function pickThumb(meta?: ImageMeta): string | null {
  const s = meta?.sources;
  return s?.["avif-64"]?.url ?? s?.["webp-64"]?.url ?? null;
}

export default function AddonsTabs({ ImageUploader }: any) {
  const [rows, setRows] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasAdminFields, setHasAdminFields] = useState(false);

  const [form, setForm] = useState<{ name: string; price: string; imageUrl: string; imageMeta?: any | null }>({
    name: "",
    price: "0,00",
    imageUrl: "",
    imageMeta: null,
  });

  // paginação
  const [page, setPage] = useState(1);
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / RPP));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * RPP;
    return rows.slice(start, start + RPP);
  }, [rows, page]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

  // ---- MODAIS ----
  const confirmRef = useRef<HTMLDialogElement | null>(null);
  const infoRef = useRef<HTMLDialogElement | null>(null);
  const uploadRef = useRef<HTMLDialogElement | null>(null);
  const createUploadRef = useRef<HTMLDialogElement | null>(null);

  const [confirmData, setConfirmData] = useState<{ id: number; name: string } | null>(null);
  const [infoMsg, setInfoMsg] = useState<string>("");
  const [uploadRow, setUploadRow] = useState<Addon | null>(null);

  function openConfirm(id: number, name: string) {
    setConfirmData({ id, name });
    try { confirmRef.current?.showModal(); } catch {}
  }
  function closeConfirm() {
    try { confirmRef.current?.close(); } catch {}
    setConfirmData(null);
  }
  function showInfo(msg: string) {
    setInfoMsg(msg);
    try { infoRef.current?.showModal(); } catch {}
  }
  function closeInfo() {
    try { infoRef.current?.close(); } catch {}
    setInfoMsg("");
  }
  function openUpload(row: Addon) {
    setUploadRow(row);
    try { uploadRef.current?.showModal(); } catch {}
  }
  function closeUpload() {
    try { uploadRef.current?.close(); } catch {}
    setUploadRow(null);
  }
  function openCreateUpload() {
    // limpa preview anterior do modal detached
    setForm(f => ({ ...f, imageUrl: "", imageMeta: null }));
    try { createUploadRef.current?.showModal(); } catch {}
  }
  function closeCreateUpload() {
    try { createUploadRef.current?.close(); } catch {}
  }

  async function fetchRows() {
    setLoading(true);
    try {
      let res = await fetch("/api/addons?admin=1", { cache: "no-store" });
      if (!res.ok) res = await fetch("/api/addons", { cache: "no-store" });

      const json = await res.json().catch(() => ({}));
      const data = (json?.data ?? []) as any[];

      const normalized: Addon[] = data.map((d) => ({
        id: d.id,
        name: d.name,
        price: typeof d.price === "number" ? d.price : Number(d.price ?? 0),
        imageUrl: d.imageUrl ?? d.image_url ?? "",
        image_meta: d.image_meta ?? d.imageMeta ?? null,
        active:
          typeof d.active === "boolean"
            ? d.active
            : typeof d.isActive === "boolean"
            ? d.isActive
            : true,
        deleted: typeof d.deleted === "boolean" ? d.deleted : false,
        created_at: d.created_at,
        updated_at: d.updated_at,
        deleted_at: d.deleted_at ?? null,
      }));

      setRows(normalized);
      setHasAdminFields(normalized.some((d) => Object.prototype.hasOwnProperty.call(d, "active")));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRows();
  }, []);

  // CREATE
  async function createAddon(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return showInfo("Informe o nome do adicional.");

    const priceNum = parseBRLToNumber(form.price);
    if (Number.isNaN(priceNum) || priceNum < 0) return showInfo("Preço inválido.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: priceNum,
          imageUrl: form.imageUrl?.trim() || null,
          imageMeta: form.imageMeta ?? null, // <- envia meta quando houver (detached)
        }),
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const raw = (payload?.message || payload?.error || "");
        if (res.status === 409 || /duplicate key|already exists|23505/i.test(raw + payload?.code)) {
          showInfo("Já existe um adicional com esse nome.");
          return;
        }
        showInfo(payload?.error || `Falha ao criar adicional (HTTP ${res.status}).`);
        return;
      }
      setForm({ name: "", price: "0,00", imageUrl: "", imageMeta: null });
      await fetchRows();
      showInfo("Adicional criado com sucesso!");
    } catch (err: any) {
      showInfo(`Falha ao criar: ${String(err?.message ?? err)}`);
    } finally {
      setSubmitting(false);
    }
  }

  // PATCH
  async function patch(id: number, body: any, opts?: { silent?: boolean }) {
    setLoading(true);
    try {
      const res = await fetch(`/api/addons/${id}`, {
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
      await fetchRows();
      if (!opts?.silent) showInfo("Edição realizada com sucesso!");
    } finally {
      setLoading(false);
    }
  }

  // DELETE (soft)
  async function confirmAndDelete() {
    const id = confirmData?.id;
    if (!id && id !== 0) return closeConfirm();
    setLoading(true);
    try {
      const res = await fetch(`/api/addons/${id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const msg = payload?.error || `Falha ao excluir (HTTP ${res.status}).`;
        closeConfirm();
        showInfo(msg);
        return;
      }
      await fetchRows();
      closeConfirm();
      showInfo("Adicional excluído com sucesso!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      {/* Inserção acima da tabela */}
      <form
        onSubmit={createAddon}
        className="rounded-xl border bg-white p-4 grid grid-cols-1 md:grid-cols-8 gap-3"
      >
        <div className="md:col-span-3">
          <Label className="text-xs text-gray-500">Nome</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={field}
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs text-gray-500">Preço</Label>
          <CurrencyInput
            value={form.price}
            onChangeText={(txt) => setForm((f) => ({ ...f, price: txt }))}
            className={field}
          />
        </div>
        <div className="md:col-span-1">
          <Label className="text-xs text-gray-500">Imagem (URL)</Label>
          <Input
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            className={field}
            placeholder="https://..."
          />
        </div>
        {/* Botão de seleção de imagem (detached) */}
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
          {hasAdminFields
            ? <colgroup><col className="w-[10%]"/><col className="w-[40%]"/><col className="w-[14%]"/><col className="w-[24%]"/><col className="w-[12%]"/></colgroup>
            : <colgroup><col className="w-[12%]"/><col className="w-[48%]"/><col className="w-[16%]"/><col className="w-[24%]"/></colgroup>}
          <thead className="bg-[hsl(var(--primary))] text-white">
            <tr className="divide-x divide-white/30">
              {hasAdminFields && <th className="px-3 py-2 text-left">Ativo</th>}
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Preço</th>
              <th className="px-3 py-2 text-left">Imagem</th>              
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {pagedRows.map((r) => {
              const isActive = r.active !== false;
              const thumb = pickThumb(r.image_meta);

              return (
                <tr key={r.id} className="divide-x divide-slate-200">
                  {/* Ativo */}
                  {hasAdminFields && (
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isActive}
                          onCheckedChange={(val) => patch(r.id, { active: val }, { silent: true })}
                        />
                        <span
                          className={`inline-flex items-center rounded-xl border px-2 py-1 text-xs font-medium ${
                            isActive
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-slate-300 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {isActive ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Nome */}
                  <td className="px-3 py-2">
                    <InlineText
                      value={r.name}
                      onChange={(v) =>
                        setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, name: v } : x)))
                      }
                    />
                  </td>

                  {/* Preço (moeda) */}
                  <td className="px-3 py-2">
                    <InlineCurrency
                      value={r.price}
                      onChange={(v) =>
                        setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, price: v } : x)))
                      }
                    />
                  </td>

                  {/* Imagem (preview + caminho + botão Imagem) */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {thumb || r.imageUrl ? (
                        <img
                          src={thumb || r.imageUrl}
                          alt={r.name}
                          className="h-8 w-8 rounded-md object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-md border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}

                      {/* campo do caminho da imagem (compacto) */}
                      <div className="w-28 sm:w-40 md:w-56">
                        <InlineText
                          value={r.imageUrl ?? ""}
                          placeholder="https://..."
                          onChange={(v) =>
                            setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, imageUrl: v } : x)))
                          }
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

                  {/* Ações */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-xl"
                        onClick={() =>
                          patch(r.id, {
                            name: r.name,
                            price: r.price,
                            imageUrl: r.imageUrl ?? null,
                          })
                        }
                      >
                        <Save className="w-4 h-4 mr-1" /> Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-xl"
                        onClick={() => openConfirm(r.id, r.name)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!rows.length && (
              <tr>
                <td colSpan={hasAdminFields ? 5 : 4} className="px-3 py-8 text-center text-gray-500">
                  {loading ? "Carregando..." : "Nenhum adicional"}
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

      {/* ======= MODAL: Upload “detached” para a faixa de inserção ======= */}
      <dialog ref={createUploadRef} className="rounded-xl border p-0 w-full max-w-sm">
        <form method="dialog" className="p-5">
          <h3 className="text-base font-semibold mb-3">Imagem do novo adicional</h3>

          {ImageUploader && (
            <ImageUploader
              entity="addon"
              detached
              value={form.imageUrl || null}
              onChange={(url: string | null, meta?: any) => {
                setForm((f) => ({ ...f, imageUrl: url || "", imageMeta: meta ?? null }));
                closeCreateUpload();
              }}
              label="Imagem (opcional)"
            />
          )}

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

      {/* ======= MODAL: Upload por linha (registro existente) ======= */}
      <dialog ref={uploadRef} className="rounded-xl border p-0 w-full max-w-sm">
        <form method="dialog" className="p-5">
          <h3 className="text-base font-semibold mb-3">
            {uploadRow ? `Imagem de "${uploadRow.name}"` : "Imagem"}
          </h3>

          {uploadRow && ImageUploader && (
            <ImageUploader
              entity="addon"
              entityId={String(uploadRow.id)}
              value={uploadRow.imageUrl ?? null}
              onChange={(url: string | null, meta?: any) => {
                if (url) {
                  // atualiza preview imediato: URL principal + meta para o thumb
                  setRows((rs) =>
                    rs.map((x) =>
                      x.id === uploadRow.id
                        ? { ...x, imageUrl: url, image_meta: meta ?? x.image_meta }
                        : x
                    )
                  );
                  closeUpload();
                  showInfo("Imagem atualizada com sucesso!");
                  // opcional: refetch para sincronizar com a view
                  // void fetchRows();
                } else {
                  // remoção: limpa no banco e local
                  patch(uploadRow.id, { imageUrl: null }, { silent: true });
                  setRows((rs) =>
                    rs.map((x) =>
                      x.id === uploadRow.id ? { ...x, imageUrl: "", image_meta: null } : x
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

      {/* ======= MODAL: Confirmação ======= */}
      <dialog ref={confirmRef} className="rounded-xl border p-0 w-full max-w-sm">
        <form method="dialog" className="p-5 text-center">
          <h3 className="text-base font-semibold mb-1">Excluir adicional</h3>
          <p className="text-sm text-gray-600">
            Tem certeza que deseja excluir{" "}
            <span className="font-semibold">{confirmData?.name ?? "este adicional"}</span>?
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              value="cancel"
              className="rounded-xl bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300"
              onClick={closeConfirm}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded-xl bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black"
              onClick={confirmAndDelete}
            >
              Confirmar exclusão
            </button>
          </div>
        </form>
      </dialog>

      {/* ======= MODAL: Info ======= */}
      <dialog ref={infoRef} className="rounded-xl border p-0 w-full max-w-sm">
        <form method="dialog" className="p-5 text-center">
          <p className="text-base font-semibold">{infoMsg}</p>
          <div className="mt-4 flex justify-center">
            <button
              autoFocus
              className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm hover:bg-black"
              onClick={closeInfo}
            >
              OK
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

/* ------------ inputs inline ------------ */
function InlineText({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      className="h-9 w-full rounded-xl border border-slate-300 bg-white px-2 text-sm"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Campo de moeda (exibe BRL). Chama onChange com número a cada digitação e normaliza ao sair. */
function InlineCurrency({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [txt, setTxt] = useState<string>(fmtBRL(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setTxt(fmtBRL(value));
  }, [value, focused]);

  function handleFocus() {
    setFocused(true);
    setTxt(String(value ?? 0).replace(".", ","));
  }

  function handleBlur() {
    const n = parseBRLToNumber(txt);
    onChange(n);
    setTxt(fmtBRL(n));
    setFocused(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setTxt(next);
    onChange(parseBRLToNumber(next));
  }

  return (
    <input
      className="h-9 w-28 rounded-xl border border-slate-300 bg-white px-2 text-sm"
      value={txt}
      inputMode="decimal"
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
    />
  );
}

/** Campo de moeda do formulário de criação (string controlada). */
function CurrencyInput({
  value,
  onChangeText,
  className,
}: {
  value: string;
  onChangeText: (s: string) => void;
  className?: string;
}) {
  function handleBlur() {
    const n = parseBRLToNumber(value);
    onChangeText(fmtBRL(n));
  }

  return (
    <input
      className={className}
      value={value}
      placeholder="R$ 0,00"
      onBlur={handleBlur}
      onChange={(e) => onChangeText(e.target.value)}
      inputMode="decimal"
    />
  );
}
