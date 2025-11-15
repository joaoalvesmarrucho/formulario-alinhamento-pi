import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Formulário de Alinhamento Político | Partido Inteiro",
  description: "Processo de alinhamento interno - valores, temas e participação",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
