export default function CheckEmailPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Check your email
      </h1>
      <p className="max-w-sm text-muted-foreground">
        We sent you a confirmation link. Click it to activate your account,
        then come back and log in.
      </p>
    </div>
  );
}
