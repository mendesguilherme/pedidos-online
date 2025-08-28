"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

type Cat = { id: string; name: string };

interface CategoryDrawerProps {
  categories: Cat[];
  activeId: string | null;
  onChange: (id: string) => void;
  buttonClassName?: string; // opcional p/ customizar o botão do ícone
}

export function CategoryDrawer({ categories, activeId, onChange, buttonClassName }: CategoryDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Botão do “hambúrguer” que abre a gaveta */}
      <Button
        variant="ghost"
        size="sm"
        aria-label="Abrir categorias"
        onClick={() => setOpen(true)}
        className={buttonClassName ?? "rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground px-2 hover:bg-transparent"}
      >
        <Menu className="w-4 h-4" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-[85vw] sm:w-80">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="text-base">CATEGORIAS</SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-full">
            <nav className="py-2">
              {categories.map((c) => {
                const isActive = c.id === activeId;
                return (
                  <SheetClose asChild key={c.id}>
                    <button
                      onClick={() => onChange(c.id)}
                      aria-current={isActive ? "true" : undefined}
                      className={
                        "w-full text-left px-4 py-3 uppercase text-sm sm:text-base transition-colors " +
                        (isActive
                          ? "bg-muted/70 font-semibold border-l-4 border-primary"
                          : "hover:bg-muted/50")
                      }
                    >
                      {c.name}
                    </button>
                  </SheetClose>
                );
              })}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
