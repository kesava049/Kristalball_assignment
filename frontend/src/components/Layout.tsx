
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

const Layout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-950">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 p-6">
            <Outlet />
          </div>
        </main>
        <Toaster />
        <SonnerToaster />
      </div>
    </SidebarProvider>
  );
};

export default Layout;
