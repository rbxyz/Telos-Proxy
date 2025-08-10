"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const keysList = api.keys.list.useQuery();
  const createKey = api.keys.create.useMutation();

  useEffect(() => {
    setToken(window.localStorage.getItem("jwt"));
  }, []);

  const onCreateKey = async () => {
    const name = "default";
    const res = await createKey.mutateAsync({ name });
    // UI completa para chaves em /dashboard/keys
    await keysList.refetch();
  };

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Link className="text-sm text-indigo-600 hover:underline" href="/dashboard/model">
            Configurar modelo →
          </Link>
          <Link className="text-sm text-indigo-600 hover:underline" href="/dashboard/keys">
            Gerenciar API Keys →
          </Link>
        </div>
      </div>
      <div className="rounded border p-4">
        <h2 className="mb-2 font-medium">Token atual</h2>
        <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-sm">{token ?? "(não autenticado)"}</pre>
      </div>

      <div className="space-y-4 rounded border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">API Keys</h2>
          <button
            onClick={onCreateKey}
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Gerar nova
          </button>
        </div>
        <ul className="space-y-2 text-sm">
          {keysList.data?.map((k) => (
            <li key={k.id} className="flex items-center justify-between rounded border p-2">
              <div>
                <div className="font-medium">{k.name}</div>
                <div className="text-gray-600">prefixo: {k.keyPrefix}</div>
              </div>
              <div className="text-gray-500">{new Date(k.createdAt as unknown as string).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}