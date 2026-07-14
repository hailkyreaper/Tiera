"use client";

import { useRouter } from "next/navigation";
import { BookSearchInput } from "@/components/book-search-input";

/**
 * Wraps BookSearchInput in a form that navigates via router.replace instead
 * of a native GET submission — searching for several different books in a
 * row would otherwise push a new browser history entry each time, so Back
 * had to be pressed once per search instead of once total.
 */
export function BookSearchForm({
  basePath,
  defaultValue,
  action,
  extraFields,
  extraParams,
  autoFocus,
}: {
  basePath: string;
  defaultValue?: string;
  action: (formData: FormData) => void | Promise<void>;
  extraFields?: Record<string, string>;
  extraParams?: Record<string, string>;
  autoFocus?: boolean;
}) {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = (formData.get("q") as string)?.trim();
    const params = new URLSearchParams(extraParams);
    if (q) params.set("q", q);
    const qs = params.toString();
    router.replace(`${basePath}${qs ? `?${qs}` : ""}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <BookSearchInput
        defaultValue={defaultValue}
        action={action}
        extraFields={extraFields}
        autoFocus={autoFocus}
      />
    </form>
  );
}
