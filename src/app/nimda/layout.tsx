import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Админ-панель | Расписание КМЭПТ",
  description: "Управление расписанием КМЭПТ",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
