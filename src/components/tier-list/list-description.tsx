export function ListDescription({
  description,
  tags,
}: {
  description: string | null;
  tags: string[] | null;
}) {
  if (!description && (!tags || tags.length === 0)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
