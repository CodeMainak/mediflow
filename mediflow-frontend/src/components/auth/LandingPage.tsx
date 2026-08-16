import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { MedicalLogo } from '../ui/medical-logo';
import {
  CalendarCheck,
  FileText,
  MessageCircle,
  ClipboardList,
  ArrowRight,
  Sparkles,
  PlayCircle,
  MapPin,
  Check,
  X,
  ShieldCheck,
  Send,
} from 'lucide-react';

const HERO_EXAMPLES = ['I have a bad headache', 'My chest feels tight', 'Itchy rash for 3 days'];

const features = [
  {
    icon: Sparkles,
    title: 'AI-guided symptom triage',
    description: 'Describe how you feel in plain language and get a specialization + urgency in under a minute — real follow-up questions, not a fixed script.',
  },
  {
    icon: MapPin,
    title: 'Real nearby care, real ratings',
    description: "When you need to see someone, we search real hospitals and clinics near you — ranked by real Google ratings, not a stale directory.",
  },
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

const COMPARISON_ROWS = [
  { old: 'Guess which specialist you even need', mediflow: 'AI figures out the right specialist for you' },
  { old: "Search directories that don't say if it's actually good", mediflow: 'Real nearby options, ranked by real Google ratings' },
  { old: 'No idea if this can wait or not', mediflow: 'Clear urgency guidance, every time' },
  { old: "Advice stops at \"go see a doctor\"", mediflow: 'Self-care guidance plus a real next step' },
  { old: 'One fixed intake form, every time', mediflow: 'Follow-up questions that adapt to what you said' },
];

// The hero doesn't run its own local triage anymore — it used to, and then
// /demo asked the same question again with a different (offline) engine,
// which meant describing your symptoms twice. Typing here or tapping an
// example now takes you straight to /demo and auto-submits it there, so
// there's exactly one real conversation, not two.
const HeroTry: React.FC = () => {
  const [text, setText] = useState('');
  const navigate = useNavigate();

  const go = (symptoms: string) => {
    if (!symptoms.trim()) return;
    navigate('/demo', { state: { symptoms: symptoms.trim() } });
  };

  return (
    <div className="max-w-xl mx-auto mt-10 text-left">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(text);
        }}
        className="flex items-center gap-2 bg-white rounded-full border border-gray-200 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-green-300 transition-all p-1.5 pl-5"
      >
        <Sparkles className="h-4 w-4 text-green-600 shrink-0" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Try it — describe how you're feeling..."
          className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-800 placeholder:text-gray-400 py-2"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim()}
          className="rounded-full bg-green-600 hover:bg-green-700 text-white shrink-0 h-9 w-9"
          aria-label="Check symptoms"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <div className="flex flex-wrap items-center gap-2 mt-3 justify-center">
        <span className="text-xs text-gray-400">Try asking:</span>
        {HERO_EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => go(ex)}
            className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-800 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">Takes you straight to a real, live answer — no signup needed.</p>
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

      {/* Comparison table */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">A guide, not just a directory</h2>
        <p className="text-center text-gray-500 text-sm mb-10">Most booking sites stop at a list of names. Here's the difference.</p>
        <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-100">
            <div className="px-5 py-3 text-sm font-medium text-gray-500">The usual way</div>
            <div className="px-5 py-3 text-sm font-semibold text-green-800 bg-green-50">MediFlow</div>
          </div>
          {COMPARISON_ROWS.map((row, i) => (
            <div key={row.old} className={`grid grid-cols-2 ${i !== COMPARISON_ROWS.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="px-5 py-4 text-sm text-gray-500 flex items-start gap-2.5">
                <X className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
                {row.old}
              </div>
              <div className="px-5 py-4 text-sm text-gray-800 bg-green-50/40 flex items-start gap-2.5">
                <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                {row.mediflow}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-2xl bg-gray-900 text-white px-6 sm:px-12 py-14 text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3.5 py-1 text-xs font-medium text-green-300 mb-5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Built to be honest with you
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">No fake doctor lists. Ever.</h2>
          <p className="text-gray-300 max-w-xl mx-auto mb-8">
            When MediFlow suggests where to go, it's a real place with a real rating — never invented data
            dressed up to look convincing.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="font-medium text-white text-sm mb-1">Real ratings</p>
              <p className="text-gray-400 text-xs">Sourced live from Google, not sample data baked into a demo.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="font-medium text-white text-sm mb-1">Clearly labeled demo data</p>
              <p className="text-gray-400 text-xs">Anything that isn't real — like MediFlow's own demo network — says so.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="font-medium text-white text-sm mb-1">Free to try, right now</p>
              <p className="text-gray-400 text-xs">No credit card. Try the AI triage above before you sign up for anything.</p>
            </div>
          </div>
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
