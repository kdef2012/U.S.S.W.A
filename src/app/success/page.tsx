import Image from "next/image";
import Link from "next/link";

export default function SuccessPage() {
  return (
    <div style={{
      minHeight: "80vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      textAlign: "center",
      padding: "2rem"
    }}>
      {/* Huge Background Watermark */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "80vw",
        height: "80vw",
        maxWidth: "800px",
        maxHeight: "800px",
        opacity: 0.15,
        zIndex: -1,
        filter: "drop-shadow(0 0 50px var(--accent-glow)) brightness(1.5)"
      }}>
        <Image 
          src="/logo.png" 
          alt="USSWA Watermark" 
          fill
          style={{ objectFit: "contain" }}
        />
      </div>

      <div className="glass-card" style={{
        padding: "4rem",
        border: "2px solid var(--accent-primary)",
        boxShadow: "0 0 30px var(--accent-glow)",
        maxWidth: "600px",
        width: "100%",
        animation: "fadeIn 0.5s ease-out forwards"
      }}>
        <h1 style={{ 
          fontSize: "3rem", 
          color: "var(--accent-primary)",
          marginBottom: "1rem",
          textShadow: "0 0 10px var(--accent-glow)"
        }}>
          Thank You!
        </h1>
        
        <h2 style={{ fontSize: "1.5rem", marginBottom: "2rem", color: "var(--text-primary)" }}>
          Your registration was successful!
        </h2>
        
        <p style={{ fontSize: "1.2rem", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "3rem" }}>
          Your wrestlers have been securely locked into their brackets. We are incredibly excited to see you and look forward to your attendance at the tournament!
        </p>

        <Link href="/events" className="btn btn-primary" style={{ padding: "1rem 2rem", fontSize: "1.2rem" }}>
          View More Events
        </Link>
      </div>
    </div>
  );
}
