import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const TOKEN_EXPIRY = "7d"; // Токен действует 7 дней

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required. Please set it in .env file.");
  }
  return secret;
}

/**
 * POST /api/admin/auth
 * Авторизация администратора
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { login, password } = body;

    if (!login || !password) {
      return NextResponse.json(
        { success: false, error: "Логин и пароль обязательны" },
        { status: 400 }
      );
    }

    // Находим администратора
    const admin = await prisma.admin.findUnique({
      where: { login },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Неверный логин или пароль" },
        { status: 401 }
      );
    }

    // Генерируем JWT токен
    const token = jwt.sign(
      { adminId: admin.id, login: admin.login },
      getJwtSecret(),
      { expiresIn: TOKEN_EXPIRY }
    );

    // Устанавливаем cookie
    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 дней
      path: "/",
    });

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        login: admin.login,
        name: admin.name,
      },
    });
  } catch (error) {
    console.error("Ошибка авторизации:", error);

    return NextResponse.json(
      { success: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/auth
 * Проверка текущей сессии администратора
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    // Проверяем токен
    const decoded = jwt.verify(token, getJwtSecret()) as { adminId: string; login: string };

    // Находим администратора
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Администратор не найден" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        login: admin.login,
        name: admin.name,
      },
    });
  } catch (error) {
    console.error("Ошибка проверки сессии:", error);

    return NextResponse.json(
      { success: false, error: "Недействительный токен" },
      { status: 401 }
    );
  }
}

/**
 * DELETE /api/admin/auth
 * Выход из системы
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_token");

    return NextResponse.json({
      success: true,
      data: { message: "Выход выполнен успешно" },
    });
  } catch (error) {
    console.error("Ошибка выхода:", error);

    return NextResponse.json(
      { success: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
