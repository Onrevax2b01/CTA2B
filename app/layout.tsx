import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CTA2B — Simulateur de traitement de l'alerte",
  description:
    "Outil pédagogique d'entraînement à la prise d'appel 18/112 pour opérateurs de CTA-CODIS.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="border-b bg-muted/50 px-4 py-1.5 text-center text-xs text-muted-foreground">
          Simulation à visée pédagogique — ne reflète aucun règlement
          opérationnel départemental en vigueur.
        </div>
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
