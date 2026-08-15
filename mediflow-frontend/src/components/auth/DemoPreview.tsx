import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { MedicalLogo } from '../ui/medical-logo';
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
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState<DemoTriageResult | null>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;
    setResult(demoTriage(symptoms));
  };

  return (
    <Card className="border-0 shadow-md bg-white/90 mb-8">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-green-600" />
          <h2 className="font-semibold text-green-950">Try it: AI Symptom Checker</h2>
        </div>
        <p className="text-sm text-green-800/70 mb-4">
          Describe how you're feeling — this runs instantly, right in your browser, no account needed.
        </p>
        <form onSubmit={handleCheck} className="space-y-3">
          <Textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g. I've had a sore throat and mild fever for two days..."
            className="border-green-200 focus-visible:border-green-500 focus-visible:ring-green-500 min-h-[80px]"
          />
          <Button
            type="submit"
            disabled={!symptoms.trim()}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          >
            Check my symptoms
          </Button>
        </form>

        {result && (
          <div className="mt-5 pt-5 border-t border-green-100 space-y-3">
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
                  <Badge variant="outline" className="border-green-200 text-green-800">
                    {result.specialization}
                  </Badge>
                </div>
                <p className="text-sm text-green-900">{result.reasoning}</p>
                {result.doctors.map((d) => (
                  <div key={d.name} className="flex items-center gap-3 p-3 rounded-xl bg-green-50/60 border border-green-100">
                    <div className="bg-white p-2 rounded-lg border border-green-100">
                      <Stethoscope className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-green-950 text-sm">{d.name}</div>
                      <div className="text-xs text-green-700/70">{d.specialization}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
            <p className="text-xs text-green-700/50">
              Sample logic for this preview — the real app can also call OpenAI for richer triage.
            </p>
          </div>
        )}
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Nav */}
      <nav className="max-w-5xl mx-auto flex items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-2 rounded-xl shadow-md">
            <MedicalLogo size="sm" />
          </div>
          <span className="text-xl font-bold text-green-900">MediFlow</span>
        </Link>
        <Link to="/signup">
          <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md">
            Create your free account
          </Button>
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pb-16">
        {/* Banner */}
        <div className="flex items-center gap-3 bg-white/80 border border-green-200 rounded-2xl px-5 py-3.5 mb-8">
          <Sparkles className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800">
            <span className="font-semibold">You're viewing a live preview with sample data.</span>{' '}
            No sign-in required — this loads instantly, nothing here talks to a server.
          </p>
        </div>

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-green-950">Welcome back, Jane</h1>
          <p className="text-green-800/70 text-sm mt-1">Here's what's happening with your care.</p>
        </div>

        <DemoSymptomChecker />

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="border-0 shadow-md bg-white/90">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-950">{s.value}</div>
                    <div className="text-xs text-green-800/70">{s.label}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Appointments */}
          <Card className="border-0 shadow-md bg-white/90">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="h-5 w-5 text-green-700" />
                <h2 className="font-semibold text-green-950">Upcoming Appointments</h2>
              </div>
              <div className="space-y-3">
                {appointments.map((a) => (
                  <div key={a.doctor} className="flex items-start justify-between p-3 rounded-xl bg-green-50/60 border border-green-100">
                    <div className="flex items-start gap-3">
                      <div className="bg-white p-2 rounded-lg border border-green-100">
                        <Stethoscope className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-green-950 text-sm">{a.doctor}</div>
                        <div className="text-xs text-green-700/70">{a.specialty}</div>
                        <div className="text-xs text-green-700/70 flex items-center gap-1 mt-1">
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
              <Button variant="outline" className="w-full mt-4 border-green-200 text-green-800 hover:bg-green-50" disabled>
                Book New Appointment
              </Button>
            </CardContent>
          </Card>

          {/* Prescriptions */}
          <Card className="border-0 shadow-md bg-white/90">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-green-700" />
                <h2 className="font-semibold text-green-950">Active Prescriptions</h2>
              </div>
              <div className="space-y-3">
                {prescriptions.map((p) => (
                  <div key={p.name} className="flex items-start gap-3 p-3 rounded-xl bg-green-50/60 border border-green-100">
                    <div className="bg-white p-2 rounded-lg border border-green-100">
                      <Pill className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-green-950 text-sm">{p.name}</div>
                      <div className="text-xs text-green-700/70">{p.dosage}</div>
                      <div className="text-xs text-green-700/50 mt-1">Prescribed by {p.prescribedBy}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-10">
          <p className="text-sm text-green-800/70 mb-4">Like what you see? Your real dashboard is one step away.</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md">
                Create your free account
              </Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" className="text-green-800 hover:bg-green-100">
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
