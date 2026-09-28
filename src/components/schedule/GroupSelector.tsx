"use client";

import { useState, useEffect } from "react";

interface Group {
  id: string;
  name: string;
}

interface GroupSelectorProps {
  selectedGroupId: string | null;
  onSelect: (groupId: string, groupName: string) => void;
}

export function GroupSelector({ selectedGroupId, onSelect }: GroupSelectorProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await fetch("/api/groups");
      const data = await response.json();
      if (data.success) {
        setGroups(data.data);
      }
    } catch (error) {
      console.error("Ошибка загрузки групп:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-left"
      >
        <span className={selectedGroup ? "text-gray-900" : "text-gray-500"}>
          {selectedGroup ? selectedGroup.name : "Выберите группу"}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay для закрытия */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-hidden">
            {/* Поиск */}
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="Поиск группы..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            </div>

            {/* Список групп */}
            <div className="max-h-60 overflow-y-auto">
              {filteredGroups.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Группы не найдены
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => {
                      onSelect(group.id, group.name);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                      selectedGroupId === group.id
                        ? "bg-primary-50 text-primary-700 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {group.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
