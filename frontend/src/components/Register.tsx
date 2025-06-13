
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Shield, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authAPI } from '../api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName
      });

      setSuccess('Account created successfully. You can now login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="h-12 w-12 text-emerald-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">KristalBall</h1>
              <p className="text-slate-400">Military Asset Management</p>
            </div>
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Create Account</CardTitle>
            <CardDescription className="text-slate-400">
              Register to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="bg-emerald-900 border-emerald-800 text-white">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isLoading}
              >
                {isLoading ? 'Registering...' : 'Register'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-800 pt-4">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;
