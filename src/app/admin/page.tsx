import AdminDashboardUI from "./AdminDashboardUI";
import { supabase } from "@/utils/supabase/client";
import { cookies } from "next/headers";

export const metadata = {
  title: "Admin Dashboard | U.S.S.W.A",
};

export const revalidate = 0;

export default async function AdminDashboard() {
  const { data: eventsData } = await supabase.from('events').select('*').order('date', { ascending: true });
  const { data: registrations } = await supabase.from('registrations').select('*');
  const { data: parents } = await supabase.from('parents').select('*');
  const { data: wrestlers } = await supabase.from('wrestlers').select('*');

  const cookieStore = await cookies();
  const userRole = cookieStore.get("admin_auth")?.value || "admin";

  return (
    <AdminDashboardUI 
      events={eventsData || []} 
      registrations={registrations || []} 
      parents={parents || []} 
      wrestlers={wrestlers || []} 
      userRole={userRole}
    />
  );
}
