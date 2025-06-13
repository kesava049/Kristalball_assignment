
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <AlertTriangle className="h-16 w-16 text-amber-400 mb-6" />
      <h1 className="text-3xl font-bold text-white mb-2">404 - Page Not Found</h1>
      <p className="text-slate-400 mb-8">The page you are looking for does not exist.</p>
      <Button onClick={() => navigate('/dashboard')} className="bg-emerald-600 hover:bg-emerald-700">
        Return to Dashboard
      </Button>
    </div>
  );
};

export default NotFoundPage;
