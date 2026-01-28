"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

type PasteResponse = {
  id: string;
  content: string;
  created_at?: string;
  expires_at?: string | null;
  remaining_views?: number | null;
};

export default function Page({ params }: PageProps) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [paste, setPaste] = useState<PasteResponse | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => setId(id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/pastes/${id}`, {
          cache: "no-store",
        });

        if (res.status === 404) {
          setError(true);
          return;
        }

        if (!res.ok) throw new Error("failed");

        const data = await res.json();
        setPaste(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center text-sm">
        Loading paste…
      </main>
    );
  }

  if (error || !paste) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-400 flex flex-col items-center justify-center gap-4 text-sm">
        <div>Paste not found or expired</div>
        <button
          onClick={() => router.push("/")}
          className="rounded-lg border border-zinc-800 px-3 py-1.5 hover:border-zinc-600"
        >
          Create new paste
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div>Paste #{paste.id}</div>
          <button
            onClick={() => router.push("/")}
            className="hover:text-zinc-300"
          >
            New paste
          </button>
        </div>

        <pre className="mt-6 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm leading-relaxed">
          {paste.content}
        </pre>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
          {paste.created_at && (
            <div>Created {new Date(paste.created_at).toLocaleString()}</div>
          )}

          {paste.expires_at && (
            <div>Expires {new Date(paste.expires_at).toLocaleString()}</div>
          )}

          {typeof paste.remaining_views === "number" && (
            <div>Views left {paste.remaining_views}</div>
          )}
        </div>
      </div>
    </main>
  );
}
