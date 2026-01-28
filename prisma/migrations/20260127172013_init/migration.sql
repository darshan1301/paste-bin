-- CreateTable
CREATE TABLE "paste" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "max_views" INTEGER,
    "ttl_seconds" INTEGER,
    "view_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "paste_pkey" PRIMARY KEY ("id")
);
