import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export interface AdminSession {
  id: string;
  login: string;
  name: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required. Please set it in .env file.");
  }
  return secret;
}

/**
 * Проверяет авторизацию администратора и возвращает данные сессии
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, getJwtSecret()) as { adminId: string; login: string };

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      select: { id: true, login: true, name: true },
    });

    return admin;
  } catch {
    return null;
  }
}

/**
 * Проверяет, авторизован ли администратор
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}
