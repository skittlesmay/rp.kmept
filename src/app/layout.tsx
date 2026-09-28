import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Расписание КМЭПТ",
  description: "Удобный сервис для просмотра актуального расписания занятий Колледжа мировой экономики и передовых технологий",
  keywords: ["КМЭПТ", "расписание", "колледж", "занятия"],
  authors: [{ name: "КМЭПТ" }],
  openGraph: {
    title: "Расписание КМЭПТ",
    description: "Удобный сервис для просмотра актуального расписания занятий",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-dark text-text-primary antialiased">
        <div className="relative min-h-screen">
          {/* Subtle gradient overlay */}
          <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
          
          {/* Main content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
