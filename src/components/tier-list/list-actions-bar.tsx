import Link from "next/link";
import { Search, Download, Library } from "lucide-react";

export function ListActionsBar({ tierListId }: { tierListId: string }) {
  return (
    <div className="flex divide-x divide-border overflow-hidden rounded-sm bg-card">
      <Link
        href={`/lists/${tierListId}/search`}
        className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-foreground hover:bg-muted"
      >
        <Search className="size-4" />
        Search Books
      </Link>
      <span className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground">
        <Download className="size-4" />
        Import
      </span>
      <Link
        href={`/lists/${tierListId}/library`}
        className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-foreground hover:bg-muted"
      >
        <Library className="size-4" />
        Add from Library
      </Link>
    </div>
  );
}
