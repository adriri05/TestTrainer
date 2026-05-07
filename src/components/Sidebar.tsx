"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Upload, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tests", label: "Mis Tests", icon: BookOpen },
  { href: "/upload", label: "Nuevo Test", icon: Upload },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-indigo-400">🧠 TestTrainer</h1>
        <p className="text-xs text-slate-400 mt-1">Aprende con IA</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-indigo-600 text-white"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
