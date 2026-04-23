"use server";

import { cookies } from "next/headers";

export async function loginAdmin(pin: string) {
  if (pin === "0964") {
    // Set a secure, HTTP-only cookie that expires in 7 days
    const cookieStore = await cookies();
    cookieStore.set("admin_auth", "true", {
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
