import { CreateProjectModal } from "@/modules/project/components/CreateProjectModal";
import {
  AddLargeIcon,
  BoxIcon,
  CloseIcon,
  SearchIcon,
  Stack,
  Text,
} from "@repo/ui";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import styles from "./NavDropdown.module.scss";

interface NavDropdownProps {
  label: string;
  items?: { label: string; onClick?: () => void }[];
}

const MAX_SEARCH_LENGTH = 14;

export const NavDropdown = ({ label, items = [] }: NavDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const showCreateOption = filteredItems.length === 0 && search.trim().length > 0;

  const getDisplaySearch = () => {
    if (search.length <= MAX_SEARCH_LENGTH) return search;
    return `${search.substring(0, MAX_SEARCH_LENGTH)}...`;
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
        <div className={styles.dropdownMenu}>
          <Stack direction="row" align="center" justify="space-between" className={styles.menuHeader}>
            <Text variant="text-14" weight="600" color="text-white-primary">PROJECTS</Text>
            <Stack direction="row" align="center" gap={12}>
              <button className={styles.actionBtn} onClick={() => setIsModalOpen(true)}>
                <AddLargeIcon />
              </button>
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
              placeholder="Search or create projects"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && showCreateOption && setIsModalOpen(true)}
            />
          </div>

          <div className={styles.itemsList}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.label}
                  className={styles.dropdownItem}
                  onClick={() => {
                    item.onClick?.();
                    setIsOpen(false);
                  }}
                >
                  <Stack direction="row" align="center" gap={10}>
                    <BoxIcon />
                    <Text variant="text-14">{item.label}</Text>
                  </Stack>
                </div>
              ))
            ) : (
              <div className={styles.noResults}>
                <Text variant="text-14" color="gray-500">No project found</Text>
              </div>
            )}
          </div>

          {showCreateOption && (
            <div className={styles.createFooter} onClick={() => setIsModalOpen(true)}>
              <Stack direction="row" align="center" justify="space-between">
                <Stack direction="row" align="center" gap={8}>
                  <div className={styles.createIcon}>
                     <AddLargeIcon width={14} height={14} />
                  </div>
                  <Text variant="text-14" weight="500">
                    Create "{getDisplaySearch()}"
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
      
      {isModalOpen && (
        <CreateProjectModal 
          onClose={() => setIsModalOpen(false)} 
          initialName={search}
        />
      )}
    </div>
  );
};