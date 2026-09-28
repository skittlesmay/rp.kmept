import * as XLSX from "xlsx";
import { ParsedGroupSchedule, ParsedScheduleRow } from "@/types";

interface RawScheduleData {
  dayOfWeek: string;
  pairNumber: number;
  timeStart: string;
  timeEnd: string;
  groups: Map<string, { subject: string | null; room: string | null; teacher: string | null }>;
}

type FileFormat = "old" | "new";

/**
 * Расписание звонков для субботы (отличается от будних дней)
 */
const SATURDAY_SCHEDULE: Record<number, { timeStart: string; timeEnd: string }> = {
  1: { timeStart: "9:00", timeEnd: "10:20" },
  2: { timeStart: "10:30", timeEnd: "11:50" },
  3: { timeStart: "12:10", timeEnd: "13:30" },
  4: { timeStart: "13:40", timeEnd: "15:00" },
  5: { timeStart: "15:10", timeEnd: "16:30" },
  6: { timeStart: "16:40", timeEnd: "18:00" },
};

/**
 * Корректирует время для субботы
 * Суббота имеет отдельное расписание звонков
 */
function applySaturdaySchedule(
  dayOfWeek: string,
  pairNumber: number,
  timeStart: string,
  timeEnd: string
): { timeStart: string; timeEnd: string } {
  // Проверяем, суббота ли это
  if (dayOfWeek.toLowerCase() === "сб") {
    const saturdayTime = SATURDAY_SCHEDULE[pairNumber];
    if (saturdayTime) {
      return saturdayTime;
    }
  }
  return { timeStart, timeEnd };
}

/**
 * Определяет формат файла по структуре данных
 * Новый формат: день недели содержит дату (например "Пн, 09.03.26")
 * Старый формат: день недели без даты (например "Пн, ")
 */
function detectFileFormat(data: (string | number | null)[][]): FileFormat {
  for (let i = 2; i < Math.min(data.length, 50); i++) {
    const row = data[i];
    if (row && row[0] && typeof row[0] === "string") {
      const dayCell = row[0];
      // Новый формат содержит дату: "Пн, 09.03.26"
      if (dayCell.match(/^(Пн|Вт|Ср|Чт|Пт|Сб),?\s+\d{2}\.\d{2}\.\d{2}/i)) {
        return "new";
      }
      // Старый формат: "Пн, " без даты
      if (dayCell.match(/^(Пн|Вт|Ср|Чт|Пт|Сб),?\s*$/i)) {
        return "old";
      }
    }
  }
  return "old"; // По умолчанию старый формат
}

/**
 * Нормализует название аудитории
 * Убирает лишние символы (!, _, -) и приводит "онлайн" к единому виду
 */
function normalizeRoom(room: string | null): string | null {
  if (!room) return null;
  
  let normalized = room.trim();
  
  // Убираем лишние символы в конце
  normalized = normalized.replace(/[!_\-]+$/g, "").trim();
  
  // Приводим различные варианты "онлайн" к единому виду
  if (normalized.toLowerCase().startsWith("онлайн")) {
    // Извлекаем номер подгруппы если есть (например "онлайн (9)" -> "онлайн (9)")
    const match = normalized.match(/онлайн\s*\((\d+)\)/i);
    if (match) {
      return `онлайн (${match[1]})`;
    }
    return "онлайн";
  }
  
  // Убираем префиксы дат типа "02.03 " в начале
  normalized = normalized.replace(/^\d{2}\.\d{2}\s+/, "").trim();
  
  return normalized === "" || normalized === "-" ? null : normalized;
}

/**
 * Проверяет, является ли запись пустым занятием (типа "1. -" с аудиторией "-")
 */
function isEmptyLesson(subject: string | null, room: string | null): boolean {
  if (!subject) return true;
  
  // Проверяем формат "1. -", "2. -", "N. -"
  const emptyPattern = /^\d+\.\s*-\s*$/;
  if (emptyPattern.test(subject)) return true;
  
  // Проверяем просто "-"
  if (subject.trim() === "-") return true;
  
  return false;
}

/**
 * Извлекает номер подгруппы из строки предмета (например "1. Иностранный язык" -> 1)
 */
function extractSubgroupNumber(subject: string): number | null {
  const match = subject.match(/^(\d+)\.\s+/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Убирает номер подгруппы из названия предмета
 */
function removeSubgroupPrefix(subject: string): string {
  return subject.replace(/^\d+\.\s+/, "").trim();
}

/**
 * Проверяет, является ли строка типом занятия "(занятие)"
 */
function isLessonType(str: string | null): boolean {
  if (!str) return false;
  return str.trim().toLowerCase() === "(занятие)";
}

/**
 * Парсит Excel файл с расписанием и возвращает данные по группам
 * Автоматически определяет формат файла и использует соответствующий парсер
 */
export function parseScheduleExcel(buffer: Buffer): ParsedGroupSchedule[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Преобразуем в двумерный массив
  const data: (string | number | null)[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
  });

  if (data.length < 3) {
    throw new Error("Файл не содержит достаточно данных");
  }

  // Определяем формат файла
  const fileFormat = detectFileFormat(data);
  console.log(`Определён формат файла: ${fileFormat}`);

  // Извлекаем названия групп из первой строки
  const headerRow = data[0];
  const groups = extractGroups(headerRow);

  if (groups.length === 0) {
    throw new Error("Не удалось найти группы в файле");
  }

  console.log(`Найдено групп: ${groups.length}`);
  console.log("Группы:", groups.map((g) => g.name).join(", "));

  // Парсим расписание в зависимости от формата
  const rawSchedule = fileFormat === "new" 
    ? parseNewFormatSchedule(data, groups)
    : parseRawSchedule(data, groups);

  // Формируем результат по группам
  const result: ParsedGroupSchedule[] = groups.map((group) => ({
    groupName: group.name,
    schedule: rawSchedule
      .filter((row) => row.groups.has(group.name))
      .map((row) => {
        const groupData = row.groups.get(group.name)!;
        // Применяем расписание звонков для субботы
        const correctedTime = applySaturdaySchedule(
          row.dayOfWeek,
          row.pairNumber,
          row.timeStart,
          row.timeEnd
        );
        return {
          dayOfWeek: row.dayOfWeek,
          pairNumber: row.pairNumber,
          timeStart: correctedTime.timeStart,
          timeEnd: correctedTime.timeEnd,
          subject: groupData.subject,
          teacher: groupData.teacher || extractTeacher(groupData.subject),
          room: groupData.room,
        };
      })
      .filter((item) => item.subject !== null), // Убираем пустые пары
  }));

  return result;
}

/**
 * Извлекает информацию о группах из заголовка
 */
function extractGroups(headerRow: (string | number | null)[]): { name: string; colIndex: number }[] {
  const groups: { name: string; colIndex: number }[] = [];

  for (let i = 3; i < headerRow.length; i += 2) {
    const cellValue = headerRow[i];
    if (cellValue && typeof cellValue === "string" && cellValue.trim() !== "") {
      const groupName = cellValue.trim();
      // Проверяем что это название группы, а не служебная ячейка
      if (!groupName.toLowerCase().includes("предмет") && !groupName.toLowerCase().includes("ауд")) {
        groups.push({ name: groupName, colIndex: i });
      }
    }
  }

  return groups;
}

/**
 * Интерфейс для хранения данных подгруппы
 */
interface SubgroupData {
  subgroupNum: number;
  subject: string;
  teacher: string | null;
  room: string | null;
}

/**
 * Парсит расписание в новом формате (с датами и подгруппами)
 */
function parseNewFormatSchedule(
  data: (string | number | null)[][],
  groups: { name: string; colIndex: number }[]
): RawScheduleData[] {
  const schedule: RawScheduleData[] = [];
  let currentDay = "";
  let rowIndex = 2; // Начинаем после заголовков

  while (rowIndex < data.length) {
    const row = data[rowIndex];
    if (!row || row.length === 0) {
      rowIndex++;
      continue;
    }

    // Обновляем текущий день недели (извлекаем только день без даты)
    const dayCell = row[0];
    if (dayCell && typeof dayCell === "string") {
      const dayMatch = dayCell.match(/^(Пн|Вт|Ср|Чт|Пт|Сб)/i);
      if (dayMatch) {
        currentDay = dayMatch[1];
      }
    }

    // Проверяем номер пары
    const pairCell = row[1];
    if (!pairCell || typeof pairCell !== "number") {
      rowIndex++;
      continue;
    }

    const pairNumber = pairCell;
    if (pairNumber < 1 || pairNumber > 6) {
      rowIndex++;
      continue;
    }

    // Извлекаем время
    const timeCell = row[2];
    const { timeStart, timeEnd } = parseTime(timeCell);

    if (!currentDay || !timeStart) {
      rowIndex++;
      continue;
    }

    // Собираем данные по группам для этой пары
    const groupsData = new Map<string, { subject: string | null; room: string | null; teacher: string | null }>();

    for (const group of groups) {
      // Собираем все подгруппы для данной группы и пары
      const subgroups = collectSubgroupsForPair(data, rowIndex, group.colIndex);
      
      if (subgroups.length === 0) {
        groupsData.set(group.name, { subject: null, room: null, teacher: null });
      } else if (subgroups.length === 1) {
        // Одна подгруппа - просто используем её данные
        const sg = subgroups[0];
        const subjectWithTeacher = sg.teacher 
          ? `${sg.subject} (${sg.teacher})`
          : sg.subject;
        groupsData.set(group.name, { 
          subject: subjectWithTeacher, 
          room: normalizeRoom(sg.room),
          teacher: sg.teacher
        });
      } else {
        // Несколько подгрупп - объединяем через " / "
        const combinedSubject = subgroups
          .map(sg => {
            const subjectPart = sg.teacher 
              ? `${sg.subgroupNum}. ${sg.subject} (${sg.teacher})`
              : `${sg.subgroupNum}. ${sg.subject}`;
            return subjectPart;
          })
          .join(" / ");
        
        // Собираем уникальные аудитории
        const uniqueRooms = [...new Set(subgroups.map(sg => normalizeRoom(sg.room)).filter(Boolean))];
        const combinedRoom = uniqueRooms.length > 0 ? uniqueRooms.join(", ") : null;
        
        // Собираем всех преподавателей
        const teachers = subgroups.map(sg => sg.teacher).filter(Boolean);
        const combinedTeacher = teachers.length > 0 ? teachers.join(", ") : null;
        
        groupsData.set(group.name, { 
          subject: combinedSubject, 
          room: combinedRoom,
          teacher: combinedTeacher
        });
      }
    }

    schedule.push({
      dayOfWeek: currentDay,
      pairNumber,
      timeStart,
      timeEnd,
      groups: groupsData,
    });

    // Пропускаем все строки, относящиеся к этой паре
    rowIndex = findNextPairRow(data, rowIndex + 1);
  }

  return schedule;
}

/**
 * Собирает данные всех подгрупп для конкретной пары и группы
 */
function collectSubgroupsForPair(
  data: (string | number | null)[][],
  startRowIndex: number,
  colIndex: number
): SubgroupData[] {
  const subgroups: SubgroupData[] = [];
  let rowIndex = startRowIndex;

  // Сначала проверяем данные в строке с номером пары
  const mainRow = data[rowIndex];
  const mainSubject = getCellString(mainRow?.[colIndex]);
  const mainRoom = getCellString(mainRow?.[colIndex + 1]);

  if (mainSubject && !isEmptyLesson(mainSubject, mainRoom) && !isLessonType(mainSubject)) {
    // Есть предмет в основной строке
    const subgroupNum = extractSubgroupNumber(mainSubject);
    const cleanSubject = removeSubgroupPrefix(mainSubject);
    
    // Ищем преподавателя в следующих строках
    const teacher = findTeacherInNextRows(data, rowIndex, colIndex);
    
    if (cleanSubject && cleanSubject !== "-") {
      subgroups.push({
        subgroupNum: subgroupNum || 1,
        subject: cleanSubject,
        teacher,
        room: mainRoom
      });
    }
  }

  // Теперь ищем дополнительные подгруппы в последующих строках
  rowIndex++;
  while (rowIndex < data.length) {
    const row = data[rowIndex];
    if (!row) {
      rowIndex++;
      continue;
    }

    // Если встретили новый номер пары или день - выходим
    if (row[1] && typeof row[1] === "number") break;
    if (row[0] && typeof row[0] === "string" && row[0].match(/^(Пн|Вт|Ср|Чт|Пт|Сб)/i)) break;

    const cellValue = getCellString(row[colIndex]);
    const roomValue = getCellString(row[colIndex + 1]);

    // Пропускаем "(занятие)" и пустые строки
    if (!cellValue || isLessonType(cellValue)) {
      rowIndex++;
      continue;
    }

    // Проверяем, является ли это началом новой подгруппы (начинается с "N. ")
    const subgroupNum = extractSubgroupNumber(cellValue);
    if (subgroupNum !== null) {
      const cleanSubject = removeSubgroupPrefix(cellValue);
      
      if (!isEmptyLesson(cellValue, roomValue) && cleanSubject && cleanSubject !== "-") {
        // Ищем преподавателя для этой подгруппы
        const teacher = findTeacherInNextRows(data, rowIndex, colIndex);
        
        subgroups.push({
          subgroupNum,
          subject: cleanSubject,
          teacher,
          room: roomValue
        });
      }
    }

    rowIndex++;
  }

  return subgroups;
}

/**
 * Ищет ФИО преподавателя в следующих строках после предмета
 */
function findTeacherInNextRows(
  data: (string | number | null)[][],
  startRowIndex: number,
  colIndex: number
): string | null {
  // Проверяем следующие 3 строки
  for (let i = 1; i <= 3; i++) {
    const row = data[startRowIndex + i];
    if (!row) continue;

    // Если встретили номер пары - прекращаем поиск
    if (row[1] && typeof row[1] === "number") break;

    const cellValue = getCellString(row[colIndex]);
    if (!cellValue) continue;

    // Пропускаем "(занятие)"
    if (isLessonType(cellValue)) continue;

    // Пропускаем если это новая подгруппа
    if (extractSubgroupNumber(cellValue) !== null) break;

    // Проверяем, похоже ли на ФИО преподавателя
    const teacherMatch = cellValue.match(/^[А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.\s?[А-ЯЁ]\.?$/);
    if (teacherMatch) {
      return cellValue.trim();
    }
  }

  return null;
}

/**
 * Находит индекс строки со следующей парой
 */
function findNextPairRow(data: (string | number | null)[][], startRowIndex: number): number {
  for (let i = startRowIndex; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    // Нашли строку с номером пары
    if (row[1] && typeof row[1] === "number") {
      return i;
    }

    // Нашли строку с днём недели (тоже может начинать новый блок)
    if (row[0] && typeof row[0] === "string" && row[0].match(/^(Пн|Вт|Ср|Чт|Пт|Сб)/i)) {
      return i;
    }
  }

  return data.length; // Конец файла
}

/**
 * Парсит сырые данные расписания (старый формат)
 */
function parseRawSchedule(
  data: (string | number | null)[][],
  groups: { name: string; colIndex: number }[]
): RawScheduleData[] {
  const schedule: RawScheduleData[] = [];
  let currentDay = "";

  // Начинаем со строки 2 (после заголовков)
  for (let rowIndex = 2; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    if (!row || row.length === 0) continue;

    // Обновляем текущий день недели
    const dayCell = row[0];
    if (dayCell && typeof dayCell === "string") {
      const dayMatch = dayCell.match(/^(Пн|Вт|Ср|Чт|Пт|Сб)/i);
      if (dayMatch) {
        currentDay = dayMatch[1];
      }
    }

    // Проверяем номер пары
    const pairCell = row[1];
    if (!pairCell || typeof pairCell !== "number") continue;

    const pairNumber = pairCell;
    if (pairNumber < 1 || pairNumber > 6) continue;

    // Извлекаем время
    const timeCell = row[2];
    const { timeStart, timeEnd } = parseTime(timeCell);

    if (!currentDay || !timeStart) continue;

    // Собираем данные по группам
    const groupsData = new Map<string, { subject: string | null; room: string | null; teacher: string | null }>();

    for (const group of groups) {
      const subjectCell = row[group.colIndex];
      const roomCell = row[group.colIndex + 1];

      // Получаем предмет (может быть в текущей строке или следующей)
      let subject = getCellString(subjectCell);

      // Проверяем следующую строку на наличие преподавателя
      const nextRow = data[rowIndex + 1];
      if (nextRow && !nextRow[1]) {
        // Если следующая строка без номера пары — это продолжение
        const nextSubjectCell = nextRow[group.colIndex];
        const nextSubjectStr = getCellString(nextSubjectCell);
        if (nextSubjectStr && subject) {
          // Объединяем предмет и преподавателя
          subject = `${subject} ${nextSubjectStr}`;
        } else if (nextSubjectStr && !subject) {
          subject = nextSubjectStr;
        }
      }

      const room = getCellString(roomCell);

      groupsData.set(group.name, { subject, room, teacher: null });
    }

    schedule.push({
      dayOfWeek: currentDay,
      pairNumber,
      timeStart,
      timeEnd,
      groups: groupsData,
    });
  }

  return schedule;
}

/**
 * Парсит время из ячейки
 */
function parseTime(cell: string | number | null): { timeStart: string; timeEnd: string } {
  if (!cell) return { timeStart: "", timeEnd: "" };

  const timeStr = String(cell).trim();
  const match = timeStr.match(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/);

  if (match) {
    return {
      timeStart: match[1].replace(".", ":"),
      timeEnd: match[2].replace(".", ":"),
    };
  }

  return { timeStart: "", timeEnd: "" };
}

/**
 * Извлекает преподавателя из строки предмета
 */
function extractTeacher(subject: string | null): string | null {
  if (!subject) return null;

  // Ищем ФИО преподавателя (формат: "Иванов И.И." или "Иванов И. И." или "Иванова А.Б.")
  const teacherMatch = subject.match(/([А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.\s?[А-ЯЁ]\.?)/);

  if (teacherMatch) {
    return teacherMatch[1].trim();
  }

  return null;
}

/**
 * Безопасно получает строку из ячейки
 */
function getCellString(cell: string | number | null | undefined): string | null {
  if (cell === null || cell === undefined) return null;
  const str = String(cell).trim();
  return str === "" ? null : str;
}

/**
 * Получает список всех групп из Excel файла
 */
export function getGroupsFromExcel(buffer: Buffer): string[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const data: (string | number | null)[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
  });

  if (data.length === 0) return [];

  const groups = extractGroups(data[0]);
  return groups.map((g) => g.name);
}
