"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Back"
      className="flex size-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
    >
      <ArrowLeft className="size-5" />
    </button>
  );
}
