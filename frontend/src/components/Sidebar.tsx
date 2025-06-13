
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, BarChart3, ShoppingCart, ArrowLeftRight, Users, TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: BarChart3,
    roles: ['Admin', 'Base Commander', 'Logistics Officer'],
  },
  {
    title: 'Purchases',
    url: '/purchases',
    icon: ShoppingCart,
    roles: ['Admin', 'Logistics Officer'],
  },
  {
    title: 'Transfers',
    url: '/transfers',
    icon: ArrowLeftRight,
    roles: ['Admin', 'Base Commander', 'Logistics Officer'],
  },
  {
    title: 'Assignments',
    url: '/assignments',
    icon: Users,
    roles: ['Admin', 'Base Commander', 'Logistics Officer'],
  },
  {
    title: 'Expenditures',
    url: '/expenditures',
    icon: TrendingDown,
    roles: ['Admin', 'Base Commander', 'Logistics Officer'],
  },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.some(role => hasRole(role))
  );

  return (
    <ShadcnSidebar className="border-r border-slate-800">
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-emerald-400" />
          <div>
            <h1 className="text-xl font-bold text-white">KristalBall</h1>
            <p className="text-sm text-slate-400">Asset Management</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 font-medium px-2">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="hover:bg-slate-800 hover:text-white data-[active=true]:bg-emerald-600 data-[active=true]:text-white"
                  >
                    <button
                      onClick={() => navigate(item.url)}
                      className="flex items-center space-x-3 w-full text-left"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-800">
        <div className="text-sm text-slate-400">
          <p className="font-medium text-white">{user?.fullName}</p>
          <p className="text-xs">{user?.roles.join(', ')}</p>
        </div>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
