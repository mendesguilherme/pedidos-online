// lib/orders-workflow.ts
export type OrderStatus =
  | "pendente"
  | "em_preparo"
  | "saiu_para_entrega" // (para retirada, usamos como “pronto para retirada”)
  | "entregue"
  | "cancelado";

export type OrderAction = "aceitar" | "negar" | "saiu_para_entrega" | "entregue";

/** Garante para o TS (e em runtime) que a string é uma ação válida */
export function isOrderAction(x: unknown): x is OrderAction {
  return x === "aceitar" || x === "negar" || x === "saiu_para_entrega" || x === "entregue";
}

/** Ação → status de destino (sem considerar tipo) */
export function mapActionToStatus(action: OrderAction) {
  switch (action) {
    case "aceitar":
      return "em_preparo";
    case "negar":
      return "cancelado";
    case "saiu_para_entrega":
      return "saiu_para_entrega"; // para retirada, interpretamos como “pronto para retirada”
    case "entregue":
      return "entregue";
  }
  return null as never;
}

/** Regras de transição (ajustadas) */
export function canTransition(opts: {
  from: OrderStatus;
  to: OrderStatus;
  tipo: string | null; // "entrega" | "retirada" | null
}): boolean {
  const { from, to } = opts;
  const tipo = (opts.tipo ?? "").toString().toLowerCase() === "entrega" ? "entrega" : "retirada";

  if (from === to) return true;

  switch (from) {
    case "pendente":
      // aceitar/negAR só aqui
      return to === "em_preparo" || to === "cancelado";

    case "em_preparo":
      if (tipo === "entrega") {
        // entrega segue igual
        return to === "saiu_para_entrega";
      } else {
        // retirada agora exige etapa intermediária “pronto para retirada”
        // representada por "saiu_para_entrega"
        return to === "saiu_para_entrega";
      }

    case "saiu_para_entrega":
      // tanto para entrega quanto retirada, próximo é "entregue"
      return to === "entregue";

    case "entregue":
    case "cancelado":
      return false; // estados finais

    default:
      return false;
  }
}

/** Ações visíveis no Admin para o estado atual */
export function allowedActionsFor(row: { status: OrderStatus; tipo: string | null }): OrderAction[] {
  const tipo = (row.tipo ?? "").toString().toLowerCase() === "entrega" ? "entrega" : "retirada";

  switch (row.status) {
    case "pendente":
      // aceitar/negAR somente em pendente
      return ["aceitar", "negar"];

    case "em_preparo":
      // entrega: “saiu_para_entrega”; retirada: usar mesma ação como “pronto p/ retirada”
      return ["saiu_para_entrega"];

    case "saiu_para_entrega":
      return ["entregue"];

    default:
      return [];
  }
}
