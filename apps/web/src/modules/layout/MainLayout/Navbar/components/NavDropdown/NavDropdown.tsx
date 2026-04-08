import { cn } from "@/lib/utils";
import { Box, Plus, Search, Settings, X } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

export interface NavDropdownItem {
  id: string | number;
  label: string;
  onClick?: () => void;
}

interface NavDropdownProps {
  label: string;
  title: string;
  items?: NavDropdownItem[];
  activeItemId?: string | number;
  placeholder?: string;
  itemIcon?: ReactNode;
  onCreate?: (name: string) => void;
  createLabel?: string;
  onSettingsClick?: () => void;
  align?: "left" | "right";
  maxLabelWidth?: number;
}

const MAX_SEARCH_LENGTH = 14;

export const NavDropdown = ({
  label,
  title,
  items = [],
  activeItemId,
  placeholder = "Search...",
  itemIcon = <Box />,
  onCreate,
  createLabel = "Create",
  onSettingsClick,
  align = "left",
  maxLabelWidth,
}: NavDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = () => {
    setIsOpen(false);
    setSearch("");
    setIsCreating(false);
    setCreateName("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()),
  );

  const showCreateOption =
    onCreate && filteredItems.length === 0 && search.trim().length > 0;

  const getDisplaySearch = () => {
    if (search.length <= MAX_SEARCH_LENGTH) return search;
    return `${search.substring(0, MAX_SEARCH_LENGTH)}...`;
  };

  const handleCreate = () => {
    if (onCreate && search.trim()) {
      onCreate(search.trim());
      setSearch("");
    }
  };

  const handleCreateFromForm = () => {
    if (onCreate && createName.trim()) {
      onCreate(createName.trim());
      setCreateName("");
      setIsCreating(false);
      closeDropdown();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={cn(
          "cursor-pointer rounded-md px-2 py-1.5 transition-all hover:bg-white/5",
          isOpen && "bg-white/5"
        )}
        onClick={() => (isOpen ? closeDropdown() : setIsOpen(true))}
      >
        <div className="flex flex-row items-center gap-2">
          <span
            className="block text-sm font-medium text-white/90"
            style={
              maxLabelWidth
                ? {
                    maxWidth: maxLabelWidth,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }
                : undefined
            }
          >
            {label}
          </span>
          <span
            className={cn(
              "ml-1 h-[0.45rem] w-[0.45rem] rotate-[-45deg] border-b-[1.5px] border-r-[1.5px] border-gray-400 transition-transform",
              isOpen && "-mt-1 rotate-[135deg]"
            )}
          />
        </div>
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute top-[calc(100%+8px)] z-[1000] w-[360px] rounded-xl border border-gray-800 bg-[#1c1c1f] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="flex flex-row items-center justify-between px-2 pb-3 pt-1">
            <span className="text-sm font-semibold text-white/90">{title}</span>
            <div className="flex flex-row items-center gap-3">
              {onCreate && (
                <button
                  type="button"
                  className="flex cursor-pointer border-none bg-transparent p-0.5 text-gray-400 transition-colors hover:text-white"
                  onClick={() => setIsCreating(!isCreating)}
                >
                  <Plus className="size-4" />
                </button>
              )}
              {onSettingsClick && (
                <button
                  type="button"
                  className="flex cursor-pointer border-none bg-transparent p-0.5 text-gray-400 transition-colors hover:text-white"
                  onClick={() => {
                    onSettingsClick();
                    closeDropdown();
                  }}
                >
                  <Settings className="size-4" />
                </button>
              )}
              <button
                type="button"
                className="flex cursor-pointer border-none bg-transparent p-0.5 text-gray-400 transition-colors hover:text-white"
                onClick={closeDropdown}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {isCreating && (
            <div className="mb-2 flex items-center gap-2 rounded-md border border-gray-800 bg-white/[0.03] pr-2">
              <input
                autoFocus
                placeholder="Organization name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleCreateFromForm()
                }
                className="min-w-0 flex-1 border-none bg-transparent px-2.5 py-2 text-sm text-white outline-none placeholder:text-gray-600"
              />
              <button
                type="button"
                className="cursor-pointer whitespace-nowrap rounded border-none bg-emerald-500 px-3 py-1 text-xs font-semibold text-gray-900 transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-40"
                onClick={handleCreateFromForm}
                disabled={!createName.trim()}
              >
                {createLabel}
              </button>
            </div>
          )}

          <div className="mb-2 flex items-center rounded-md border border-gray-800 bg-white/[0.03] px-2.5">
            <Search className="size-4 text-gray-500" />
            <input
              autoFocus={!isCreating}
              className="w-full border-none bg-transparent p-2 text-sm text-white outline-none placeholder:text-gray-600"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && showCreateOption && handleCreate()
              }
            />
          </div>

          <div className="max-h-[200px] overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-[10px] [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar]:w-1">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "cursor-pointer rounded-lg px-3 py-2.5 text-gray-300 transition-all hover:bg-white/5 hover:text-emerald-400 [&_svg]:size-4",
                    activeItemId !== undefined &&
                      item.id === activeItemId &&
                      "bg-emerald-500/10 text-emerald-400"
                  )}
                  onClick={() => {
                    item.onClick?.();
                    closeDropdown();
                  }}
                >
                  <div className="flex flex-row items-center gap-2.5">
                    {itemIcon}
                    <span className="text-sm">{item.label}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center p-6 text-gray-400">
                <span className="text-sm">No results found</span>
              </div>
            )}
          </div>

          {showCreateOption && (
            <div
              className="m-3 cursor-pointer rounded-xl bg-emerald-500/10 px-4 py-2.5 transition-opacity hover:opacity-90"
              onClick={handleCreate}
            >
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center gap-2">
                  <div className="m-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 p-0.5 text-gray-900">
                    <Plus className="size-3.5" />
                  </div>
                  <span className="text-sm font-medium text-emerald-400">
                    {createLabel} "{getDisplaySearch()}"
                  </span>
                </div>
                <div className="rounded-lg border border-black/5 bg-emerald-500 px-2.5 py-1">
                  <span className="text-xs font-semibold text-gray-900">
                    Enter
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
