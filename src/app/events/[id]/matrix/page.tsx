import { notFound } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import MatrixView from "./MatrixView";

export const dynamic = "force-dynamic";

export default async function MatrixPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Fetch Event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (eventError || !event) {
    notFound();
  }

  // 2. Fetch all registrations for this event
  const { data: registrations } = await supabase
    .from('registrations')
    .select('*')
    .eq('event_id', id);

  // 3. Fetch all wrestlers
  const { data: wrestlers } = await supabase
    .from('wrestlers')
    .select('*');

  return (
    <MatrixView 
      event={event} 
      registrations={registrations || []} 
      wrestlers={wrestlers || []} 
    />
  );
}
