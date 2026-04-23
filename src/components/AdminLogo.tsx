"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/app/actions/auth";

export default function AdminLogo() {
  const [clickCount, setClickCount] = useState(0);
  const router = useRouter();

  const handleClick = async () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 3) {
      setClickCount(0); // Reset
      const pin = prompt("Enter Admin PIN:");
      if (pin) {
        const result = await loginAdmin(pin);
        if (result.success) {
          router.push("/admin");
        } else {
          alert("Incorrect PIN.");
        }
      }
    }
  };

  return (
    <img 
      src="/logo.png" 
      alt="U.S.S.W.A Logo" 
      onClick={handleClick}
      style={{ 
        position: "absolute", 
        top: "0px", 
        left: "1rem", 
        width: "180px", 
        height: "180px", 
        borderRadius: "50%", 
        border: "4px solid var(--accent-primary)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
        zIndex: 1000,
        backgroundColor: "var(--bg-primary)",
        cursor: "pointer"
      }} 
    />
  );
}
