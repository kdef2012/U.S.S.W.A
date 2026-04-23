"use server";

import { supabase } from "@/utils/supabase/client";

export async function createEvent(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const date = formData.get("date") as string;
    const location = formData.get("location") as string;
    const cost = parseFloat(formData.get("cost") as string || "35.00");
    
    const totalSpacesRaw = formData.get("total_spaces") as string;
    const totalSpaces = totalSpacesRaw ? parseInt(totalSpacesRaw) : null;
    
    const maxSpacesRaw = formData.get("max_spaces_per_booking") as string;
    const maxSpaces = maxSpacesRaw ? parseInt(maxSpacesRaw) : 20;

    const cutoffDateRaw = formData.get("cutoff_date") as string;
    const cutoffDate = cutoffDateRaw ? new Date(cutoffDateRaw).toISOString() : null;

    const id = formData.get("id") as string | null;

    if (!name || !date) {
      return { success: false, message: "Name and Date are required." };
    }

    const eventPayload = {
      name,
      date,
      location: location || "TBA",
      cost: cost,
      total_spaces: totalSpaces,
      max_spaces_per_booking: maxSpaces,
      cutoff_date: cutoffDate
    };

    let data, error;

    if (id) {
      // Update existing
      ({ data, error } = await supabase
        .from("events")
        .update(eventPayload)
        .eq("id", id)
        .select()
        .single());
    } else {
      // Insert new
      ({ data, error } = await supabase
        .from("events")
        .insert(eventPayload)
        .select()
        .single());
    }

    if (error) {
      console.error(error);
      return { success: false, message: "Failed to save event to database." };
    }

    return { success: true, message: id ? "Event updated successfully!" : "Event created successfully!" };
  } catch (err) {
    console.error("Create event error:", err);
    return { success: false, message: "Server error creating event." };
  }
}
