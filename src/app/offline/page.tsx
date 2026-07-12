// Static fallback the service worker serves for a failed navigation while
// offline — pre-cached at install time (see public/sw.js), so it must not
// fetch anything or depend on auth/data.
export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        You&apos;re offline
      </h1>
      <p className="text-muted-foreground">
        Tiera needs a connection to load this page. Check your connection and
        try again.
      </p>
    </div>
  );
}
