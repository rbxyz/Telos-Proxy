"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

type Provider = "hf";

export default function ModelConfigPage() {
  const getQuery = api.model.get.useQuery(undefined, { staleTime: 0 });
  const upsert = api.model.upsert.useMutation();

  const [provider, setProvider] = useState<Provider>("hf");
  const [modelName, setModelName] = useState("google/flan-t5-base");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKeyRef, setApiKeyRef] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (getQuery.data) {
      setProvider(getQuery.data.provider as Provider);
      setModelName(getQuery.data.modelName ?? "");
      setBaseUrl(getQuery.data.baseUrl ?? "");
      setApiKeyRef(getQuery.data.apiKeyRef ?? "");
    }
  }, [getQuery.data]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(null);
    await upsert.mutateAsync({
      provider,
      modelName,
      baseUrl: baseUrl || undefined,
      apiKeyRef: apiKeyRef || undefined,
    });
    setSaved("Configuração salva com sucesso.");
    await getQuery.refetch();
  };

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Configurar Modelo</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded border p-4">
        <div className="space-y-2">
          <label className="block text-sm">Provider</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            className="w-full rounded border px-3 py-2"
          >
            <option value="hf">HuggingFace</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Model Name</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="google/flan-t5-base"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm">Base URL (opcional)</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api-inference.huggingface.co"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm">API Key (opcional)</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={apiKeyRef}
            onChange={(e) => setApiKeyRef(e.target.value)}
            placeholder="hf_..."
          />
        </div>
        <button
          type="submit"
          className="rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          disabled={upsert.isPending}
        >
          {upsert.isPending ? "Salvando..." : "Salvar"}
        </button>
        {saved && <p className="text-sm text-green-600">{saved}</p>}
      </form>
    </main>
  );
}

