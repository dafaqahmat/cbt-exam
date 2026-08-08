import { NavLink } from "react-router";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  FileText,
  Tags,
  UserCog,
  LogOut,
} from "lucide-react";
import { useAuthUser } from "@/hooks/auth/useAuthUser";
import { useLogout } from "@/hooks/auth/useLogout";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/categories", label: "Kelola Kategori", icon: Tags },
  { to: "/admin/users", label: "Kelola Peserta", icon: Users },
  { to: "/admin/exams", label: "Kelola Ujian", icon: FileText },
];

export default function SidebarMenu() {
  const user = useAuthUser();
  const logout = useLogout();

  return (
    <aside className="sticky top-0 z-40 bg-sidebar text-sidebar-foreground md:fixed md:inset-y-0 md:left-0 md:flex md:w-72 md:flex-col md:z-0">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
          <GraduationCap className="size-6" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold">CBT Exam</p>
          <p className="text-xs text-sidebar-foreground/70">Panel Admin</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 py-3 md:flex-1 md:flex-col md:overflow-visible md:pt-5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <item.icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <NavLink
          to="/admin/profile"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )
          }
        >
          <UserCog className="size-4 shrink-0" />
          <span>Edit Profil</span>
        </NavLink>
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4 md:mt-auto">
        <div className="mb-2 truncate px-3 text-xs text-sidebar-foreground/70">
          {user?.name}
        </div>
        <div className="flex gap-2 md:flex-col">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:w-full"
          >
            <LogOut className="size-4" /> Keluar
          </button>
        </div>
      </div>
    </aside>
  );
}