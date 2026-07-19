"use client";

import { Drawer } from "@base-ui/react/drawer";
import { Star } from "lucide-react";
import { BookCover } from "@/components/book-cover";

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
}: {
  book: DrawerBook;
  children: React.ReactNode;
  // Analytics-agnostic on purpose — this component has no idea what
  // recommendation_outcomes is. Callers that care (RecommendationRow) pass
  // a bound server action; every other caller just omits this.
  onOpen?: () => void;
}) {
  return (
    <Drawer.Root
      onOpenChange={onOpen ? (open) => open && onOpen() : undefined}
    >
      <Drawer.Trigger
        className="block h-full w-full cursor-pointer"
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
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
