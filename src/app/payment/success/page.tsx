import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Payment received</p>
      <h1 className="mt-4 text-4xl font-light tracking-tight">Thank you for your payment.</h1>
      <p className="mt-5 leading-relaxed text-muted-foreground">
        Stripe has received your payment. MidEarth will confirm the order after our secure webhook updates the booking record.
      </p>
      <Link href="/tours" className="mt-8 underline underline-offset-4">Return to tours</Link>
    </main>
  );
}
