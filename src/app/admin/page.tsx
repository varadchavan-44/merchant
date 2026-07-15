import { isAdmin } from "@/lib/admin-auth";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminDashboard } from "@/components/AdminDashboard";

export default async function AdminPage() {
  const authed = await isAdmin();
  return authed ? <AdminDashboard /> : <AdminLogin />;
}
