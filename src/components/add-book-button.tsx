"use client";

import type * as React from "react";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Calls the add action programmatically (rather than relying on native form
 * submission) so the button can flip to a persistent "Added" checkmark
 * instead of the result seeming to vanish when the surrounding page
 * revalidates after the mutation.
 */
export function AddBookButton({
  action,
  fields,
  label,
  className,
  variant = "outline",
  size = "sm",
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  label: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  const [added, setAdded] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (added || pending) return;
    setPending(true);
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.set(key, value);
    }
    await action(formData);
    setPending(false);
    setAdded(true);
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={pending || added}
      onClick={handleClick}
      className={className}
    >
      {added ? (
        <>
          <Check className="size-4" />
          Added
        </>
      ) : (
        label
      )}
    </Button>
  );
}
