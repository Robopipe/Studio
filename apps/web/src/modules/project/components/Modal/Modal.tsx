import { cn } from "@/lib/utils";
import { ReactNode, useState } from "react";

export interface ModalTab {
  id: string;
  label: string;
  content: ReactNode;
}

export interface ModalProps {
  title: string;
  tabs: ModalTab[];
  buttons?: ReactNode;
  closeButton: boolean;
  onClose: () => void;
}

export const Modal = ({
  title,
  tabs,
  buttons,
  closeButton,
  onClose,
}: ModalProps) => {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-10"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[calc(100vh-5rem)] min-h-[45rem] w-full max-w-[1472px] flex-col overflow-hidden rounded-3xl bg-white">
        <header className="flex items-center justify-between border-b border-gray-400 px-10 py-6">
          <h4 className="text-2xl font-bold tracking-tight">{title}</h4>

          <div className="flex flex-row items-center gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={cn(
                  "relative cursor-pointer border-none bg-none px-0 py-2 text-lg font-semibold text-gray-500",
                  activeTabId === tab.id &&
                    "text-emerald-600 after:absolute after:-bottom-[25px] after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600 after:content-['']"
                )}
                onClick={() => setActiveTabId(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-row items-center gap-3">
            {buttons}
            {closeButton && (
              <button
                type="button"
                className="cursor-pointer border-none bg-none p-1 text-2xl leading-none text-gray-400 hover:text-gray-900"
                onClick={onClose}
              >
                ×
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-[200px] py-[60px]">
          {activeTab?.content}
        </div>
      </div>
    </div>
  );
};
