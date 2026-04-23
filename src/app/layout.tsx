import type { Metadata } from "next";
import "./globals.css";
import AdminLogo from "@/components/AdminLogo";

export const metadata: Metadata = {
  title: "U.S.S.W.A | United Scholastic Style Wrestling Association",
  description: "Register for upcoming wrestling tournaments and events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container header-container" style={{ position: "relative" }}>
            <AdminLogo />
            <div className="logo" style={{ paddingLeft: "180px" }}>
              U.S.S.W.A
            </div>
            <nav className="nav-links">
              <a href="/" className="nav-link">Home</a>
              <a href="/events" className="nav-link">Tournaments</a>
            </nav>
          </div>
        </header>

        <main className="main-content">
          {children}
        </main>

        <footer className="site-footer">
          <div className="container">
            <p>&copy; {new Date().getFullYear()} United Scholastic Style Wrestling Association. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
