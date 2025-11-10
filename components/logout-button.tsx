"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to log out. Please try again.");
        setLoading(false);
        return;
      }

      setLoading(false);
      router.push("/auth/login");
      router.refresh();
    } catch (err) {
      console.error("Error during logout:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      <button
        onClick={handleLogout}
        disabled={loading}
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800 dark:focus:ring-zinc-400"
      >
        {loading ? "Logging out..." : "Logout"}
      </button>
    </div>
  );
}

