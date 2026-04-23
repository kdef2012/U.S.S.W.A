"use server";

import { supabase } from "@/utils/supabase/client";

export async function deleteEvent(eventId: string) {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (!error) {
      return { success: true, message: "Event successfully deleted." };
    } else {
      console.error(error);
      return { success: false, message: "Failed to delete from database." };
    }
  } catch (error) {
    console.error("Delete failed:", error);
    return { success: false, message: "Failed to delete event on the server." };
  }
}
