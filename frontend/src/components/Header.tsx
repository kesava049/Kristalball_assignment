
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '../context/AuthContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { BellIcon, LogOut, Settings, User } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <SidebarTrigger 
            className="border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white mr-2" 
          />
          <h2 className="text-sm font-medium text-slate-300 hidden sm:block">
            Military Asset Management System
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <BellIcon className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-emerald-700 flex items-center justify-center text-white mr-2">
                    {user?.fullName.charAt(0)}
                  </div>
                  <div className="hidden md:block text-left mr-2">
                    <p className="text-sm font-medium text-slate-200">{user?.fullName}</p>
                    <p className="text-xs text-slate-400">{user?.roles[0]}</p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900 border-slate-800 text-slate-300" align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem className="hover:bg-slate-800 hover:text-white cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-slate-800 hover:text-white cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem 
                className="hover:bg-red-900 hover:text-white cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
