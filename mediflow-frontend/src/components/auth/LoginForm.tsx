import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { useAuth } from '../../context/AuthContext';
import { useSlowLoad } from '../../hooks/useSlowLoad';
import { Loader2, Mail, Lock, ChevronDown } from 'lucide-react';
import { MedicalLogo } from '../ui/medical-logo';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const { login, isLoading } = useAuth();
  const isSlow = useSlowLoad(isLoading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  const demoCredentials = [
    { role: 'Admin', email: 'admin@mediflow.com', password: 'password123' },
    { role: 'Doctor', email: 'dr.smith@mediflow.com', password: 'password123' },
    { role: 'Patient', email: 'jane.doe@email.com', password: 'password123' },
    { role: 'Receptionist', email: 'receptionist@mediflow.com', password: 'password123' },
    { role: 'Pharmacist', email: 'pharmacist@mediflow.com', password: 'password123' },
  ];

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center p-4 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-100 opacity-50 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-green-100 opacity-40 blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex mb-6 shadow-md rounded-2xl">
            <MedicalLogo size="lg" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
            Welcome back
          </h1>
          <p className="text-gray-500 text-sm">Sign in to your MediFlow account</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl text-gray-900">Sign In</CardTitle>
            <CardDescription>Enter your email and password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                  <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                  <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 hover:-translate-y-0.5 text-white font-semibold py-3 shadow-md shadow-green-600/10 transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              {isSlow && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertDescription className="text-amber-800 text-xs">
                    Still working — this app runs on free hosting, so the server may be waking up
                    from sleep. This can take up to a minute on the first try.
                  </AlertDescription>
                </Alert>
              )}
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              New patient?{' '}
              <Link to="/signup" className="font-semibold text-green-700 hover:underline">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>

        <Collapsible open={showDemo} onOpenChange={setShowDemo} className="mt-4">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 py-2 transition-colors"
            >
              Reviewing this project? View demo credentials
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDemo ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="border border-gray-100 shadow-sm mt-1">
              <CardContent className="py-4 space-y-1.5">
                {demoCredentials.map((cred) => (
                  <button
                    key={cred.email}
                    type="button"
                    className="w-full flex items-center justify-between text-left text-xs px-3 py-2 rounded-lg hover:bg-green-50 transition-colors"
                    onClick={() => {
                      setEmail(cred.email);
                      setPassword(cred.password);
                    }}
                  >
                    <span className="font-medium text-gray-700">{cred.role}</span>
                    <span className="text-green-700">{cred.email}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};
