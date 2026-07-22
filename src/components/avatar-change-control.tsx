"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "@/components/tier-list/use-is-desktop";

/**
 * Small "change profile picture" trigger placed directly under the avatar
 * itself, in edit mode only. Rendered once per responsive avatar block
 * (mobile/desktop each have their own separate <Avatar> markup already), but
 * only one is ever the real submitted field — useIsDesktop decides which
 * instance's input actually carries name="avatar" for the current viewport,
 * so the form never ends up with two same-named file inputs (which would
 * make FormData.get("avatar") ambiguous about which one — possibly empty —
 * wins).
 */
export function AvatarChangeControl({
  formId,
  context,
}: {
  formId: string;
  context: "mobile" | "desktop";
}) {
  const isDesktop = useIsDesktop();
  const isActive = context === "desktop" ? isDesktop : !isDesktop;
  const [fileName, setFileName] = useState<string | null>(null);
  const inputId = `avatar-input-${context}`;

  return (
    <>
      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-center gap-1 text-xs font-medium text-primary-link hover:underline"
      >
        {fileName && <Check className="size-3 shrink-0 text-primary" />}
        {fileName ? "Photo selected" : "Change profile picture"}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        name={isActive ? "avatar" : undefined}
        form={formId}
        className="sr-only"
        onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
      />
    </>
  );
}
