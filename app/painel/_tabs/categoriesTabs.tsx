"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save, Trash2, Plus } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  position: number;
  icon: string | null;
  color: string | null;
  active: boolean;
  deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

const field =
  "mt-1 w-full h-10 rounded-xl border border-purple-300 bg-white px-3 text-[15px] " +
  "focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300";

export default function CategoriesTabs() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false); // ⬅️ novo
  const [form, setForm] = useState({ name: "", position: 0 });

  // ---- MODAIS ----
  const confirmRef = useRef<HTMLDialogElement | null>(null);
  const infoRef = useRef<HTMLDialogElement | null>(null);

  const [confirmData, setConfirmData] = useState<{ id: string; name: string } | null>(null);
  const [infoMsg, setInfoMsg] = useState<string>("");

  function openConfirm(id: string, name: string) {
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
      const res = await fetch("/api/categories", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      setRows((json?.data ?? []) as Category[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRows();
  }, []);

  // controle de busy por linha para o switch
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const setBusy = (id: string, on: boolean) =>
    setBusyIds((prev) => {
      const n = new Set(prev);
      on ? n.add(id) : n.delete(id);
      return n;
    });

  // ⬇️ atualizado: trata sucesso/erro e atualiza a lista
  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      showInfo("Informe o nome da categoria.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          position: Number.isFinite(form.position as any) ? Number(form.position) : 0,
        }),
      });

      // tenta ler o JSON mesmo em erro para extrair mensagem
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const msg = payload?.error || `Falha ao criar categoria (HTTP ${res.status}).`;
        showInfo(msg);
        return;
      }

      // sucesso
      setForm({ name: "", position: 0 });
      await fetchRows(); // atualiza a tabela
      showInfo("Categoria criada com sucesso!");
    } catch (err: any) {
      showInfo(`Falha ao criar categoria: ${String(err?.message ?? err)}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function patch(id: string, body: any, opts?: { silent?: boolean }) {
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const msg =
          res.status === 409
            ? "Não é possível inativar/excluir: existem produtos ativos nessa categoria."
            : payload?.error || `Falha ao editar (HTTP ${res.status}).`;
        // erro sempre aparece, sucesso só quando não-silent
        showInfo(msg);
        return false;
      }
      await fetchRows();
      if (!opts?.silent) showInfo("Edição realizada com sucesso!");
      return true;
    } finally {
      setLoading(false);
    }
  }

  async function confirmAndDelete() {
    const id = confirmData?.id;
    if (!id) return closeConfirm();
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        const msg =
          res.status === 409
            ? "Não é possível excluir: existem produtos ativos nessa categoria."
            : payload?.error || `Falha ao excluir (HTTP ${res.status}).`;
        closeConfirm();
        showInfo(msg);
        return;
      }
      await fetchRows();
      closeConfirm();
      showInfo("Categoria excluída com sucesso!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      {/* Inserção acima da tabela */}
      <form
        onSubmit={createCategory}
        className="rounded-xl border bg-white p-4 grid grid-cols-1 md:grid-cols-5 gap-3"
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
        <div>
          <Label className="text-xs text-gray-500">Ordem</Label>
          <Input
            type="number"
            value={form.position}
            onChange={(e) =>
              setForm((f) => ({ ...f, position: Number(e.target.value) }))
            }
            className={field}
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
              <th className="px-3 py-2 text-left">Slug</th>
              <th className="px-3 py-2 text-left">Ordem</th>
              <th className="px-3 py-2 text-left">Ativa</th>
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((r) => (
              <tr key={r.id} className="divide-x divide-slate-200">
                <td className="px-3 py-2">
                  <InlineText
                    value={r.name}
                    onChange={(v) =>
                      setRows((rs) =>
                        rs.map((x) => (x.id === r.id ? { ...x, name: v } : x))
                      )
                    }
                  />
                </td>
                <td className="px-3 py-2 text-gray-600">{r.slug}</td>
                <td className="px-3 py-2">
                  <InlineNumber
                    value={r.position}
                    onChange={(v) =>
                      setRows((rs) =>
                        rs.map((x) =>
                          x.id === r.id ? { ...x, position: v } : x
                        )
                      )
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={r.active}
                      disabled={busyIds.has(r.id)}
                      onCheckedChange={async (val) => {
                        setBusy(r.id, true);
                        try {
                          await patch(r.id, { active: val }, { silent: true });
                        } finally {
                          setBusy(r.id, false);
                        }
                      }}
                    />
                    <span
                      className={`inline-flex items-center rounded-xl border px-2 py-1 text-xs font-medium ${
                        r.active
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-300 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {r.active ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-xl"
                      onClick={() =>
                        patch(r.id, {
                          name: r.name,
                          position: r.position,
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
            ))}

            {!rows.length && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-gray-500"
                >
                  {loading ? "Carregando..." : "Nenhuma categoria"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ======= MODAL: Confirmação de exclusão ======= */}
      <dialog ref={confirmRef} className="rounded-xl border p-0 w-full max-w-sm">
        <form method="dialog" className="p-5 text-center">
          <h3 className="text-base font-semibold mb-1">Excluir categoria</h3>
          <p className="text-sm text-gray-600">
            Tem certeza que deseja excluir{" "}
            <span className="font-semibold">
              {confirmData?.name ?? "esta categoria"}
            </span>
            ?
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
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      className="h-9 w-full rounded-xl border border-slate-300 bg-white px-2 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function InlineNumber({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      className="h-9 w-24 rounded-xl border border-slate-300 bg-white px-2 text-sm"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}
