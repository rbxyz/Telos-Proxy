"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = api.auth.register.useMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await mutateAsync({ email, password });
      window.localStorage.setItem("jwt", res.token);
      router.push("/dashboard");
    } catch (err) {
      setError("Falha no registro. Verifique os dados.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded border bg-white p-6 shadow">
        <h1 className="text-xl font-semibold">Criar conta</h1>
        <div className="space-y-2">
          <label className="block text-sm">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border px-3 py-2"
            required
            minLength={8}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {isPending ? "Criando..." : "Criar conta"}
        </button>
      </form>
    </main>
  );
}