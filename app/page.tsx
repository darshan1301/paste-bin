"use client";

import { useMemo, useState } from "react";

type CreatePasteResponse = { id: string; url: string };
type ApiErrorResponse = { error?: string; message?: string; details?: unknown };

function asIntOrNull(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

export default function Page() {
  const [content, setContent] = useState("");
  const [ttl, setTtl] = useState("");
  const [maxViews, setMaxViews] = useState("");

  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const ttlParsed = useMemo(() => asIntOrNull(ttl), [ttl]);
  const maxViewsParsed = useMemo(() => asIntOrNull(maxViews), [maxViews]);

  const canSubmit = useMemo(() => {
    if (!content.trim()) return false;
    if (ttl.trim() && ttlParsed === null) return false;
    if (maxViews.trim() && maxViewsParsed === null) return false;
    return true;
  }, [content, ttl, maxViews, ttlParsed, maxViewsParsed]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResultUrl(null);
    setResultId(null);
    setCopied(false);

    const body: Record<string, unknown> = { content: content };
    if (ttlParsed !== null) body.ttl_seconds = ttlParsed;
    if (maxViewsParsed !== null) body.max_views = maxViewsParsed;

    setLoading(true);
    try {
      const res = await fetch("/api/pastes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const isJson = (res.headers.get("content-type") || "").includes(
        "application/json",
      );
      const data = isJson ? await res.json() : null;

      if (!res.ok) {
        const msg =
          (data as ApiErrorResponse | null)?.error ||
          (data as ApiErrorResponse | null)?.message ||
          `Request failed (${res.status})`;
        setError(msg);
        return;
      }

      const out = data as CreatePasteResponse;
      if (!out?.id || !out?.url) {
        setError("Unexpected response from server.");
        return;
      }

      setResultId(out.id);
      setResultUrl(out.url);
      setContent("");
      setTtl("");
      setMaxViews("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!resultUrl) return;
    try {
      await navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">
            Pastebin-Lite
          </h1>
          <div className="text-xs text-zinc-400">
            Create a paste · Get a share link
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm"
        >
          <label className="block text-sm font-medium text-zinc-200">
            Content <span className="text-zinc-400">(required)</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste text here..."
            className="mt-2 h-56 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm outline-none ring-0 placeholder:text-zinc-500 focus:border-zinc-700"
          />

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                TTL (seconds) <span className="text-zinc-400">(optional)</span>
              </label>
              <input
                inputMode="numeric"
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
                placeholder="e.g. 60"
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-700"
              />
              {ttl.trim() && ttlParsed === null ? (
                <div className="mt-1 text-xs text-red-400">
                  Must be an integer ≥ 1
                </div>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Max views <span className="text-zinc-400">(optional)</span>
              </label>
              <input
                inputMode="numeric"
                value={maxViews}
                onChange={(e) => setMaxViews(e.target.value)}
                placeholder="e.g. 5"
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-zinc-700"
              />
              {maxViews.trim() && maxViewsParsed === null ? (
                <div className="mt-1 text-xs text-red-400">
                  Must be an integer ≥ 1
                </div>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="inline-flex items-center justify-center rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create paste"}
            </button>

            <div className="text-xs text-zinc-500">
              Optional constraints disable the paste once triggered.
            </div>
          </div>
        </form>

        {resultUrl ? (
          <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium text-zinc-200">
                  Share link
                </div>
                <div className="mt-1 break-all font-mono text-sm text-zinc-300">
                  {resultUrl}
                </div>
                {resultId ? (
                  <div className="mt-1 text-xs text-zinc-500">
                    ID: {resultId}
                  </div>
                ) : null}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-700"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
                <a
                  href={resultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-900"
                >
                  Open
                </a>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
