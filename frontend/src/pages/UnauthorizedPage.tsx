
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <ShieldAlert className="h-16 w-16 text-red-500 mb-6" />
      <h1 className="text-3xl font-bold text-white mb-2">401 - Unauthorized</h1>
      <p className="text-slate-400 mb-8">You don't have permission to access this page.</p>
      <Button onClick={() => navigate('/dashboard')} className="bg-emerald-600 hover:bg-emerald-700">
        Return to Dashboard
      </Button>
    </div>
  );
};

export default UnauthorizedPage;
