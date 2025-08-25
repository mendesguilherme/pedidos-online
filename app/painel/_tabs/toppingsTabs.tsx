// app/painel/_tabs/toppingsTabs.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save, Trash2, Plus, Image as ImageIcon } from "lucide-react";

type Topping = {
  id: number;
  name: string;
  imageUrl: string;
  // podem ou não vir do GET
  active?: boolean;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

const field =
  "mt-1 w-full h-10 rounded-xl border border-purple-300 bg-white px-3 text-[15px] " +
  "focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300";

export default function ToppingsTabs() {
  const [rows, setRows] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{ name: string; imageUrl: string }>({ name: "", imageUrl: "" });

  // ---- MODAIS (confirmação + mensagens) ----
  const confirmRef = useRef<HTMLDialogElement | null>(null);
  const infoRef = useRef<HTMLDialogElement | null>(null);
  const [confirmData, setConfirmData] = useState<{ id: number; name: string } | null>(null);
  const [infoMsg, setInfoMsg] = useState<string>("");

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

  async function fetchRows() {
    setLoading(true);
    try {
      // tenta rota com admin (que pode incluir active/deleted); se não rolar, cai no básico
      let res = await fetch("/api/toppings?admin=1", { cache: "no-store" });
      if (!res.ok) res = await fetch("/api/toppings", { cache: "no-store" });

      const json = await res.json().catch(() => ({}));
      const data = (json?.data ?? []) as Topping[];

      // garante defaults para active/deleted quando a API não enviar
      const normalized = data.map((d) => ({
        ...d,
        active: typeof d.active === "boolean" ? d.active : true,
        deleted: typeof d.deleted === "boolean" ? d.deleted : false,
      }));
      setRows(normalized);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRows(); }, []);

  // CREATE
  async function createTopping(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return showInfo("Informe o nome do acompanhamento.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/toppings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, imageUrl: form.imageUrl?.trim() || null }),
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const msg = payload?.error || `Falha ao criar acompanhamento (HTTP ${res.status}).`;
        showInfo(msg);
        return;
      }
      setForm({ name: "", imageUrl: "" });
      await fetchRows();
      showInfo("Acompanhamento criado com sucesso!");
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
      const res = await fetch(`/api/toppings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const msg = payload?.error || `Falha ao editar (HTTP ${res.status}).`;
        // sempre mostra erro, independente do "silent"
        showInfo(msg);
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
      const res = await fetch(`/api/toppings/${id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const msg = payload?.error || `Falha ao excluir (HTTP ${res.status}).`;
        closeConfirm();
        showInfo(msg);
        return;
      }
      await fetchRows();
      closeConfirm();
      showInfo("Acompanhamento excluído com sucesso!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      {/* Inserção acima da tabela */}
      <form onSubmit={createTopping} className="rounded-xl border bg-white p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
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
          <Label className="text-xs text-gray-500">URL da Imagem (opcional)</Label>
          <Input
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            className={field}
            placeholder="https://..."
          />
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
        <table className="min-w-full text-sm">
          <thead className="bg-[hsl(var(--primary))] text-white">
            <tr className="divide-x divide-white/30">
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Imagem</th>
              <th className="px-3 py-2 text-left">Ativo</th>
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((r) => {
              const isActive = r.active !== false; // default para true quando não vier da API
              return (
                <tr key={r.id} className="divide-x divide-slate-200">
                  {/* Nome */}
                  <td className="px-3 py-2">
                    <InlineText
                      value={r.name}
                      onChange={(v) =>
                        setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, name: v } : x)))
                      }
                    />
                  </td>

                  {/* Imagem (preview + inline input) */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {r.imageUrl ? (
                        <img
                          src={r.imageUrl}
                          alt={r.name}
                          className="h-8 w-8 rounded-md object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-md border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                      <InlineText
                        value={r.imageUrl ?? ""}
                        placeholder="https://..."
                        onChange={(v) =>
                          setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, imageUrl: v } : x)))
                        }
                      />
                    </div>
                  </td>

                  {/* Ativo */}
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

                  {/* Ações */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-xl"
                        onClick={() => patch(r.id, { name: r.name, imageUrl: r.imageUrl ?? null })}
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
                <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                  {loading ? "Carregando..." : "Nenhum acompanhamento"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ======= MODAL: Confirmação de exclusão ======= */}
      <dialog ref={confirmRef} className="rounded-xl border p-0 w-full max-w-sm">
        <form method="dialog" className="p-5 text-center">
          <h3 className="text-base font-semibold mb-1">Excluir acompanhamento</h3>
          <p className="text-sm text-gray-600">
            Tem certeza que deseja excluir{" "}
            <span className="font-semibold">{confirmData?.name ?? "este acompanhamento"}</span>?
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

      {/* ======= MODAL: Mensagens de sucesso/erro ======= */}
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
