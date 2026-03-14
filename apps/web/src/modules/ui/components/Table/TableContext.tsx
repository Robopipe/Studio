import { type Table } from "@tanstack/react-table";
import { createContext, useContext, type ReactNode } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TableContext = createContext<Table<any> | null>(null);

export function useTableContext<T>(): Table<T> {
  const table = useContext(TableContext);
  if (!table) {
    throw new Error("useTableContext must be used within a TableProvider");
  }
  return table as Table<T>;
}

interface TableProviderProps<T> {
  table: Table<T>;
  children: ReactNode;
}

export function TableProvider<T>({ table, children }: TableProviderProps<T>) {
  return (
    <TableContext.Provider value={table as Table<T>}>
      {children}
    </TableContext.Provider>
  );
}
