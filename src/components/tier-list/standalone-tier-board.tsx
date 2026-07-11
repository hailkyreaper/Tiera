"use client";

import { useState } from "react";
import { TierBoard } from "./tier-board";
import type { Columns } from "./types";

/**
 * Owns its own columns state — for the normal (already-published, not
 * currently in the create/edit flow) owner view, which just needs a plain
 * interactive board. EditListDetailsForm lifts this same state itself
 * instead, since its review step needs to read the live board too.
 */
export function StandaloneTierBoard({
  tierListId,
  initialColumns,
}: {
  tierListId: string;
  initialColumns: Columns;
}) {
  const [columns, setColumns] = useState<Columns>(initialColumns);
  return (
    <TierBoard tierListId={tierListId} columns={columns} setColumns={setColumns} />
  );
}
