import { twMerge } from "tailwind-merge";
import type { LucideIcon } from "lucide-react";

interface TabsProps {
    tabs: { id: string; label: string; icon?: LucideIcon }[];
    activeTab: string;
    onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
    return (
        <div className="border-b border-slate-200 mb-6 transition-colors dark:border-slate-700">
            <div className="flex space-x-8">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={twMerge(
                            "py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2",
                            activeTab === tab.id
                                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600"
                        )}
                    >
                        {tab.icon && <tab.icon size={18} />}
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
