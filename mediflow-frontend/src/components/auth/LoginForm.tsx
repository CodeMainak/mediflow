import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Stethoscope, Heart, Shield, Activity } from 'lucide-react';
import { MedicalLogo } from '../ui/medical-logo';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  const demoCredentials = [
    { role: 'Admin', email: 'admin@mediflow.com', name: 'Admin User', icon: Shield, color: 'text-red-600' },
    { role: 'Doctor', email: 'gourab.das@gmail.com', name: 'Gourab Das', icon: Stethoscope, color: 'text-green-600' },
    { role: 'Patient', email: 'mainak.mondal33@gmail.com', name: 'Mainak Mondal', icon: Heart, color: 'text-emerald-600' },
    // { role: 'Receptionist', email: 'receptionist@mediflow.com', name: 'Lisa Wilson', icon: Activity, color: 'text-teal-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20">
          <Stethoscope className="h-32 w-32 text-green-600 rotate-12" />
        </div>
        <div className="absolute top-40 right-20">
          <Heart className="h-24 w-24 text-emerald-600 -rotate-12" />
        </div>
        <div className="absolute bottom-20 left-40">
          <Activity className="h-28 w-28 text-teal-600 rotate-45" />
        </div>
        <div className="absolute bottom-40 right-40">
          <Shield className="h-20 w-20 text-green-500 -rotate-45" />
        </div>
      </div>

      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-4 rounded-3xl shadow-2xl border-4 border-white">
                <MedicalLogo size="md" />
              </div>
            </div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent mb-2">
              MediFlow
            </h1>
            <div className="text-green-700 text-lg mb-2">
              <div className="flex items-center justify-center mb-1">
                <Shield className="h-5 w-5 mr-2" />
                Healthcare Management System
              </div>
              <div className="text-sm text-green-600">
                Advanced • Secure • Reliable
              </div>
            </div>
            <p className="text-green-600 text-sm">Trusted by healthcare professionals worldwide</p>
            <div className="flex justify-center space-x-4 mt-3 text-xs text-green-500">
              <span>ISO 27001 Certified</span>
              <span>•</span>
              <span>HIPAA Compliant</span>
              <span>•</span>
              <span>SOC 2 Type II</span>
            </div>
          </div>

          {/* Login Card */}
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-green-900 flex items-center justify-center">
                <Shield className="h-6 w-6 mr-2 text-green-600" />
                Sign In
              </CardTitle>
              <CardDescription className="text-green-700">
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-green-900 font-medium">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="pl-10 border-green-200 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Shield className="h-4 w-4 text-green-500" />
                    </div>
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
                      placeholder="Enter your password"
                      className="pl-10 border-green-200 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Activity className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading}

                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Heart className="mr-2 h-4 w-4" />
                      Sign In to MediFlow
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Demo Accounts Card */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl text-green-900 flex items-center justify-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                Demo Accounts
              </CardTitle>
              <CardDescription className="text-green-700">
                Click to use demo credentials (password: password123)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {demoCredentials.map((cred) => {
                const IconComponent = cred.icon;
                return (
                  <Button
                    key={cred.email}
                    variant="outline"
                    className="w-full justify-start hover:bg-green-50 border-green-200 p-4 h-auto group transition-all duration-200 hover:shadow-md"
                    onClick={() => {
                      setEmail(cred.email);
                      setPassword('Mainak@123');
                    }}
                  >
                    <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-2 rounded-lg mr-3 group-hover:from-green-200 group-hover:to-emerald-200 transition-all">
                      <IconComponent className={`h-5 w-5 ${cred.color}`} />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-green-900">{cred.role}: {cred.name}</div>
                      <div className="text-sm text-green-600">{cred.email}</div>
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 space-y-4">
            <div className="flex justify-center items-center space-x-6 text-green-600">
              <div className="flex items-center space-x-2">
                <Stethoscope className="h-4 w-4" />
                <span className="text-sm">Medical Care</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4" />
                <span className="text-sm">Patient Safety</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Secure Platform</span>
              </div>
            </div>
            <p className="text-green-600 text-sm">
              © 2024 MediFlow Healthcare Systems. All rights reserved.
            </p>
            <p className="text-green-500 text-xs">
              Empowering healthcare professionals with advanced technology
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};