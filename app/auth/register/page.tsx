import RegisterForm from "@/app/auth/register/register-form";

export const metadata = {
  title: "Register | AI LMS",
  description: "Create a new account to get started",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
            Or{" "}
            <a
              href="/auth/login"
              className="font-medium text-zinc-950 hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
            >
              sign in to your existing account
            </a>
          </p>
        </div>
        <div className="rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}

