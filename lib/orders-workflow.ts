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

// já existente:
export function mapActionToStatus(action: OrderAction) {
  switch (action) {
    case "aceitar": return "em_preparo";
    case "negar": return "cancelado";
    case "saiu_para_entrega": return "saiu_para_entrega";
    case "entregue": return "entregue";
  }
  return null as never; // por garantia
}

/** Regras de transição sem alterar seu schema atual */
export function canTransition(opts: {
  from: OrderStatus;
  to: OrderStatus;
  tipo: string | null; // "entrega" | "retirada" | null
}): boolean {
  const { from, to, tipo } = opts;
  if (from === to) return true;

  switch (from) {
    case "pendente":
      return to === "em_preparo" || to === "cancelado";

    case "em_preparo":
      if (tipo === "entrega") {
        return to === "saiu_para_entrega";
      } else {
        // retirada: depois de preparar já pode marcar como entregue (retirado)
        return to === "entregue";
      }

    case "saiu_para_entrega":
      return to === "entregue";

    case "entregue":
    case "cancelado":
      return false; // estados finais

    default:
      return false;
  }
}

/** Quais ações mostrar no Admin para o pedido atual */
export function allowedActionsFor(row: { status: OrderStatus; tipo: string | null }): OrderAction[] {
  const { status, tipo } = row;
  switch (status) {
    case "pendente":
      return ["aceitar", "negar"];
    case "em_preparo":
      return tipo === "entrega" ? ["saiu_para_entrega"] : ["entregue"];
    case "saiu_para_entrega":
      return ["entregue"];
    default:
      return [];
  }
}
