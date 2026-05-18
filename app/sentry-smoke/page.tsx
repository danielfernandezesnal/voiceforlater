import { notFound } from "next/navigation";
import { SentrySmokeClient } from "./sentry-smoke-client";

export default function SentrySmokePage() {
  if (process.env.VERCEL_ENV !== "preview") {
    notFound();
  }

  return <SentrySmokeClient />;
}
