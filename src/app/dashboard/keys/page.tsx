"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { useToast } from "~/app/_components/ui/toast";

type KeyRecord = NonNullable<ReturnType<typeof useKeysData>[number]>;

function useKeysData() {
  const { data } = api.keys.list.useQuery();
  return data ?? [];
}

export default function KeysPage() {
  const keys = useKeysData();
  const createKey = api.keys.create.useMutation();
  const revokeKey = api.keys.revoke.useMutation();
  const { show } = useToast();

  const [newKeyName, setNewKeyName] = useState("");
  const [plainById, setPlainById] = useState<Record<string, string>>({});
  const [showById, setShowById] = useState<Record<string, boolean>>({});

  const utils = api.useUtils();

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newKeyName.trim() || "default";
    const res = await createKey.mutateAsync({ name });
    setNewKeyName("");
    if (res?.record?.id) {
      const id = String(res.record.id);
      setPlainById((m) => ({ ...m, [id]: res.apiKey }));
      setShowById((m) => ({ ...m, [id]: true }));
      show("Chave criada. Copie o segredo agora.");
    }
    await utils.keys.list.invalidate();
  };

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const onConfirmRevoke = async () => {
    if (!confirmId) return;
    await revokeKey.mutateAsync({ id: confirmId });
    setConfirmId(null);
    await utils.keys.list.invalidate();
    show("Chave revogada");
  };

  const formattedKeys = useMemo(() => {
    return keys
      .slice()
      .sort((a, b) => new Date(b.createdAt as unknown as string).getTime() - new Date(a.createdAt as unknown as string).getTime());
  }, [keys]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">API Keys</h1>

      <form onSubmit={onCreate} className="flex items-end gap-3 rounded border p-4">
        <div className="flex-1">
          <label className="block text-sm">Nome da chave</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="ex: integraçao-app-x"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          disabled={createKey.isPending}
        >
          {createKey.isPending ? "Gerando..." : "Gerar"}
        </button>
      </form>

      <div className="rounded border">
        <div className="grid grid-cols-12 gap-3 border-b bg-gray-50 p-3 text-sm font-medium">
          <div className="col-span-3">Nome</div>
          <div className="col-span-3">Prefixo</div>
          <div className="col-span-3">Criada em</div>
          <div className="col-span-3 text-right">Ações</div>
        </div>
        <ul className="divide-y">
          {formattedKeys.map((k) => (
            <li key={k.id as unknown as string} className="grid grid-cols-12 items-center gap-3 p-3">
              <div className="col-span-3 truncate">
                <div className="font-medium">{k.name}</div>
                {plainById[String(k.id)] && (
                  <div className="mt-1 text-xs text-gray-600">
                    <span className="mr-2">Segredo:</span>
                    <code className="rounded bg-gray-100 px-1 py-0.5">
                      {showById[String(k.id)] ? plainById[String(k.id)] : "••••••••••••"}
                    </code>
                    <button
                      type="button"
                      className="ml-2 text-indigo-600 hover:underline"
                      onClick={() => setShowById((m) => ({ ...m, [String(k.id)]: !m[String(k.id)] }))}
                    >
                      {showById[String(k.id)] ? "ocultar" : "mostrar"}
                    </button>
                    <button
                      type="button"
                      className="ml-2 text-indigo-600 hover:underline"
                      onClick={async () => {
                        const secret = plainById[String(k.id)];
                        if (!secret) {
                          show("Nada para copiar");
                          return;
                        }
                        await navigator.clipboard.writeText(secret);
                        show("Copiado para a área de transferência");
                      }}
                    >
                      copiar
                    </button>
                  </div>
                )}
              </div>
              <div className="col-span-3 text-gray-700">{k.keyPrefix}</div>
              <div className="col-span-3 text-gray-700">
                {new Date(k.createdAt as unknown as string).toLocaleString()}
              </div>
              <div className="col-span-3 flex items-center justify-end gap-2">
                {!k.revokedAt ? (
                  <button
                    className="rounded border border-red-500 px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => setConfirmId(String(k.id))}
                  >
                    Revogar
                  </button>
                ) : (
                  <span className="text-sm text-gray-500">Revogada</span>
                )}
                <Link
                  className="rounded border px-2 py-1 text-sm hover:bg-gray-50"
                  href={`/dashboard/keys/${k.id}/metrics`}
                >
                  Métricas
                </Link>
              </div>
            </li>
          ))}
          {formattedKeys.length === 0 && (
            <li className="p-4 text-sm text-gray-600">Nenhuma chave ainda.</li>
          )}
        </ul>
      </div>
      {/* Modal de confirmação */}
      <ConfirmModal
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        onConfirm={onConfirmRevoke}
      />
      <p className="text-sm text-gray-600">
        Observação: por segurança, o segredo completo é exibido apenas no momento da criação. Guarde-o em local seguro.
      </p>
    </main>
  );
}

function ConfirmModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded bg-white p-4 shadow">
        <h3 className="mb-2 text-lg font-semibold">Revogar chave?</h3>
        <div className="mb-4 text-sm text-gray-700">Esta ação não pode ser desfeita.</div>
        <div className="flex justify-end gap-2">
          <button className="rounded border px-3 py-1.5 text-sm" onClick={onClose}>Cancelar</button>
          <button className="rounded bg-red-600 px-3 py-1.5 text-sm text-white" onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

