"use client";

import { Button } from "@/components/ui/button";
import { CategoryDrawer } from "@/components/category-drawer";

type Cat = { id: string; name: string };

interface CategoryTabsProps {
  categories: Cat[];
  activeId: string | null;
  onChange: (id: string) => void;
}

export function CategoryTabs({ categories, activeId, onChange }: CategoryTabsProps) {
  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center gap-1">
          {/* Ícone que abre a gaveta lateral */}
          <CategoryDrawer
            categories={categories}
            activeId={activeId}
            onChange={onChange}
            buttonClassName="rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground px-2 hover:bg-transparent"
          />

          {/* Mesma aparência das NavigationTabs (scroll horizontal) */}
          <div className="flex-1 overflow-x-auto no-scrollbar">
            <div className="flex w-max">
              {categories.map((c) => (
                <Button
                  key={c.id}
                  variant="ghost"
                  onClick={() => onChange(c.id)}
                  className={`rounded-none border-b-2 transition-colors text-sm sm:text-base py-3 sm:py-4 px-3 sm:px-4 uppercase
                    ${
                      activeId === c.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
