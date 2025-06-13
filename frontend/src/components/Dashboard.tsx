
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CalendarIcon, ArrowUpFromLine, ArrowDownToLine, TruckIcon, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { dashboardAPI, assetAPI } from '../api';
import { DashboardMetrics, FilterParams } from '../types';
import { format, subDays } from 'date-fns';

const Dashboard = () => {
  const [filters, setFilters] = useState<FilterParams>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  // Fetch bases and equipment types
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const basesData = await assetAPI.getBases();
        const typesData = await assetAPI.getEquipmentTypes();
        setBases(basesData);
        setEquipmentTypes(typesData);
      } catch (error) {
        console.error('Failed to fetch filter data:', error);
      }
    };

    fetchFilters();
  }, []);

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics', filters],
    queryFn: () => dashboardAPI.getMetrics(filters),
    select: (data) => data as DashboardMetrics
  });

  // Sample chart data - in a real app, this would come from an API
  const assetMovementData = [
    { date: 'Jan', purchases: 65, transfersIn: 30, transfersOut: 45 },
    { date: 'Feb', purchases: 59, transfersIn: 25, transfersOut: 40 },
    { date: 'Mar', purchases: 80, transfersIn: 40, transfersOut: 35 },
    { date: 'Apr', purchases: 81, transfersIn: 35, transfersOut: 30 },
    { date: 'May', purchases: 56, transfersIn: 20, transfersOut: 45 },
    { date: 'Jun', purchases: 55, transfersIn: 25, transfersOut: 50 },
  ];

  const statusData = [
    { name: 'Operational', value: 65 },
    { name: 'Maintenance', value: 15 },
    { name: 'Damaged', value: 10 },
    { name: 'In Transit', value: 10 },
  ];

  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setFilters({
      ...filters,
      startDate: format(range.from, 'yyyy-MM-dd'),
      endDate: format(range.to, 'yyyy-MM-dd'),
    });
  };

  const handleBaseChange = (value: string) => {
    setFilters({ ...filters, baseId: value === 'all' ? undefined : value });
  };

  const handleTypeChange = (value: string) => {
    setFilters({ ...filters, equipmentTypeId: value === 'all' ? undefined : value });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <DateRangePicker 
            className="w-full sm:w-auto"
            onUpdate={handleDateRangeChange}
            initialDateFrom={new Date(filters.startDate || '')}
            initialDateTo={new Date(filters.endDate || '')}
          />
          
          <Select onValueChange={handleBaseChange} defaultValue="all">
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select Base" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bases</SelectItem>
              {bases.map((base: any) => (
                <SelectItem key={base.id} value={base.id}>
                  {base.baseName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select onValueChange={handleTypeChange} defaultValue="all">
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Equipment Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {equipmentTypes.map((type: any) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.typeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Opening Balance</CardDescription>
            <CardTitle className="text-white text-2xl">
              {isLoading ? '...' : metrics?.openingBalance || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-slate-500 flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {filters.startDate}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Closing Balance</CardDescription>
            <CardTitle className="text-white text-2xl">
              {isLoading ? '...' : metrics?.closingBalance || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-slate-500 flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {filters.endDate}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Net Movement</CardDescription>
            <CardTitle className={`text-2xl ${metrics?.netMovement && metrics.netMovement > 0 
              ? 'text-emerald-400' 
              : metrics?.netMovement && metrics.netMovement < 0 
                ? 'text-red-400' 
                : 'text-white'}`}>
              {isLoading ? '...' : metrics?.netMovement || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs flex items-center space-x-2">
              <span className="text-emerald-400 flex items-center">
                <ArrowUpFromLine className="h-3 w-3 mr-1" />
                In: {isLoading ? '...' : metrics?.transfersIn || 0}
              </span>
              <span className="text-red-400 flex items-center">
                <ArrowDownToLine className="h-3 w-3 mr-1" />
                Out: {isLoading ? '...' : metrics?.transfersOut || 0}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Assigned Assets</CardDescription>
            <CardTitle className="text-white text-2xl">
              {isLoading ? '...' : metrics?.assignedAssets || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-orange-400 flex items-center">
              <TruckIcon className="h-3 w-3 mr-1" />
              Expended: {isLoading ? '...' : metrics?.expendedAssets || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Asset Movement</CardTitle>
            <CardDescription className="text-slate-400">Purchases and transfers over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={assetMovementData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTransfersIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTransfersOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                  />
                  <Area type="monotone" dataKey="purchases" stroke="#10b981" fillOpacity={1} fill="url(#colorPurchases)" />
                  <Area type="monotone" dataKey="transfersIn" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTransfersIn)" />
                  <Area type="monotone" dataKey="transfersOut" stroke="#ef4444" fillOpacity={1} fill="url(#colorTransfersOut)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Asset Status</CardTitle>
            <CardDescription className="text-slate-400">Current operational status of assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription className="text-slate-400">Latest transactions and movements</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <BarChart3 className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* These would be populated from actual API data */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center">
                <div className="bg-emerald-900 p-2 rounded-md mr-3">
                  <ArrowUpFromLine className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">New Purchase Recorded</p>
                  <p className="text-xs text-slate-400">20 units of M4 Carbine</p>
                </div>
              </div>
              <div className="text-xs text-slate-500">2 hours ago</div>
            </div>
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center">
                <div className="bg-blue-900 p-2 rounded-md mr-3">
                  <TruckIcon className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Asset Transfer Initiated</p>
                  <p className="text-xs text-slate-400">5 vehicles from Alpha to Bravo Base</p>
                </div>
              </div>
              <div className="text-xs text-slate-500">Yesterday</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-orange-900 p-2 rounded-md mr-3">
                  <ArrowDownToLine className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Expenditure Reported</p>
                  <p className="text-xs text-slate-400">1000 rounds of 5.56mm ammunition</p>
                </div>
              </div>
              <div className="text-xs text-slate-500">2 days ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
