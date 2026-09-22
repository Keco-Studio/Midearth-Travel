import { Suspense } from "react";
import { AdminRegistrationForm } from "@/components/admin-registration-form";

export default function AdminRegistrationPage() {
  return (
    <Suspense fallback={<main className="cms-login-page" aria-busy="true" />}>
      <AdminRegistrationForm />
    </Suspense>
  );
}
