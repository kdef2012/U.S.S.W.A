import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const authValue = cookieStore.get("admin_auth")?.value;
  const isAdmin = authValue === "admin" || authValue === "superadmin";

  if (!isAdmin) {
    redirect("/"); // Kick them out to the homepage if they aren't authenticated
  }

  return <>{children}</>;
}
