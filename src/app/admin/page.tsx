import AdminDashboardUI from "./AdminDashboardUI";
import { supabase } from "@/utils/supabase/client";

export const metadata = {
  title: "Admin Dashboard | U.S.S.W.A",
};

export const revalidate = 0;

export default async function AdminDashboard() {
  const { data: eventsData } = await supabase.from('events').select('*').order('date', { ascending: true });
  const { data: registrations } = await supabase.from('registrations').select('*');
  const { data: parents } = await supabase.from('parents').select('*');
  const { data: wrestlers } = await supabase.from('wrestlers').select('*');

  return (
    <AdminDashboardUI 
      events={eventsData || []} 
      registrations={registrations || []} 
      parents={parents || []} 
      wrestlers={wrestlers || []} 
    />
  );
}
