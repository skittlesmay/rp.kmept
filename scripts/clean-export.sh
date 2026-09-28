#!/usr/bin/env bash
set -euo pipefail

# Скрипт безопасного экспорта проекта в чистый репозиторий без истории утечек
# Использование: ./scripts/clean-export.sh [путь_к_новой_директории]

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="${1:-${SOURCE_DIR}/../rp.kmept}"

echo "=== Экспорт чистой кодовой базы ==="
echo "Исходная директория: $SOURCE_DIR"
echo "Целевая директория:  $TARGET_DIR"

if [ -d "$TARGET_DIR" ]; then
  echo "Целевая директория уже существует: $TARGET_DIR"
  echo "Файлы будут скопированы с сохранением существующего .git (если есть)."
else
  mkdir -p "$TARGET_DIR"
fi

# Копирование с помощью rsync с жесткими исключениями
rsync -av --progress "$SOURCE_DIR/" "$TARGET_DIR/" \
  --exclude='.git/' \
  --exclude='.env' \
  --exclude='.env.production' \
  --exclude='.env.local' \
  --exclude='.env.*.local' \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='data/' \
  --exclude='*.db' \
  --exclude='*.db-journal' \
  --exclude='prisma/*.db' \
  --exclude='prisma/*.db-journal' \
  --exclude='logs/' \
  --exclude='*.log' \
  --exclude='logsOnServer.md' \
  --exclude='proverka.txt' \
  --exclude='redisign.txt' \
  --exclude='testperenosa.txt' \
  --exclude='AGENTS.md' \
  --exclude='CLAUDE.md' \
  --exclude='*.pdf' \
  --exclude='.claude/' \
  --exclude='.cursor/' \
  --exclude='.cursorrules' \
  --exclude='*.prompt' \
  --exclude='prompts/' \
  --exclude='dist/' \
  --exclude='build/' \
  --exclude='.cache/' \
  --exclude='.vscode/' \
  --exclude='.idea/'

cd "$TARGET_DIR"

# Инициализация чистого git-репозитория
git init -b main
git config user.name "Platon Fedotov"
git config user.email "platon.fedotov97@mail.ru"

echo "=== Проверка статуса в новой директории ==="
git status

echo ""
echo "=== Чистый репозиторий готов в: $TARGET_DIR ==="
echo "Для создания первого коммита выполните:"
echo "  cd \"$TARGET_DIR\""
echo "  git add ."
echo "  git commit -m \"feat: initial release of KMEPT schedule platform\""
