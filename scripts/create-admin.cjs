/**
 * Скрипт для создания администратора
 * Запуск: node scripts/create-admin.js [логин] [пароль] [имя]
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createAdmin() {
  const login = process.argv[2] || "admin";
  const password = process.argv[3] || "admin123";
  const name = process.argv[4] || "Администратор";

  console.log("Создание администратора...");
  console.log(`Логин: ${login}`);
  console.log(`Имя: ${name}`);

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingAdmin = await prisma.admin.findUnique({
      where: { login },
    });

    if (existingAdmin) {
      await prisma.admin.update({
        where: { login },
        data: { password: hashedPassword, name },
      });
      console.log("✅ Пароль администратора обновлён");
    } else {
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
    console.error("❌ Ошибка:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
