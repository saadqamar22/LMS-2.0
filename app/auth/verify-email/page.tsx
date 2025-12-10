export const metadata = {
  title: "Verify Email | ILMS",
  description: "Verify your email address",
};

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            We&apos;ve sent you a verification link. Please check your email
            and click the link to verify your account.
          </p>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Didn&apos;t receive the email?{" "}
            <a
              href="/auth/register"
              className="font-medium text-zinc-950 hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
            >
              Try again
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

