/**
 * Скрипт для создания администратора
 * Запуск: npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdmin() {
  const login = process.argv[2] || "admin";
  const password = process.argv[3] || "admin123";
  const name = process.argv[4] || "Администратор";

  console.log("Создание администратора...");
  console.log(`Логин: ${login}`);
  console.log(`Имя: ${name}`);

  // Хешируем пароль
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Проверяем, существует ли уже админ с таким логином
    const existingAdmin = await prisma.admin.findUnique({
      where: { login },
    });

    if (existingAdmin) {
      // Обновляем пароль
      await prisma.admin.update({
        where: { login },
        data: { password: hashedPassword, name },
      });
      console.log("✅ Пароль администратора обновлён");
    } else {
      // Создаём нового администратора
      await prisma.admin.create({
        data: {
          login,
          password: hashedPassword,
          name,
        },
      });
      console.log("✅ Администратор создан успешно");
    }

    console.log(`\nДля входа используйте:`);
    console.log(`  Логин: ${login}`);
    console.log(`  Пароль: ${password}`);
  } catch (error) {
    console.error("❌ Ошибка:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
