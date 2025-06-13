
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

const PurchasesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchases</h1>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <ShoppingCart className="h-4 w-4 mr-2" />
          New Purchase
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Purchase Records</CardTitle>
          <CardDescription className="text-slate-400">All purchase transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">Purchase records will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchasesPage;
