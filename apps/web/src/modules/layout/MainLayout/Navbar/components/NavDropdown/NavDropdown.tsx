import {
  AddLargeIcon,
  BoxIcon,
  CloseIcon,
  SearchIcon,
  Stack,
  Text,
} from "@repo/ui";
import clsx from "clsx";
import { ReactNode, useEffect, useRef, useState } from "react";
import styles from "./NavDropdown.module.scss";

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
  align?: "left" | "right";
}

const MAX_SEARCH_LENGTH = 14;

export const NavDropdown = ({
  label,
  title,
  items = [],
  activeItemId,
  placeholder = "Search...",
  itemIcon = <BoxIcon />,
  onCreate,
  createLabel = "Create",
  align = "left",
}: NavDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()),
  );

  const showCreateOption = onCreate && filteredItems.length === 0 && search.trim().length > 0;

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

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <div
        className={clsx(styles.navDropdown, isOpen && styles.active)}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Stack direction="row" align="center" gap={8}>
          <Text variant="text-14" weight="500" color="text-white-primary">
            {label}
          </Text>
          <span className={clsx(styles.chevron, isOpen && styles.open)} />
        </Stack>
      </div>

      {isOpen && (
        <div className={clsx(styles.dropdownMenu, align === "right" && styles.alignRight)}>
          <Stack direction="row" align="center" justify="space-between" className={styles.menuHeader}>
            <Text variant="text-14" weight="600" color="text-white-primary">{title}</Text>
            <Stack direction="row" align="center" gap={12}>
              {onCreate && (
                <button className={styles.actionBtn} onClick={() => handleCreate()}>
                  <AddLargeIcon />
                </button>
              )}
              <button className={styles.actionBtn} onClick={() => setIsOpen(false)}>
                <CloseIcon />
              </button>
            </Stack>
          </Stack>

          <div className={styles.searchContainer}>
            <SearchIcon className={styles.searchIcon} />
            <input
              autoFocus
              className={styles.searchInput}
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && showCreateOption && handleCreate()}
            />
          </div>

          <div className={styles.itemsList}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={clsx(
                    styles.dropdownItem,
                    activeItemId !== undefined && item.id === activeItemId && styles.activeItem,
                  )}
                  onClick={() => {
                    item.onClick?.();
                    setIsOpen(false);
                  }}
                >
                  <Stack direction="row" align="center" gap={10}>
                    {itemIcon}
                    <Text variant="text-14">{item.label}</Text>
                  </Stack>
                </div>
              ))
            ) : (
              <div className={styles.noResults}>
                <Text variant="text-14" color="gray-500">No results found</Text>
              </div>
            )}
          </div>

          {showCreateOption && (
            <div className={styles.createFooter} onClick={handleCreate}>
              <Stack direction="row" align="center" justify="space-between">
                <Stack direction="row" align="center" gap={8}>
                  <div className={styles.createIcon}>
                     <AddLargeIcon width={14} height={14} />
                  </div>
                  <Text variant="text-14" weight="500">
                    {createLabel} "{getDisplaySearch()}"
                  </Text>
                </Stack>
                <div className={styles.enterBadge}>
                  <Text variant="text-10">Enter</Text>
                </div>
              </Stack>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
