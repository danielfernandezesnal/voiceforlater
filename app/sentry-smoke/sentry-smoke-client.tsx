"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

function createSentrySmokeError() {
  return new Error("Sentry sourcemap preview smoke test");
}

export function SentrySmokeClient() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  async function handleClick() {
    setStatus("sending");

    try {
      Sentry.captureException(createSentrySmokeError(), {
        tags: {
          smoke: "sentry-sourcemaps-preview",
        },
      });

      await Sentry.flush(2000);
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-slate-950">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="text-xl font-semibold">Sentry preview smoke</h1>
        <button
          className="rounded border border-slate-300 px-4 py-2 text-left text-sm font-medium hover:bg-slate-50"
          onClick={handleClick}
          type="button"
        >
          Capture preview smoke exception
        </button>
        <p className="text-sm text-slate-600">Status: {status}</p>
      </div>
    </main>
  );
}
