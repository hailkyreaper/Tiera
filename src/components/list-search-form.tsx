"use client";

import { useRouter } from "next/navigation";
import { BookSearchInput } from "@/components/book-search-input";
import { Button } from "@/components/ui/button";

/**
 * Wraps BookSearchInput + the Search button in a form that navigates via
 * router.replace instead of a native GET submission — searching for several
 * different books in a row would otherwise push a new browser history entry
 * each time, so Back had to be pressed once per search instead of once total.
 */
export function ListSearchForm({
  tierListId,
  defaultValue,
}: {
  tierListId: string;
  defaultValue?: string;
}) {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = (formData.get("q") as string)?.trim();
    router.replace(
      `/lists/${tierListId}/search${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <BookSearchInput tierListId={tierListId} defaultValue={defaultValue} />
      <Button type="submit">Search</Button>
    </form>
  );
}
