import AdminDashboardUI from "./AdminDashboardUI";
import { supabase } from "@/utils/supabase/client";
import { cookies } from "next/headers";
import { expandDoubleBrackets } from "@/utils/expandDoubleBrackets";

export const metadata = {
  title: "Admin Dashboard | U.S.S.W.A",
};

export const revalidate = 0;

async function fetchAll(table: string) {
  let allData: any[] = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + step - 1);
    if (error || !data || data.length === 0) break;
    allData = [...allData, ...data];
    if (data.length < step) break;
    from += step;
  }
  return allData;
}

export default async function AdminDashboard() {
  const { data: eventsData } = await supabase.from('events').select('*').order('date', { ascending: true });
  const registrationsRaw = await fetchAll('registrations');
  const registrations = expandDoubleBrackets(registrationsRaw);
  const parents = await fetchAll('parents');
  const wrestlers = await fetchAll('wrestlers');

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
