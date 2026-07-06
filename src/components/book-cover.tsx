import Image from "next/image";

export function BookCover({
  src,
  alt,
  size = 200,
}: {
  src: string | null | undefined;
  alt: string;
  size?: number;
}) {
  if (!src) {
    return (
      <div className="flex aspect-2/3 w-full items-center justify-center rounded-2xl bg-muted text-xs text-muted-foreground">
        No cover
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={Math.round(size * 1.5)}
      className="h-auto w-full rounded-2xl object-cover"
    />
  );
}
