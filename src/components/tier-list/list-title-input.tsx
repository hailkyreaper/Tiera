"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

const MAX_LENGTH = 40;

export function ListTitleInput({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="flex flex-1 flex-col gap-1">
      <div className="flex items-center justify-between">
        <label htmlFor="title" className="text-xs text-muted-foreground">
          List Title
        </label>
        <span className="text-xs text-muted-foreground">
          {value.length}/{MAX_LENGTH}
        </span>
      </div>
      <Input
        id="title"
        name="title"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={MAX_LENGTH}
        required
        placeholder="Insert title"
        className="border-none bg-transparent p-0 text-base font-semibold focus-visible:ring-0 dark:bg-transparent"
      />
    </div>
  );
}
