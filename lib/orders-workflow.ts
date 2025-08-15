// lib/orders-workflow.ts
export type OrderStatus =
  | "pendente"
  | "em_preparo"
  | "saiu_para_entrega"
  | "entregue"
  | "cancelado";

export type OrderAction = "aceitar" | "negar" | "saiu_para_entrega" | "entregue";

/** Garante para o TS (e em runtime) que a string é uma ação válida */
export function isOrderAction(x: unknown): x is OrderAction {
  return x === "aceitar" || x === "negar" || x === "saiu_para_entrega" || x === "entregue";
}

// mapeia ação -> status de destino
export function mapActionToStatus(action: OrderAction) {
  switch (action) {
    case "aceitar":
      return "em_preparo";
    case "negar":
      return "cancelado";
    case "saiu_para_entrega":
      return "saiu_para_entrega";
    case "entregue":
      return "entregue";
  }
  return null as never;
}

/** Normaliza o tipo vindo do banco/legacy */
function normTipo(tipo: string | null | undefined): "entrega" | "retirada" {
  const t = (tipo ?? "").toString().toLowerCase();
  return t === "entrega" ? "entrega" : "retirada";
}

/**
 * Regras de transição centralizadas.
 * Obs.: Para ENTREGA, permitimos também pular de "em_preparo" → "entregue"
 * para suportar cliques diretos no link do WhatsApp/Typebot, mesmo que a UI
 * prefira exibir o passo intermediário "saiu_para_entrega".
 */
const TRANSITIONS: Record<
  "entrega" | "retirada",
  Partial<Record<OrderStatus, OrderStatus[]>>
> = {
  entrega: {
    pendente: ["em_preparo", "cancelado"],
    em_preparo: ["saiu_para_entrega", "entregue", "cancelado"],
    saiu_para_entrega: ["entregue", "cancelado"],
    // entregue/cancelado: finais
  },
  retirada: {
    pendente: ["em_preparo", "cancelado"],
    em_preparo: ["entregue", "cancelado"],
    // retirada não usa "saiu_para_entrega"
  },
};

/** Verifica se a transição é válida dado o tipo do pedido */
export function canTransition(opts: {
  from: OrderStatus;
  to: OrderStatus;
  tipo: string | null; // "entrega" | "retirada" | null
}): boolean {
  const { from, to } = opts;
  const tipo = normTipo(opts.tipo);
  if (from === to) return true;
  const allowed = TRANSITIONS[tipo]?.[from] ?? [];
  return allowed.includes(to);
}

/** Mapeia um status alvo → ação correspondente (quando aplicável) */
function statusToAction(status: OrderStatus): OrderAction | null {
  switch (status) {
    case "em_preparo":
      return "aceitar";
    case "cancelado":
      return "negar";
    case "saiu_para_entrega":
      return "saiu_para_entrega";
    case "entregue":
      return "entregue";
    default:
      return null;
  }
}

/**
 * Quais ações exibir no Admin para o pedido atual.
 * Usa o mesmo grafo de transições para manter consistência.
 * Nota: para ENTREGA, retornamos as duas possibilidades a partir de "em_preparo"
 * (saiu_para_entrega e entregue) para facilitar testes; se quiser, basta filtrar
 * "entregue" na UI para manter o fluxo em etapas.
 */
export function allowedActionsFor(row: {
  status: OrderStatus;
  tipo: string | null;
}): OrderAction[] {
  const tipo = normTipo(row.tipo);
  const nextStatuses = TRANSITIONS[tipo]?.[row.status] ?? [];
  return nextStatuses
    .map(statusToAction)
    .filter((a): a is OrderAction => !!a);
}
