"use client";

import { CreditCard, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function TourCheckoutButton({
  tourSlug,
  fares,
}: {
  tourSlug: string;
  fares: Array<{ label: string; price: string }>;
}) {
  const [fareLabel, setFareLabel] = useState(fares[0]?.label ?? "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourSlug, fareLabel, paymentType: "full", customerEmail: email }),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Unable to start checkout");
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout");
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <label className="block text-xs font-medium text-muted-foreground" htmlFor={`fare-${tourSlug}`}>
        Fare
      </label>
      <select
        id={`fare-${tourSlug}`}
        value={fareLabel}
        onChange={(event) => setFareLabel(event.target.value)}
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
      >
        {fares.map((fare) => <option key={fare.label} value={fare.label}>{fare.label} — {fare.price} CAD</option>)}
      </select>
      <label className="block text-xs font-medium text-muted-foreground" htmlFor={`email-${tourSlug}`}>
        Email for receipt
      </label>
      <input
        id={`email-${tourSlug}`}
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        required
      />
      <Button type="button" className="w-full" disabled={loading || !email.trim() || !fareLabel} onClick={() => void startCheckout()}>
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <CreditCard className="h-4 w-4" aria-hidden />}
        {loading ? "Opening secure checkout" : "Pay securely with Stripe"}
      </Button>
      {error ? <p className="text-xs text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}
