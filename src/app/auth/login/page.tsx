"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-mail ou senha inválidos.");
      return;
    }

    const callbackUrl = params.get("callbackUrl") ?? "/admin";
    window.location.href = callbackUrl;
  }

  return (
    <div className="min-h-screen flex bg-[#0f0b05]">
      {/* Branding — visible on large screens only */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-[#1a1006] border-r border-[rgba(212,168,80,0.08)] p-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(212,168,80,1) 39px,rgba(212,168,80,1) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(212,168,80,1) 39px,rgba(212,168,80,1) 40px)",
          }}
        />
        <div className="relative z-10 text-center max-w-xs">
          <img src="/biblia360-logo.png" alt="Bíblia 360°" className="w-48 mx-auto mb-6 drop-shadow-lg" />
          <p className="text-[rgba(245,232,200,0.35)] text-sm mt-4 leading-relaxed">
            Painel administrativo de análise de leads, funil de conversão e métricas em tempo real.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile-only header */}
          <div className="text-center mb-10 lg:hidden">
            <img src="/biblia360-logo.png" alt="Bíblia 360°" className="w-36 mx-auto mb-5 drop-shadow-lg" />
            <p className="text-[rgba(245,232,200,0.4)] text-sm mt-1">Painel Admin</p>
          </div>

          {/* Desktop-only heading */}
          <div className="mb-10 hidden lg:block">
            <h1
              className="text-[#f5e8c8] text-2xl font-semibold"
              style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "-0.02em" }}
            >
              Entrar
            </h1>
            <p className="text-[rgba(245,232,200,0.35)] text-sm mt-1">Acesse o painel administrativo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl text-sm text-[#f5e8c8] placeholder-[rgba(245,232,200,0.3)] bg-[rgba(245,232,200,0.05)] border border-[rgba(212,168,80,0.2)] outline-none focus:border-[rgba(212,168,80,0.55)] transition-colors disabled:opacity-50"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl text-sm text-[#f5e8c8] placeholder-[rgba(245,232,200,0.3)] bg-[rgba(245,232,200,0.05)] border border-[rgba(212,168,80,0.2)] outline-none focus:border-[rgba(212,168,80,0.55)] transition-colors disabled:opacity-50"
            />

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-[#d4a850] text-[#1a1006] rounded-xl text-sm font-semibold tracking-wide transition-all hover:bg-[#e0b86a] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
