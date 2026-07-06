export default function ErrorPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Something went wrong
      </h1>
      <p className="text-muted-foreground">
        Sorry, we couldn&apos;t verify that link. Please try signing up again.
      </p>
    </div>
  );
}
