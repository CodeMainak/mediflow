import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { MedicalLogo } from '../ui/medical-logo';
import {
  CalendarCheck,
  Pill,
  MessageCircle,
  ClipboardList,
  ArrowRight,
  Sparkles,
  PlayCircle,
  MapPin,
  Check,
  ShieldCheck,
  Send,
  MessageSquareText,
  Stethoscope,
} from 'lucide-react';

const SERIF: React.CSSProperties = { fontFamily: "Georgia, 'Times New Roman', serif" };

const HOW_IT_WORKS = [
  { icon: MessageSquareText, label: 'Describe how you feel', detail: 'Plain language, no medical jargon required.' },
  { icon: Stethoscope, label: 'Get AI-guided triage', detail: 'A likely specialization and urgency, explained.' },
  { icon: MapPin, label: 'Find real care nearby', detail: 'Real clinics and hospitals, ranked by real ratings.' },
];

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
    icon: Pill,
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

const WHY_MEDIFLOW = [
  'AI figures out the right specialist for you — no guessing where to start.',
  'Real nearby options, ranked by real Google ratings, not a stale directory.',
  'Clear urgency guidance every time, so you know if it can wait.',
  'Self-care guidance plus a real next step, not just "go see a doctor."',
  'Follow-up questions that adapt to what you told us, not one fixed form.',
];

// Fades + slides content up the first time it scrolls into view, so the
// page doesn't feel static while scrolling past sections below the fold.
const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className = '', delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
    >
      {children}
    </div>
  );
};

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
        <Sparkles aria-hidden className="h-4 w-4 text-green-600 shrink-0" />
        <label htmlFor="hero-symptom-input" className="sr-only">
          Describe how you're feeling
        </label>
        <input
          id="hero-symptom-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Try it — describe how you're feeling..."
          className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-800 placeholder:text-gray-400 py-2"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim()}
          className="rounded-full bg-green-700 hover:bg-green-800 text-white shrink-0 h-9 w-9"
          aria-label="Check symptoms"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <div className="flex flex-wrap items-center gap-2 mt-3 justify-center">
        <span className="text-xs text-gray-500">Try asking:</span>
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
      <p className="text-xs text-gray-500 mt-2 text-center">Takes you straight to a real, live answer — no signup needed.</p>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  return (
    <div id="top" className="min-h-screen bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-white focus:text-green-800 focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:outline-2 focus:outline-green-600"
      >
        Skip to main content
      </a>
      {/* Nav */}
      <nav className="sticky top-0 z-20 backdrop-blur-md bg-white/90 border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-3">
            <MedicalLogo size="sm" />
            <span className="text-lg font-bold text-gray-900 tracking-tight">MediFlow</span>
          </a>
          <div className="flex items-center gap-1">
            <a href="#features" className="hidden md:inline-flex px-3 py-2 rounded-md text-sm text-gray-500 hover:text-green-700 hover:bg-green-50 transition-colors">
              Features
            </a>
            <a href="#why" className="hidden md:inline-flex px-3 py-2 rounded-md text-sm text-gray-500 hover:text-green-700 hover:bg-green-50 transition-colors">
              Why MediFlow
            </a>
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
              <Button className="bg-green-700 hover:bg-green-800 text-white shadow-sm hover:shadow-md transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-50 border-b border-gray-100">
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-gradient-to-br from-emerald-200 to-green-100 opacity-40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-24 w-96 h-96 rounded-full bg-gradient-to-tr from-sky-100 to-teal-100 opacity-50 blur-3xl" />
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 w-[26rem] h-[26rem] text-green-700/[0.05] hidden lg:block"
        >
          <polyline
            points="12,54 30,54 38,30 49,74 58,40 65,54 88,54"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="relative max-w-6xl mx-auto px-6 pt-16 sm:pt-20 pb-20 text-center">
          <div className="animate-fade-in-up flex justify-center mb-6">
            <MedicalLogo size="lg" />
          </div>
          <div className="animate-fade-in-up delay-1 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3.5 py-1 text-xs font-medium text-green-700 mb-6">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-600" />
            </span>
            Now with AI-assisted symptom triage
          </div>
          <h1
            style={SERIF}
            className="animate-fade-in-up delay-2 text-4xl sm:text-5xl font-semibold text-gray-900 leading-[1.15] tracking-tight max-w-2xl mx-auto mb-6"
          >
            Healthcare that fits in your pocket, not a waiting room.
          </h1>
          <p className="animate-fade-in-up delay-3 text-lg text-gray-500 max-w-2xl mx-auto mb-8">
            Tell us how you feel and get AI-guided triage, then find real nearby care ranked by real
            ratings, book appointments online, and keep every prescription and record in one place.
          </p>
          <div className="animate-fade-in-up delay-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-800 hover:to-emerald-800 hover:-translate-y-0.5 text-white shadow-sm shadow-green-600/20 transition-all px-8 h-12 text-base">
                Create your free account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-white hover:-translate-y-0.5 transition-all h-12 px-8 text-base">
                I already have an account
              </Button>
            </Link>
          </div>

          <div className="animate-fade-in-up delay-4">
            <HeroTry />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-3 gap-8 sm:gap-6">
          {HOW_IT_WORKS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.label} delay={i * 120} className="text-center sm:text-left">
                <div className="flex sm:block items-center gap-3 mb-3">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-green-50 shrink-0">
                    <Icon className="h-5 w-5 text-green-700" />
                  </div>
                  <span className="hidden sm:inline-block mt-2 text-xs font-semibold text-gray-500 tracking-wide">
                    STEP {i + 1}
                  </span>
                  <p className="sm:hidden font-semibold text-gray-900">{step.label}</p>
                </div>
                <p className="hidden sm:block font-semibold text-gray-900 mb-1">{step.label}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{step.detail}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16 scroll-mt-20 border-t border-gray-100">
        <h2 style={SERIF} className="text-2xl sm:text-3xl font-semibold text-gray-900 text-center mb-2">
          Everything you need, as a patient
        </h2>
        <p className="text-center text-gray-500 text-sm mb-10">No training required — it works the way you'd expect.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 3) * 100}>
                <Card className="group border border-gray-100 shadow-none hover:border-green-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="bg-green-50 w-10 h-10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-5 w-5 text-green-700" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                  </CardContent>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Why MediFlow */}
      <section id="why" className="bg-gray-50 border-t border-gray-100 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 style={SERIF} className="text-2xl sm:text-3xl font-semibold text-gray-900 text-center mb-2">
            Why patients choose MediFlow
          </h2>
          <p className="text-center text-gray-500 text-sm mb-10">Not just a directory of names — actual guidance.</p>
          <Reveal className="grid sm:grid-cols-2 gap-x-8 gap-y-5 bg-white border border-gray-100 rounded-xl p-6 sm:p-8">
            {WHY_MEDIFLOW.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-green-700" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{point}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-1.5 bg-green-50 rounded-full px-3.5 py-1 text-xs font-medium text-green-700 mb-5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Built to be honest with you
        </div>
        <h2 style={SERIF} className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">No fake doctor lists. Ever.</h2>
        <p className="text-gray-500 max-w-xl mx-auto mb-8">
          When MediFlow suggests where to go, it's a real place with a real rating — never invented data
          dressed up to look convincing.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 text-left">
          {[
            { title: 'Real ratings', detail: 'Sourced live from Google, not sample data baked into a demo.' },
            { title: 'Clearly labeled demo data', detail: "Anything that isn't real — like MediFlow's own demo network — says so." },
            { title: 'Free to try, right now', detail: 'No credit card. Try the AI triage above before you sign up for anything.' },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 100} className="border border-gray-100 rounded-xl p-4 hover:border-green-200 hover:shadow-sm transition-all duration-300">
              <p className="font-medium text-gray-900 text-sm mb-1">{item.title}</p>
              <p className="text-gray-500 text-xs">{item.detail}</p>
            </Reveal>
          ))}
        </div>
      </section>

      </main>

      {/* Footer — real, functioning links only */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-14 grid sm:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <MedicalLogo size="sm" />
              <span className="font-bold text-gray-900 tracking-tight">MediFlow</span>
            </div>
            <p className="text-sm text-gray-500 max-w-[220px]">Built to make healthcare a little less painful.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase mb-3">Product</p>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="text-gray-600 hover:text-green-700 transition-colors">Features</a></li>
              <li><a href="#why" className="text-gray-600 hover:text-green-700 transition-colors">Why MediFlow</a></li>
              <li><Link to="/demo" className="text-gray-600 hover:text-green-700 transition-colors">Live demo</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase mb-3">Account</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/signup" className="text-gray-600 hover:text-green-700 transition-colors">Create account</Link></li>
              <li><Link to="/login" className="text-gray-600 hover:text-green-700 transition-colors">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase mb-3">For care teams</p>
            <p className="text-sm text-gray-500 mb-2">Doctors, receptionists, and pharmacists manage patients here too.</p>
            <Link to="/login" className="text-sm text-green-700 font-medium hover:text-green-800 transition-colors inline-flex items-center gap-1">
              Staff sign in
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className="border-t border-gray-100 py-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} MediFlow
        </div>
      </footer>
    </div>
  );
};
