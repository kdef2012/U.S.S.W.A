"use server";

import { supabase } from "@/utils/supabase/client";

export async function submitRegistration(formData: FormData) {
  try {
    const eventId = formData.get("eventId") as string;
    const eventCost = parseFloat(formData.get("eventCost") as string || "35.00");
    const parentFirstName = formData.get("parentFirstName") as string;
    const parentLastName = formData.get("parentLastName") as string;
    const parentEmail = formData.get("parentEmail") as string;
    const parentPhone = formData.get("parentPhone") as string;
    
    const wrestlersJson = formData.get("wrestlers") as string;
    const wrestlers = JSON.parse(wrestlersJson || "[]");

    if (wrestlers.length === 0) {
      return { success: false, message: "No wrestlers submitted." };
    }

    // Capacity Check
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('total_spaces, max_spaces_per_booking, cutoff_date')
      .eq('id', eventId)
      .single();

    if (eventError) {
      return { success: false, message: "Could not fetch event data." };
    }

    if (eventData.cutoff_date && new Date(eventData.cutoff_date) < new Date()) {
      return { success: false, message: "The registration deadline for this event has passed." };
    }

    if (eventData.max_spaces_per_booking && wrestlers.length > eventData.max_spaces_per_booking) {
      return { success: false, message: `You can only register up to ${eventData.max_spaces_per_booking} wrestlers per booking.` };
    }

    // We'd also check total_spaces vs current registration count here in a robust system

    // 1. Handle Parent / Coach
    let parentId;
    const { data: existingParent, error: parentSearchError } = await supabase
      .from('parents')
      .select('id')
      .eq('email', parentEmail)
      .maybeSingle();

    if (existingParent) {
      parentId = existingParent.id;
    } else {
      const { data: newParent, error: parentError } = await supabase
        .from('parents')
        .insert({
          first_name: parentFirstName,
          last_name: parentLastName,
          email: parentEmail,
          phone: parentPhone
        })
        .select()
        .single();
        
      if (parentError) throw parentError;
      parentId = newParent.id;
    }

    const signature = `${parentFirstName} ${parentLastName}`;

    // 2. Loop through Wrestlers
    for (const w of wrestlers) {
      let wrestlerId;

      // Check for existing wrestler by name (case insensitive)
      const { data: existingWrestler, error: wrestlerSearchError } = await supabase
        .from('wrestlers')
        .select('id')
        .ilike('first_name', w.firstName)
        .ilike('last_name', w.lastName)
        .maybeSingle();

      if (existingWrestler) {
        wrestlerId = existingWrestler.id;
      } else {
        // Create Wrestler
        const { data: newWrestler, error: wrestlerError } = await supabase
          .from('wrestlers')
          .insert({
            parent_id: parentId, // The person who first registered them
            first_name: w.firstName,
            last_name: w.lastName,
            team: w.team
          })
          .select()
          .single();

        if (wrestlerError) throw wrestlerError;
        wrestlerId = newWrestler.id;
      }

      // Create Registration
      const fee = eventCost + (w.doubleBracket ? 30.00 : 0);

      const regData: any = {
        event_id: eventId,
        wrestler_id: wrestlerId,
        parent_id: parentId,
        division: w.division,
        weight_class: w.weight,
        fee: fee,
        electronic_signature: signature,
        status: "pre-registered"
      };

      if (w.doubleBracket) {
        regData.double_bracket_division = w.doubleDivision;
        regData.double_bracket_weight_class = w.doubleWeight;
      }

      const { error: regError } = await supabase
        .from('registrations')
        .insert(regData);

      if (regError) throw regError;
    }

    return { success: true, message: "Registration saved successfully!" };
  } catch (error) {
    console.error("Failed to save registration to Supabase:", error);
    return { success: false, message: "Failed to process registration." };
  }
}
