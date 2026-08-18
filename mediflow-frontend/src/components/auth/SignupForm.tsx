import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from '../../context/AuthContext';
import { useSlowLoad } from '../../hooks/useSlowLoad';
import { Loader2, User, Mail, Phone, Lock } from 'lucide-react';
import { MedicalLogo } from '../ui/medical-logo';

export const SignupForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup, isLoading } = useAuth();
  const isSlow = useSlowLoad(isLoading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signup({ name, email, phone, password });
    if (!result.success) {
      setError(result.error || 'Could not create account. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center p-4 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-100 opacity-50 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-green-100 opacity-40 blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex mb-6 shadow-md rounded-2xl">
            <MedicalLogo size="lg" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
            Create your account
          </h1>
          <p className="text-gray-500 text-sm">
            Book appointments and manage your care in a few minutes.
          </p>
        </div>

        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl text-gray-900">Patient Sign Up</CardTitle>
            <CardDescription>Free — no paperwork, no waiting room</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                  <User className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

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
                <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="For appointment reminders"
                    className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                  />
                  <Phone className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                    placeholder="At least 6 characters"
                    className="pl-10 border-gray-200 focus:border-green-500 focus:ring-green-500"
                    minLength={6}
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
                    Creating your account...
                  </>
                ) : (
                  'Create Account'
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
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-green-700 hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          Hospital staff? <Link to="/login" className="underline hover:text-gray-600">Sign in here</Link> instead.
        </p>
      </div>
    </div>
  );
};
