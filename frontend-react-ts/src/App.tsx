import { FC } from 'react';
import AppRoutes from './routes';
import { Link, useLocation } from "react-router";
import { useAuthUser } from './hooks/auth/useAuthUser';
import { useLogout } from './hooks/auth/useLogout';
import { GraduationCap, LogOut } from 'lucide-react';
import { Toaster } from "@/components/ui/sonner";

const App: FC = () => {
  const location = useLocation();
  const user = useAuthUser();
  const logout = useLogout();

  const isExamPage = location.pathname.match(/^\/peserta\/exams\/\d+\/take$/);
  const isLoginPage = location.pathname === '/login';
  const isAdminPage = location.pathname.startsWith('/admin');
  const showNavbar = !isExamPage && !isLoginPage && !isAdminPage;
  const homePath = user?.role === 'admin' ? '/admin/dashboard' : '/peserta/exams';

  return (
    <div className="min-h-screen bg-background">
      {showNavbar && (
        <nav className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link to={homePath} className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
                <GraduationCap className="size-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">
                CBT<span className="text-brand-gradient"> Exam</span>
              </span>
            </Link>
            {user && (
              <div className="flex items-center gap-3">
                <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

      <AppRoutes />
      <Toaster richColors position="top-right" />
    </div>
  )
}

export default App;