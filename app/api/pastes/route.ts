import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import z from "zod";

const CreatePasteSchema = z.object({
  content: z
    .string()
    .min(1, "content is required and must be a non-empty string"),
  ttl_seconds: z.number().int().min(1).optional(),
  max_views: z.number().int().min(1).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = CreatePasteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const { content, ttl_seconds, max_views } = validation.data;

    const newPaste = await prisma.paste.create({
      data: {
        content,
        ttl_seconds: ttl_seconds ?? null,
        max_views: max_views ?? null,
      },
    });

    const baseUrl = process.env.BASE_URL;

    return NextResponse.json(
      {
        id: newPaste.id,
        url: `${baseUrl}/p/${newPaste.id}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Paste creation failed:", error);

    return NextResponse.json(
      { error: "Failed to create paste" },
      { status: 500 },
    );
  }
}
