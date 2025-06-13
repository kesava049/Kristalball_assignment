
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingDown } from 'lucide-react';

const ExpendituresPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenditures</h1>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <TrendingDown className="h-4 w-4 mr-2" />
          New Expenditure
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Expenditure Records</CardTitle>
          <CardDescription className="text-slate-400">All asset expenditure records</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">Expenditure records will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpendituresPage;
