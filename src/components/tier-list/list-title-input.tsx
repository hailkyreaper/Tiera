"use client";

import { Input } from "@/components/ui/input";

const MAX_LENGTH = 40;

/**
 * Controlled by the parent (EditListDetailsForm) rather than owning its own
 * state — the parent needs the current title to build FormData for the
 * Publish/Save Draft/Share actions, which aren't native form submissions.
 */
export function ListTitleInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <div className="flex items-center justify-between">
        <label htmlFor="title" className="text-xs text-muted-foreground lg:text-sm">
          List Title
        </label>
        <span className="text-xs text-muted-foreground lg:text-sm">
          {value.length}/{MAX_LENGTH}
        </span>
      </div>
      <Input
        id="title"
        name="title"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_LENGTH}
        required
        placeholder="Insert title"
        className="border-none bg-transparent p-0 text-base font-semibold focus-visible:ring-0 dark:bg-transparent lg:text-lg"
      />
    </div>
  );
}
