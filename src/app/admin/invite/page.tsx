import { AdminInviteForm } from "@/components/admin-invite-form";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function AdminInvitePage() {
  await requireAdminSession();
  return <AdminInviteForm />;
}
