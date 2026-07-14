"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListOptionsMenu } from "@/components/tier-list/list-options-menu";

/**
 * Desktop-only Edit + ••• toolbar on the owner's own Profile list cards
 * (design/Desktop.png's Filter/Edit/••• trio — Filter deliberately left out,
 * see CLAUDE.md). `relative z-10` escapes the card's own full-bleed overlay
 * Link the same way the @username link already does. A client leaf (rather
 * than inline in the server-rendered ExploreListCard) only because
 * ListOptionsMenu is itself a client component.
 */
export function ListCardOwnerControls({ tierListId }: { tierListId: string }) {
  return (
    <div className="relative z-10 hidden shrink-0 items-center gap-1 lg:flex">
      <Link href={`/lists/${tierListId}?manage=true`}>
        <Button type="button" variant="outline" size="xs">
          <Pencil className="size-3.5" />
          Edit
        </Button>
      </Link>
      <ListOptionsMenu tierListId={tierListId} hideEdit />
    </div>
  );
}
