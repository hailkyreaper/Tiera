"use client";

import { Drawer } from "@base-ui/react/drawer";
import { Star } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { AddBookButton } from "@/components/add-book-button";

export type DrawerBook = {
  id: string;
  title: string;
  thumbnail: string | null;
  description: string | null;
  authors: string[] | null;
  averageRating: number | null;
};

export function BookDetailDrawer({
  book,
  children,
  onOpen,
  addAction,
  addFields,
}: {
  book: DrawerBook;
  children: React.ReactNode;
  // Analytics-agnostic on purpose — this component has no idea what
  // recommendation_outcomes is. Callers that care (RecommendationRow) pass
  // a bound server action; every other caller just omits this.
  onOpen?: () => void;
  // Opt-in "Add to My List" button rendered at the bottom of the drawer —
  // only shown when a caller actually has somewhere for the add to go
  // (a recommendation not yet in the viewer's library). Callers that don't
  // pass these (Shared Ranking, Library tab, tier-row previews — books
  // already ranked/owned) render the drawer with no add action at all.
  addAction?: (formData: FormData) => void | Promise<void>;
  addFields?: Record<string, string>;
}) {
  return (
    <Drawer.Root
      onOpenChange={onOpen ? (open) => open && onOpen() : undefined}
    >
      <Drawer.Trigger
        className="block h-full w-full min-w-0 cursor-pointer rounded-sm transition-colors hover:bg-muted/50 active:bg-muted/50"
        aria-label={`View details for ${book.title}`}
      >
        {children}
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
          <Drawer.Popup className="flex h-[80vh] w-full max-w-md flex-col overflow-y-auto rounded-t-2xl bg-card outline-none transition-transform duration-300 data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
            <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
            <Drawer.Content className="flex flex-col items-center gap-4 p-6 text-center">
              <div className="w-32 shrink-0">
                <BookCover src={book.thumbnail} alt={book.title} size={128} />
              </div>
              <div>
                <Drawer.Title className="text-lg font-semibold text-foreground">
                  {book.title}
                </Drawer.Title>
                {book.authors && book.authors.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {book.authors.join(", ")}
                  </p>
                )}
                {book.averageRating != null && (
                  <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Star className="size-3.5 fill-primary text-primary" />
                    {book.averageRating.toFixed(1)}
                  </p>
                )}
              </div>
              <Drawer.Description className="text-left text-sm leading-relaxed text-muted-foreground">
                {book.description || "No synopsis available for this book."}
              </Drawer.Description>
              {addAction && addFields && (
                <AddBookButton
                  action={addAction}
                  fields={addFields}
                  label="Add to My List"
                  variant="default"
                  className="w-full shrink-0"
                />
              )}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
