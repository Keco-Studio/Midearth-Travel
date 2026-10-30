import { ArrowLeft, CircleCheckBig } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getPaymentReturnHref } from "@/lib/payment-domain";

type Props = {
  searchParams: Promise<{ tour?: string | string[] }>;
};

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const { tour } = await searchParams;
  const returnHref = getPaymentReturnHref(tour);
  const hasTour = typeof tour === "string" && Boolean(tour.trim());

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-20 text-center">
      <CircleCheckBig className="mx-auto size-14 text-primary" aria-hidden />
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Payment received</p>
      <h1 className="mt-4 text-4xl font-light tracking-tight">Thank you for your payment.</h1>
      <p className="mt-5 leading-relaxed text-muted-foreground">
        Stripe has received your payment. MidEarth will confirm the order after our secure webhook updates the booking record.
      </p>
      <Link href={returnHref} className={buttonVariants({ size: "lg", className: "mt-8 self-center" })}>
        <ArrowLeft aria-hidden />
        {hasTour ? "Return to tour details" : "Return to tours"}
      </Link>
    </main>
  );
}
