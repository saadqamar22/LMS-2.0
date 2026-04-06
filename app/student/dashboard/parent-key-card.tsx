"use client";

import { useState } from "react";
import { KeyRound, Copy, Check } from "lucide-react";

export function ParentKeyCard({ parentKey }: { parentKey: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(parentKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard
      const el = document.createElement("textarea");
      el.value = parentKey;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <KeyRound className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900">Share this key with your parent</h3>
          <p className="mt-0.5 text-sm text-blue-700">
            Your parent needs this key to create their account and link to you. Once linked, this banner will disappear.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <code className="rounded-xl bg-white px-4 py-2.5 text-xl font-bold tracking-[0.25em] text-blue-900 shadow-sm border border-blue-200">
              {parentKey}
            </code>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
