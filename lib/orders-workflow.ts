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

/** Mapeia ação -> status (status iguais para entrega/retirada) */
export function mapActionToStatus(action: OrderAction): OrderStatus {
  switch (action) {
    case "aceitar": return "em_preparo";
    case "negar": return "cancelado";
    case "saiu_para_entrega": return "saiu_para_entrega"; // em retirada será exibido como "Pronto p/ retirada"
    case "entregue": return "entregue";
  }
  return null as never;
}

/**
 * Regras de transição — iguais para entrega e retirada.
 * Mantemos o parâmetro `tipo` apenas por compatibilidade, mas ele é ignorado.
 */
export function canTransition(opts: {
  from: OrderStatus;
  to: OrderStatus;
  tipo: string | null; // ignorado (mantido p/ compat)
}): boolean {
  const { from, to } = opts;
  if (from === to) return true;

  switch (from) {
    case "pendente":
      return to === "em_preparo" || to === "cancelado";

    case "em_preparo":
      // Próximo passo é sempre "saiu_para_entrega"
      // (na retirada, o label do botão/tela será "Pronto p/ retirada")
      return to === "saiu_para_entrega";

    case "saiu_para_entrega":
      return to === "entregue";

    case "entregue":
    case "cancelado":
      return false; // estados finais

    default:
      return false;
  }
}

/** Ações visíveis no Admin (iguais para ambos os tipos) */
export function allowedActionsFor(row: { status: OrderStatus; tipo: string | null }): OrderAction[] {
  switch (row.status) {
    case "pendente":
      return ["aceitar", "negar"];
    case "em_preparo":
      return ["saiu_para_entrega"]; // label muda no Admin se for retirada
    case "saiu_para_entrega":
      return ["entregue"];
    default:
      return [];
  }
}
