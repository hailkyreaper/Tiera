import { BookCover } from "@/components/book-cover";

export function BookTile({
  title,
  thumbnail,
  children,
}: {
  title: string;
  thumbnail: string | null | undefined;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex w-28 flex-col gap-1">
      <BookCover src={thumbnail} alt={title} size={112} />
      <p className="line-clamp-2 text-xs font-medium text-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}
