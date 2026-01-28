import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const headerList = await headers();

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { ok: false, error: "Invalid paste id." },
        { status: 400 },
      );
    }

    const paste = await prisma.paste.findUnique({ where: { id } });

    if (!paste) {
      return NextResponse.json(
        { ok: false, error: "Paste not found" },
        { status: 404 },
      );
    }

    const nowMs = (() => {
      const real = Date.now();
      if (process.env.TEST_MODE !== "1") return real;

      const raw = headerList.get("x-test-now-ms");
      if (!raw) return real;

      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0) return real;

      return Math.trunc(n);
    })();

    if (paste.max_views !== null && paste.view_count >= paste.max_views) {
      return NextResponse.json(
        { ok: false, error: "Paste not found" },
        { status: 404 },
      );
    }

    let expiresAt: Date | null = null;
    if (paste.ttl_seconds !== null && paste.ttl_seconds !== undefined) {
      expiresAt = new Date(
        paste.created_at.getTime() + paste.ttl_seconds * 1000,
      );

      // console.log(nowMs, expiresAt.getTime());

      if (nowMs >= expiresAt.getTime()) {
        return NextResponse.json(
          { ok: false, error: "Paste not found" },
          { status: 404 },
        );
      }
    }

    const updated = await prisma.paste.update({
      where: { id },
      data: { view_count: { increment: 1 } },
    });

    const remainingViews =
      updated.max_views !== null
        ? Math.max(0, updated.max_views - updated.view_count)
        : null;

    return NextResponse.json(
      {
        ok: true,
        content: updated.content,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        remaining_views: remainingViews,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Paste fetch failed:", error);
    return NextResponse.json(
      { ok: false, error: "An error occurred fetching the paste" },
      { status: 500 },
    );
  }
}
