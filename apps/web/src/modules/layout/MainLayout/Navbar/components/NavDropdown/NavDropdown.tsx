import { useEffect, useRef, useState } from "react";
import { AddLargeIcon, BoxIcon, CloseIcon, SearchIcon, Stack, Text } from "@repo/ui";
import clsx from "clsx";
import styles from "./NavDropdown.module.scss";

interface NavDropdownProps {
  label: string;
  items?: { label: string; onClick?: () => void }[];
}

export const NavDropdown = ({ label, items = [] }: NavDropdownProps) => {
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

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <div
        className={clsx(styles.navDropdown, isOpen && styles.active)}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Stack direction="row" align="center" gap={8}>
          <Text variant="text-14" weight="500" color="text-white-primary">{label}</Text>
          <span className={clsx(styles.chevron, isOpen && styles.open)} />
        </Stack>
      </div>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <Stack direction="row" align="center" justify="space-between" className={styles.menuHeader}>
            <Text variant="text-14" weight="600" color='text-white-primary'>PROJECTS</Text>
            <Stack direction="row" align="center" gap={12}>
              <button className={styles.actionBtn} aria-label="Create project"><AddLargeIcon /></button>
              <button className={styles.actionBtn} onClick={() => setIsOpen(false)}><CloseIcon /></button>
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
            />
          </div>

          <div className={styles.itemsList}>
            {filteredItems.map((item) => (
              <div
                key={item.label}
                className={styles.dropdownItem}
                onClick={() => { item.onClick?.(); setIsOpen(false); }}
              >
                <Stack direction="row" align="center" gap={10}>
                  <BoxIcon />
                  <Text variant="text-14">{item.label}</Text>
                </Stack>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};