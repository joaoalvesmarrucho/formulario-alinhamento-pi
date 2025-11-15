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
    <html lang="pt" className="h-full" suppressHydrationWarning>
      <body className="h-full antialiased bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-50">
        {children}
      </body>
    </html>
  );
}
