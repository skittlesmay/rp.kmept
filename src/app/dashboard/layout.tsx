import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Расписание | КМЭПТ",
  description: "Просмотр расписания занятий КМЭПТ",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
