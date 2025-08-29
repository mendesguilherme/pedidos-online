"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

export default function OrdersSoundToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try { setEnabled(localStorage.getItem("ordersSoundEnabled") === "1"); } catch {}
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    try { localStorage.setItem("ordersSoundEnabled", next ? "1" : "0"); } catch {}
    if (next) {
      // avisa o NewOrderChime para criar/resumir o AudioContext (gesto do usuário!)
      window.dispatchEvent(new Event("orders-sound-unlock"));
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={toggle}
      className="h-10 rounded-xl px-3 gap-2 text-sm"
      title={enabled ? "Som ligado" : "Som desligado"}
    >
      {enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
      <span>{enabled ? "Ligado" : "Desligado"}</span>
    </Button>
  );
}
