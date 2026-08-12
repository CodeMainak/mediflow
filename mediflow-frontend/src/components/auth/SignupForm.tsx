import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from '../../context/AuthContext';
import { Loader2, User, Mail, Phone, Lock } from 'lucide-react';
import { MedicalLogo } from '../ui/medical-logo';

export const SignupForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signup({ name, email, phone, password });
    if (!result.success) {
      setError(result.error || 'Could not create account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex mb-6">
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-4 rounded-3xl shadow-xl border-4 border-white">
              <MedicalLogo size="md" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent mb-1">
            Create your account
          </h1>
          <p className="text-green-700 text-sm">
            Book appointments and manage your care in a few minutes.
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl text-green-900">Patient Sign Up</CardTitle>
            <CardDescription>Free — no paperwork, no waiting room</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-green-900 font-medium">Full Name</Label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="pl-10 border-green-200 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                  <User className="h-4 w-4 text-green-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-green-900 font-medium">Email Address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10 border-green-200 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                  <Mail className="h-4 w-4 text-green-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-green-900 font-medium">Phone Number</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="For appointment reminders"
                    className="pl-10 border-green-200 focus:border-green-500 focus:ring-green-500"
                  />
                  <Phone className="h-4 w-4 text-green-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-green-900 font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="pl-10 border-green-200 focus:border-green-500 focus:ring-green-500"
                    minLength={6}
                    required
                  />
                  <Lock className="h-4 w-4 text-green-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 shadow-lg"
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
            </form>

            <p className="text-center text-sm text-green-700 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-green-800 hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-green-600 mt-6">
          Hospital staff? <Link to="/login" className="underline">Sign in here</Link> instead.
        </p>
      </div>
    </div>
  );
};
