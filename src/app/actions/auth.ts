"use server";

import { cookies } from "next/headers";
import { supabase } from "@/utils/supabase/client";

export async function loginAdmin(pin: string) {
  const { data, error } = await supabase
    .from("admin_pins")
    .select("role")
    .eq("pin", pin)
    .single();

  if (!error && data) {
    const cookieStore = await cookies();
    cookieStore.set("admin_auth", data.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return { success: true };
  }

  
  return { success: false };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_auth");
}

export async function createAdminPin(newPin: string) {
  const cookieStore = await cookies();
  const auth = cookieStore.get("admin_auth");
  
  if (!auth || auth.value !== "superadmin") {
    return { success: false, message: "Unauthorized: Superadmin access required" };
  }
  
  if (!newPin || newPin.length !== 4) {
    return { success: false, message: "PIN must be exactly 4 characters" };
  }
  
  const { error } = await supabase
    .from("admin_pins")
    .insert([{ pin: newPin, role: "admin" }]);
    
  if (error) {
    return { success: false, message: error.message };
  }
  
  return { success: true };
}
