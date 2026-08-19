import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Checkout canceled</p>
      <h1 className="mt-4 text-4xl font-light tracking-tight">No payment was taken.</h1>
      <p className="mt-5 leading-relaxed text-muted-foreground">You can return to the tour page or contact MidEarth to arrange another payment method.</p>
      <Link href="/tours" className="mt-8 underline underline-offset-4">Return to tours</Link>
    </main>
  );
}
