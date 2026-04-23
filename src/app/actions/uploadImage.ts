"use server";

import { supabase } from "@/utils/supabase/client";

export async function uploadEventImage(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const eventId = formData.get('eventId') as string;

    if (!file || !eventId) {
      return { success: false, message: "Missing file or event ID." };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExt = file.name.split('.').pop() || 'jpg';
    const filename = `${eventId}_${Date.now()}.${fileExt}`;
    
    // 1. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('event-logos')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { success: false, message: "Failed to upload image to cloud storage. Did you create the 'event-logos' bucket?" };
    }

    // 2. Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from('event-logos')
      .getPublicUrl(filename);

    const publicUrl = publicUrlData.publicUrl;

    // 3. Update Supabase event
    const { error: dbError } = await supabase
      .from('events')
      .update({ image_url: publicUrl })
      .eq('id', eventId);

    if (!dbError) {
      return { success: true, imageUrl: publicUrl, message: "Image uploaded successfully!" };
    } else {
      console.error(dbError);
      return { success: false, message: "Event not found or failed to update in database." };
    }
  } catch (error) {
    console.error("Upload failed:", error);
    return { success: false, message: "Upload failed on the server." };
  }
}
