"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
      className="text-[rgba(245,232,200,0.35)] hover:text-[rgba(245,232,200,0.7)] text-xs transition-colors"
    >
      Sair
    </button>
  );
}
