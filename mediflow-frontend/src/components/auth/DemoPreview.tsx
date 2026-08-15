import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { MedicalLogo } from '../ui/medical-logo';
import { SymptomTriageFlow } from '../shared/SymptomTriageFlow';
import { demoTriage, DemoTriageResult } from '../../utils/demoTriage';
import {
  CalendarDays,
  Pill,
  FileText,
  MessageCircle,
  Clock,
  Stethoscope,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

const URGENCY_STYLES: Record<DemoTriageResult['urgency'], string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  emergency: 'bg-red-600 text-white border-red-600',
};

const URGENCY_LABEL: Record<DemoTriageResult['urgency'], string> = {
  low: 'Low urgency',
  medium: 'Medium urgency',
  high: 'High urgency',
  emergency: 'Emergency',
};

const DemoSymptomChecker: React.FC = () => {
  return (
    <Card className="border border-gray-100 shadow-sm mb-8">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-green-600" />
          <h2 className="font-semibold text-gray-900">Try it: AI Symptom Checker</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Describe how you're feeling — this runs instantly, right in your browser, no account needed.
        </p>

        <SymptomTriageFlow<DemoTriageResult>
          onSubmit={(answers) => demoTriage(answers)}
          renderResult={(result, reset) => (
            <div className="pt-5 border-t border-gray-100 space-y-3">
              {result.urgency === 'emergency' ? (
                <Alert className="border-red-300 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <span className="font-semibold">This needs immediate attention.</span> {result.reasoning}{' '}
                    Please contact emergency services rather than booking a routine appointment.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={URGENCY_STYLES[result.urgency]}>{URGENCY_LABEL[result.urgency]}</Badge>
                    <Badge variant="outline" className="border-gray-200 text-gray-700">
                      {result.specialization}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700">{result.reasoning}</p>
                  {result.doctors.map((d) => (
                    <div key={d.name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="bg-white p-2 rounded-lg border border-gray-100">
                        <Stethoscope className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{d.name}</div>
                        <div className="text-xs text-gray-500">{d.specialization}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Sample logic for this preview — the real app can also call OpenAI for richer triage.
                </p>
                <Button size="sm" variant="ghost" className="text-gray-500 shrink-0" onClick={reset}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Start over
                </Button>
              </div>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
};

const stats = [
  { label: 'Upcoming Appointments', value: '2', icon: CalendarDays },
  { label: 'Active Prescriptions', value: '3', icon: Pill },
  { label: 'Unread Messages', value: '1', icon: MessageCircle },
];

const appointments = [
  { doctor: 'Dr. Sarah Chen', specialty: 'Cardiology', date: 'Fri, Aug 15', time: '10:30 AM', status: 'Confirmed' },
  { doctor: 'Dr. John Smith', specialty: 'General Physician', date: 'Wed, Aug 20', time: '4:00 PM', status: 'Pending' },
];

const prescriptions = [
  { name: 'Atorvastatin', dosage: '10mg — once daily', prescribedBy: 'Dr. Sarah Chen' },
  { name: 'Metformin', dosage: '500mg — twice daily', prescribedBy: 'Dr. John Smith' },
  { name: 'Vitamin D3', dosage: '1000 IU — once daily', prescribedBy: 'Dr. John Smith' },
];

export const DemoPreview: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-100 opacity-40 blur-3xl" />

      {/* Nav */}
      <nav className="relative max-w-5xl mx-auto flex items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-2 rounded-xl shadow-sm">
            <MedicalLogo size="sm" />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">MediFlow</span>
        </Link>
        <Link to="/signup">
          <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
            Create your free account
          </Button>
        </Link>
      </nav>

      <div className="relative max-w-5xl mx-auto px-6 pb-16">
        {/* Banner */}
        <div className="animate-fade-in-up flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl px-5 py-3.5 mb-8">
          <Sparkles className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800">
            <span className="font-semibold">You're viewing a live preview with sample data.</span>{' '}
            No sign-in required — this loads instantly, nothing here talks to a server.
          </p>
        </div>

        {/* Greeting */}
        <div className="animate-fade-in-up delay-1 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back, Jane</h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening with your care.</p>
        </div>

        <div className="animate-fade-in-up delay-2">
          <DemoSymptomChecker />
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.label}
                className={`border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all animate-fade-in-up delay-${Math.min(i + 2, 4)}`}
              >
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Appointments */}
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="h-5 w-5 text-green-700" />
                <h2 className="font-semibold text-gray-900">Upcoming Appointments</h2>
              </div>
              <div className="space-y-3">
                {appointments.map((a) => (
                  <div key={a.doctor} className="flex items-start justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-green-200 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="bg-white p-2 rounded-lg border border-gray-100">
                        <Stethoscope className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{a.doctor}</div>
                        <div className="text-xs text-gray-500">{a.specialty}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" /> {a.date} at {a.time}
                        </div>
                      </div>
                    </div>
                    <Badge className={a.status === 'Confirmed' ? 'bg-green-600 text-white' : 'bg-amber-100 text-amber-800 border-amber-200'}>
                      {a.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 border-gray-200 text-gray-500" disabled>
                Book New Appointment
              </Button>
            </CardContent>
          </Card>

          {/* Prescriptions */}
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-green-700" />
                <h2 className="font-semibold text-gray-900">Active Prescriptions</h2>
              </div>
              <div className="space-y-3">
                {prescriptions.map((p) => (
                  <div key={p.name} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-green-200 transition-colors">
                    <div className="bg-white p-2 rounded-lg border border-gray-100">
                      <Pill className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.dosage}</div>
                      <div className="text-xs text-gray-400 mt-1">Prescribed by {p.prescribedBy}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-10">
          <p className="text-sm text-gray-500 mb-4">Like what you see? Your real dashboard is one step away.</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/signup">
              <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                Create your free account
              </Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" className="text-gray-600 hover:bg-gray-100">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
