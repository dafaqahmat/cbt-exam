import type { ReactNode } from "react";
import SidebarMenu from "./SidebarMenu";
import PageHeader from "../common/PageHeader";

interface AdminLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function AdminLayout({ title, description, actions, children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/40">
      <SidebarMenu />
      <main className="md:ml-72">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
          <PageHeader title={title} description={description} actions={actions} />
          {children}
        </div>
      </main>
    </div>
  );
}