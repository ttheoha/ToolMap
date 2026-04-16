import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "ToolMap - Inventaire Garage",
  description: "Gestion d'inventaire pour garage automobile",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-4 md:p-6 pt-[4.5rem] md:pt-6 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
