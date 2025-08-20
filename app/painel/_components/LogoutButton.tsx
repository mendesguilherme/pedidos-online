"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  return (
    <Button
      variant="outline"
      className="rounded-xl"
      onClick={() => signOut({ callbackUrl: "/signin" })}
    >
      Sair
    </Button>
  );
}
