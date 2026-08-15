import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { MedicalLogo } from '../ui/medical-logo';
import { SymptomTriageFlow } from '../shared/SymptomTriageFlow';
import { demoTriage, DemoTriageResult } from '../../utils/demoTriage';
import {
  CalendarCheck,
  FileText,
  MessageCircle,
  ClipboardList,
  ArrowRight,
  Sparkles,
  PlayCircle,
} from 'lucide-react';

const features = [
  {
    icon: CalendarCheck,
    title: 'Book appointments online',
    description: 'Find a doctor and pick a time slot in a couple of clicks — no phone calls, no waiting.',
  },
  {
    icon: FileText,
    title: 'Digital prescriptions',
    description: 'Every prescription your doctor writes is saved to your account, ready whenever you need it.',
  },
  {
    icon: ClipboardList,
    title: 'One place for your records',
    description: 'Past visits, medications, and history — all in one place instead of scattered paperwork.',
  },
  {
    icon: MessageCircle,
    title: 'Message your doctor',
    description: 'Quick questions between visits, without booking a whole new appointment.',
  },
];

const URGENCY_STYLES: Record<DemoTriageResult['urgency'], string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  emergency: 'bg-red-600 text-white border-red-600',
};

const HeroTry: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto mt-10 text-left">
      <SymptomTriageFlow<DemoTriageResult>
        compact
        onSubmit={(answers) => demoTriage(answers)}
        renderResult={(result, reset) => (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            {result.urgency === 'emergency' ? (
              <p className="text-sm text-red-700">
                <span className="font-semibold">This needs immediate attention.</span> {result.reasoning}{' '}
                Please contact emergency services rather than booking a routine appointment.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge className={URGENCY_STYLES[result.urgency]}>
                    {result.urgency[0].toUpperCase() + result.urgency.slice(1)} urgency
                  </Badge>
                  <Badge variant="outline" className="border-gray-200 text-gray-700">
                    {result.specialization}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{result.reasoning}</p>
              </>
            )}
            <div className="flex items-center justify-between mt-3">
              <Link to="/demo" className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline">
                See the full experience <ArrowRight className="h-3 w-3" />
              </Link>
              <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600">
                Try another
              </button>
            </div>
          </div>
        )}
      />
      <p className="text-xs text-gray-400 mt-2 text-center">Runs instantly in your browser — no sign-up, no network call.</p>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-2 rounded-xl shadow-sm">
              <MedicalLogo size="sm" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">MediFlow</span>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/demo">
              <Button variant="ghost" className="text-gray-600 hover:text-green-700 hover:bg-green-50 hidden sm:inline-flex">
                <PlayCircle className="mr-1.5 h-4 w-4" />
                Demo
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" className="text-gray-600 hover:text-green-700 hover:bg-green-50">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-100 opacity-60 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute top-40 -left-24 w-72 h-72 rounded-full bg-green-100 opacity-50 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 sm:pt-20 pb-20 text-center">
          <div className="animate-fade-in-up inline-flex items-center gap-1.5 bg-green-50 rounded-full px-3.5 py-1 text-xs font-medium text-green-700 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Now with AI-assisted symptom triage
          </div>
          <h1 className="animate-fade-in-up delay-1 text-4xl sm:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight max-w-3xl mx-auto mb-6">
            Healthcare that fits in your pocket, not a waiting room.
          </h1>
          <p className="animate-fade-in-up delay-2 text-lg text-gray-500 max-w-2xl mx-auto mb-8">
            Book appointments, get AI-guided triage, and keep every prescription and record in one
            simple place — so you spend less time chasing paperwork and more time getting care.
          </p>
          <div className="animate-fade-in-up delay-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 hover:-translate-y-0.5 text-white shadow-lg shadow-green-600/20 transition-all px-8 h-12 text-base">
                Create your free account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:-translate-y-0.5 transition-all h-12 px-8 text-base">
                I already have an account
              </Button>
            </Link>
          </div>

          <div className="animate-fade-in-up delay-4">
            <HeroTry />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Everything you need, as a patient
        </h2>
        <p className="text-center text-gray-500 text-sm mb-10">No training required — it works the way you'd expect.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card
                key={f.title}
                className={`group border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-green-100 transition-all duration-300 animate-fade-in-up delay-${Math.min(i + 1, 4)}`}
              >
                <CardContent className="pt-6">
                  <div className="bg-green-50 w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-green-100 transition-all duration-300">
                    <Icon className="h-5 w-5 text-green-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Staff callout */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <Card className="border border-gray-100 shadow-sm bg-gray-50/60">
          <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Are you a doctor, receptionist, or pharmacist?</h3>
              <p className="text-sm text-gray-500">Sign in to your staff dashboard to manage patients, appointments, and inventory.</p>
            </div>
            <Link to="/login">
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-white whitespace-nowrap">
                Staff Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <footer className="text-center pb-10 text-sm text-gray-400 border-t border-gray-100 pt-8">
        © {new Date().getFullYear()} MediFlow. Built to make healthcare a little less painful.
      </footer>
    </div>
  );
};
