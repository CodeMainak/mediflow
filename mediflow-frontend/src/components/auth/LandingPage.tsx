import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { MedicalLogo } from '../ui/medical-logo';
import {
  CalendarCheck,
  FileText,
  MessageCircle,
  ClipboardList,
  ArrowRight,
  Stethoscope,
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

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-2 rounded-xl shadow-md">
            <MedicalLogo size="sm" />
          </div>
          <span className="text-xl font-bold text-green-900">MediFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/demo">
            <Button variant="ghost" className="text-green-800 hover:bg-green-100 hidden sm:inline-flex">
              <PlayCircle className="mr-1.5 h-4 w-4" />
              View Demo
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" className="text-green-800 hover:bg-green-100">Sign In</Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-white/70 border border-green-200 rounded-full px-4 py-1.5 text-sm text-green-700 mb-6">
          <Stethoscope className="h-4 w-4" />
          Your care, without the paperwork
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-green-950 leading-tight max-w-3xl mx-auto mb-6">
          Book a doctor's appointment in minutes, not phone calls.
        </h1>
        <p className="text-lg text-green-800/80 max-w-2xl mx-auto mb-10">
          MediFlow keeps your appointments, prescriptions, and medical records in one simple place —
          so you spend less time chasing paperwork and more time getting care.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup">
            <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg px-8 h-12 text-base">
              Create your free account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="border-green-300 text-green-800 hover:bg-green-50 h-12 px-8 text-base">
              I already have an account
            </Button>
          </Link>
        </div>
        <Link to="/demo" className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:text-green-900 hover:underline mt-5">
          <PlayCircle className="h-4 w-4" />
          Just browsing? View a live demo — no signup needed
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-green-950 text-center mb-10">
          Everything you need, as a patient
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="border-0 shadow-md bg-white/90 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-11 h-11 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-green-700" />
                  </div>
                  <h3 className="font-semibold text-green-950 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-green-800/70 leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Staff callout */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <Card className="border-0 shadow-md bg-white/70">
          <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-green-950">Are you a doctor, receptionist, or pharmacist?</h3>
              <p className="text-sm text-green-800/70">Sign in to your staff dashboard to manage patients, appointments, and inventory.</p>
            </div>
            <Link to="/login">
              <Button variant="outline" className="border-green-300 text-green-800 hover:bg-green-50 whitespace-nowrap">
                Staff Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <footer className="text-center pb-10 text-sm text-green-700/70">
        © {new Date().getFullYear()} MediFlow. Built to make healthcare a little less painful.
      </footer>
    </div>
  );
};
