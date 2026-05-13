'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Plane, Camera, FileSignature, Users2, Sparkles, ShieldCheck, Trophy, MessageSquare, Play, Minus, Plus, Check, X, Star, ChevronDown, PlayCircle, Zap, Briefcase, GraduationCap, Building2 } from 'lucide-react';
import RevoLogo from '@/components/RevoLogo';
import RevoFooter from '@/components/RevoFooter';
import RevoSupportWidget from '@/components/RevoSupportWidget';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=2000&q=85&auto=format&fit=crop',
    chip: 'The Future of Roofing',
    headline: 'Become a Certified AI Roofing Expert',
    sub: 'in 30 Days.',
    body: 'Drone inspections. AI damage analysis. Instant proposals. The platform that turns ambitious entrepreneurs into six-figure roofing consultants — backed by Revo.',
  },
  {
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2000&q=85&auto=format&fit=crop',
    chip: 'Built for the Hustler',
    headline: 'Turn Weekend Work Into',
    sub: 'a Six-Figure Career.',
    body: 'We hand you the drone, the AI, the script, the proposal generator, and the community. You bring hustle. We built the system around you.',
  },
  {
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=2000&q=85&auto=format&fit=crop',
    chip: 'Real Experts. Real Income.',
    headline: 'The Platform That Pays',
    sub: 'Experts Who Know More.',
    body: 'Claude vision, ATTOM property data, insurance auto-documentation, a proven 10-module curriculum, and a national leaderboard. This is the roofing industry, rebuilt.',
  },
];

const STATS = [
  { value: '237', suffix: '', label: 'Certified Experts' },
  { value: '$87,400', suffix: '', label: 'Avg. Annual Earnings' },
  { value: '14,200', suffix: '+', label: 'Roofs Analyzed' },
  { value: '4.9', suffix: '/5', label: 'Customer Rating' },
];

const JOURNEY = [
  { step: '01', icon: FileSignature, title: 'Apply in 3 Minutes', body: 'Tell us about your market and ambition. Paul personally reviews every application within 48 hours.' },
  { step: '02', icon: GraduationCap, title: 'Train for 30 Days', body: '10-module course. From shingle grades to closing the deal. Self-paced with live office hours.' },
  { step: '03', icon: Plane, title: 'Get Equipped', body: 'Drone discounts, AI vision access, CRM, and the Revo proposal engine. Everything ready day one.' },
  { step: '04', icon: Briefcase, title: 'Run Your Territory', body: 'Your customers. Your pipeline. Your brand. Backed by Revo infrastructure and the expert community.' },
  { step: '05', icon: Trophy, title: 'Scale to Six Figures', body: 'Top experts do 3–5 inspections a day with AI reports generated in seconds. Leaderboard bonuses drive growth.' },
];

const FEATURES = [
  { icon: Camera, title: 'AI Damage Analysis', body: 'Upload drone photos. Get a professional damage report in under 90 seconds. Claude Sonnet vision, calibrated for roofing.' },
  { icon: Plane, title: 'Drone Inspection Kit', body: 'Discounted DJI / Autel drones. GPS-tagged capture. FAA-compliant workflow. Your smartphone becomes a spec instrument.' },
  { icon: Zap, title: 'Instant Proposals', body: 'Inspection to signed proposal in one meeting. ATTOM property data + your pricing + AI copywriting.' },
  { icon: ShieldCheck, title: 'Insurance Auto-Docs', body: 'Reports formatted for every major carrier. Photo indexing. Claim supplement templates. Built for adjusters.' },
  { icon: Users2, title: 'Customer CRM', body: 'Your own pipeline. Job tracking. Per-property history. Your customers never belong to the platform.' },
  { icon: GraduationCap, title: '10-Module Course', body: 'Roofing 101. Storm assessment. Client meeting scripts. Estimating. Insurance. Closing. Quality control. Scaling.' },
  { icon: MessageSquare, title: 'Live Community', body: 'Daily Q&A. Private forum. Shared playbooks. Experts helping experts. No one works alone.' },
  { icon: Trophy, title: 'National Leaderboard', body: 'Public rankings. Monthly bonuses. Referral rewards. The top 10 experts earn co-branded regional marketing.' },
];

const TESTIMONIALS = [
  {
    name: 'Marcus Whitfield',
    role: 'Revo Expert · Dallas, TX',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=85&auto=format&fit=crop',
    quote: 'I was a laid-off HVAC tech eight months ago. Last month I cleared $11,400. The AI inspection tool is a weapon — customers see the damage on the screen and sign on the spot.',
    earnings: '$11,400',
    earningsLabel: 'last month',
  },
  {
    name: 'Sasha Reyes',
    role: 'Revo Expert · Tampa, FL',
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=85&auto=format&fit=crop',
    quote: 'Storm season used to mean chaos. Now I fly the drone, Claude writes the damage report, ATTOM pulls the property data, and the proposal is in the client inbox before I’m back in my truck.',
    earnings: '$94,800',
    earningsLabel: 'last 12 months',
  },
  {
    name: 'Derek Alford',
    role: 'Revo Expert · Phoenix, AZ',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=85&auto=format&fit=crop',
    quote: 'The course gave me the roofing expertise. The platform gave me the leverage. My close rate went from 22% to 61% the moment I started using the AI inspection report in my walkthrough.',
    earnings: '61%',
    earningsLabel: 'close rate',
  },
];

const COURSE_MODULES = [
  { num: '01', title: 'Welcome to Revo Roofing AI', body: 'The opportunity. Platform tour. Your first 30 days.' },
  { num: '02', title: 'Roofing 101: Materials & Methods', body: 'Shingle grades, underlayment, flashing, ventilation.' },
  { num: '03', title: 'Storm Damage Assessment', body: 'Hail, wind, water. Documenting for insurance claims.' },
  { num: '04', title: 'The Client Meeting', body: 'First impressions. Walkthrough script. Objections.' },
  { num: '05', title: 'Drone Inspection Fundamentals', body: 'Photo capture, GPS data, FAA regulations.' },
  { num: '06', title: 'Estimating & Proposals', body: 'Measure roof. Material + labor costing. AI proposals.' },
  { num: '07', title: 'Insurance Claims Process', body: 'Filing, adjusters, supplementing claims.' },
  { num: '08', title: 'Closing the Deal', body: 'Objections. Financing. Contract signing. Timelines.' },
  { num: '09', title: 'Job Execution & Quality Control', body: 'Pre-job checklist. Subs. Checkpoints. Walkthrough.' },
  { num: '10', title: 'Scaling Your Roofing Business', body: 'Referral networks. Leaderboard. Commercial.' },
];

const COMPARISON = [
  { label: 'Training', traditional: 'Informal mentorship, 1–2 years on crew', revo: '10-module course + live Q&A, 30 days to certification' },
  { label: 'Tools', traditional: 'You buy a ladder and a notepad', revo: 'AI vision, drone discount, ATTOM data, CRM — all in' },
  { label: 'Lead generation', traditional: 'Door-knocking and Nextdoor posts', revo: 'Platform leads + community referrals + national brand' },
  { label: 'Proposals', traditional: 'Hand-drawn diagrams, spreadsheets', revo: '90-second AI reports formatted for every insurance carrier' },
  { label: 'Income ceiling', traditional: '$45K–$65K as a crew member', revo: 'Top 10% clear $150K+, no cap, leaderboard bonuses' },
  { label: 'Schedule', traditional: 'Crew chief sets the hours', revo: 'Your territory. Your calendar. Your brand.' },
  { label: 'Insurance claims', traditional: 'Learn from YouTube, hope it works', revo: 'Carrier-ready templates + claim supplement training' },
  { label: 'Community', traditional: 'You versus the weather', revo: '237 experts nationwide, daily shared wins' },
];

const FAQ_ITEMS = [
  { q: 'Do I need previous roofing experience?', a: 'No. About 60% of our experts came from outside the trades — sales, construction-adjacent, military veterans, HVAC/electrical techs. The 10-module course assumes zero background. What we look for: hustle, integrity, and a willingness to learn.' },
  { q: 'How much does it cost to join?', a: 'Applying is free. The certification course is $1,497 for the first cohort (regular price $3,997). Most experts earn that back on their first two closed jobs. Financing is available.' },
  { q: 'Do I need to buy a drone?', a: 'You will need one eventually. Revo negotiates fleet pricing with DJI and Autel — most experts pay 25–40% below retail. If you already own a drone with GPS, you’re set.' },
  { q: 'How does Revo make money?', a: 'We take a small platform fee on closed jobs booked through Revo-generated leads. Jobs you source yourself through your own marketing are 100% yours — we never touch them. Transparency is in the agreement.' },
  { q: 'Can I hire subs and build a crew?', a: 'Yes. Many Tier 2+ experts run small crews. The platform includes project management, invoicing, and payout automation for subs.' },
  { q: 'What markets are you active in right now?', a: 'Primary: Texas, Florida, Arizona, Colorado, Georgia, Ohio, Pennsylvania, Missouri, Illinois, Oklahoma, North Carolina, Tennessee. Storm season priority. We expand monthly.' },
  { q: 'What makes Revo different from other roofing platforms?', a: 'We are the only AI-native roofing platform. Others give you a CRM. We give you the CRM, the drone workflow, the vision model, the proposal engine, the training, and the community — under one brand with one login.' },
];

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setActiveSlide(s => (s + 1) % HERO_SLIDES.length), 7000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const slide = HERO_SLIDES[activeSlide];

  return (
    <main className="revo-hero-bg min-h-screen overflow-x-hidden">
      {/* NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${scrolled ? 'revo-glass-strong border-b border-[#E5E9F2]/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 py-4">
          <Link href="/"><RevoLogo size={44} showWordmark /></Link>
          <div className="hidden lg:flex items-center gap-8 text-sm text-[#E5E9F2]/75">
            <a href="#story" className="hover:text-white transition">Our Story</a>
            <a href="#journey" className="hover:text-white transition">How It Works</a>
            <a href="#features" className="hover:text-white transition">Platform</a>
            <a href="#course" className="hover:text-white transition">Course</a>
            <a href="#earnings" className="hover:text-white transition">Earnings</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline text-[#E5E9F2]/80 hover:text-white text-sm transition px-3 py-2">Login</Link>
            <Link href="/register" className="revo-btn-primary px-5 py-2.5 rounded-full font-semibold text-sm inline-flex items-center gap-2">
              Apply <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-[100vh] flex flex-col justify-center pt-24 pb-10 overflow-hidden">
        {HERO_SLIDES.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out bg-cover bg-center ${i === activeSlide ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url(${s.image})` }}
            aria-hidden={i !== activeSlide}
          />
        ))}
        <div className="absolute inset-0 revo-hero-photo-shroud" />
        <div className="absolute inset-0 revo-grid-bg opacity-60 pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] revo-spot-gold revo-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] revo-spot-blue revo-pulse-slow" style={{ animationDelay: '1.2s' }} />

        <div key={activeSlide} className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
          <div className="max-w-4xl">
            <div className="revo-chip revo-fade-up mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A24C] revo-pulse-gold" />
              {slide.chip}
            </div>
            <h1 className="revo-fade-up revo-fade-up-delay-1 font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] font-bold mb-6">
              {slide.headline}<br />
              <span className="revo-gradient-text">{slide.sub}</span>
            </h1>
            <p className="revo-fade-up revo-fade-up-delay-2 text-lg md:text-xl text-[#E5E9F2]/85 max-w-2xl mb-10 leading-relaxed">
              {slide.body}
            </p>
            <div className="revo-fade-up revo-fade-up-delay-3 flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/register" className="revo-btn-primary px-8 py-4 rounded-full font-bold text-base inline-flex items-center justify-center gap-2">
                Start Your Application <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#journey" className="revo-btn-ghost px-8 py-4 rounded-full font-semibold text-base inline-flex items-center justify-center gap-2">
                <PlayCircle className="w-4 h-4" /> See How It Works
              </a>
            </div>
          </div>
          <div className="revo-fade-up revo-fade-up-delay-4 flex items-center gap-2">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1 rounded-full transition-all ${i === activeSlide ? 'w-14 bg-[#D4A24C]' : 'w-8 bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
        </div>

        {/* STATS STRIP */}
        <div className="relative z-10 mt-16 border-t border-white/10 bg-black/30 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="font-stat text-3xl md:text-5xl font-bold text-white mb-1">
                  {s.value}<span className="text-[#D4A24C]">{s.suffix}</span>
                </div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#E5E9F2]/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOGOS MARQUEE */}
      <section className="py-12 border-b border-[#E5E9F2]/10 overflow-hidden bg-[#050812]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 mb-6">
          <p className="text-center text-xs uppercase tracking-[0.25em] text-[#E5E9F2]/45">Trusted technology partners</p>
        </div>
        <div className="overflow-hidden">
          <div className="flex gap-16 revo-marquee whitespace-nowrap">
            {['DJI', 'AUTEL', 'ATTOM DATA', 'ANTHROPIC', 'OPENAI', 'GEMINI', 'STRIPE', 'RESEND', 'SUPABASE', 'AGENT MIDAS', 'DJI', 'AUTEL', 'ATTOM DATA', 'ANTHROPIC', 'OPENAI', 'GEMINI', 'STRIPE', 'RESEND', 'SUPABASE', 'AGENT MIDAS'].map((name, i) => (
              <span key={i} className="font-display text-2xl md:text-3xl text-[#E5E9F2]/25 hover:text-[#D4A24C] transition tracking-wide">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* STORY */}
      <Reveal>
        <section id="story" className="py-28 md:py-36 relative">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="revo-chip mb-6">Paul Mikel · Founder</div>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-8">
                I spent a decade <span className="revo-gold-text">on the roofs</span>. Then I watched AI change everything.
              </h2>
              <div className="space-y-5 text-[#E5E9F2]/80 text-lg leading-relaxed">
                <p>
                  I started with a ladder and a notepad. I bought my first truck with storm damage commissions. I learned shingles by walking them in 110° heat. And I learned the hard part — the real hard part — isn&apos;t the roof. It&apos;s the 40 minutes in the customer&apos;s kitchen explaining why a patch isn&apos;t a fix.
                </p>
                <p>
                  Revo exists because a motivated human plus an AI co-pilot closes more jobs, files cleaner claims, and earns more than either one alone. We built the tools I wish I had when I was 23 with a clipboard.
                </p>
                <p>
                  If you have the hustle, we have the rest. That&apos;s the whole pitch.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D4A24C] to-[#3B82F6] flex items-center justify-center text-[#0A0F1F] font-display font-bold text-xl">PM</div>
                <div>
                  <div className="font-display text-lg">Paul Mikel</div>
                  <div className="text-sm text-[#E5E9F2]/55">Founder · Revo Roofing AI</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-[#D4A24C]/25 to-[#3B82F6]/25 rounded-3xl blur-2xl" />
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-[#E5E9F2]/10">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1400&q=85&auto=format&fit=crop)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1F] via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="revo-glass rounded-2xl p-5">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-[#D4A24C] mb-2 font-semibold">The Vision</div>
                    <p className="text-sm text-white/90 leading-snug">
                      &ldquo;A national network of AI-equipped roofing experts, each running their own territory with the operating leverage of a $50M company.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* JOURNEY */}
      <Reveal>
        <section id="journey" className="py-28 md:py-36 relative bg-[#050812] border-y border-[#E5E9F2]/10 overflow-hidden">
          <div className="absolute inset-0 revo-grid-bg opacity-50" />
          <div className="relative max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <div className="revo-chip mx-auto mb-6">The Journey</div>
              <h2 className="font-display text-4xl md:text-6xl leading-tight mb-6">
                From application to <span className="revo-gold-text">your first six-figure year</span>
              </h2>
              <p className="text-lg text-[#E5E9F2]/70">
                The path is mapped. The tools are built. Your only job is to show up for 30 days and do the work.
              </p>
            </div>

            <div className="relative">
              <div className="hidden lg:block absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4A24C]/50 to-transparent" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                {JOURNEY.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={i} className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4A24C] to-[#3B82F6] flex items-center justify-center mb-5 revo-pulse-gold">
                        <Icon className="w-7 h-7 text-[#0A0F1F]" />
                      </div>
                      <div className="font-stat text-xs tracking-[0.25em] text-[#D4A24C] mb-2">STEP {step.step}</div>
                      <h3 className="font-display text-xl mb-3">{step.title}</h3>
                      <p className="text-sm text-[#E5E9F2]/65 leading-relaxed">{step.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* FEATURES */}
      <Reveal>
        <section id="features" className="py-28 md:py-36 relative">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <div className="revo-chip mx-auto mb-6">The Platform</div>
              <h2 className="font-display text-4xl md:text-6xl leading-tight mb-6">
                Everything you need. <span className="revo-gradient-text">Under one roof.</span>
              </h2>
              <p className="text-lg text-[#E5E9F2]/70">
                Eight integrated systems. One login. Zero stitch-together SaaS. This is why Revo experts close faster and earn more.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="revo-card rounded-2xl p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4A24C]/20 to-[#3B82F6]/20 border border-[#D4A24C]/30 flex items-center justify-center mb-5">
                      <Icon className="w-5 h-5 text-[#D4A24C]" />
                    </div>
                    <h3 className="font-display text-xl mb-3 leading-tight">{f.title}</h3>
                    <p className="text-sm text-[#E5E9F2]/65 leading-relaxed">{f.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </Reveal>

      {/* EARNINGS CALCULATOR */}
      <Reveal>
        <EarningsCalculator />
      </Reveal>

      {/* TESTIMONIALS */}
      <Reveal>
        <section className="py-28 md:py-36 bg-[#050812] border-y border-[#E5E9F2]/10 relative overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[900px] h-[900px] revo-spot-gold pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <div className="revo-chip mx-auto mb-6">Real Experts · Real Numbers</div>
              <h2 className="font-display text-4xl md:text-6xl leading-tight mb-6">
                The results <span className="revo-gold-text">speak for themselves.</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="revo-card rounded-2xl p-7 flex flex-col">
                  <div className="flex items-center gap-0.5 text-[#D4A24C] mb-5">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-[#E5E9F2]/85 leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center justify-between border-t border-white/5 pt-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-full bg-cover bg-center border border-[#D4A24C]/30"
                        style={{ backgroundImage: `url(${t.image})` }}
                      />
                      <div>
                        <div className="font-display text-sm">{t.name}</div>
                        <div className="text-[11px] text-[#E5E9F2]/55">{t.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-stat text-xl font-bold revo-gold-text">{t.earnings}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[#E5E9F2]/50">{t.earningsLabel}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* COMPARISON */}
      <Reveal>
        <section className="py-28 md:py-36">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="revo-chip mx-auto mb-6">The Difference</div>
              <h2 className="font-display text-4xl md:text-6xl leading-tight mb-6">
                The traditional path vs. <span className="revo-gradient-text">the Revo path</span>
              </h2>
            </div>
            <div className="revo-card rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 bg-black/40 p-5 border-b border-[#E5E9F2]/10">
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#E5E9F2]/60 font-semibold">Category</div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#E5E9F2]/60 font-semibold flex items-center gap-2">
                  <X className="w-3 h-3 text-red-400" /> Traditional Career
                </div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#D4A24C] font-semibold flex items-center gap-2">
                  <Check className="w-3 h-3 text-[#D4A24C]" /> Revo Expert
                </div>
              </div>
              {COMPARISON.map((row, i) => (
                <div key={i} className={`grid grid-cols-3 gap-4 p-5 text-sm ${i % 2 === 0 ? 'bg-white/[0.02]' : ''} border-b border-[#E5E9F2]/5 last:border-b-0 items-start`}>
                  <div className="font-display text-base text-white">{row.label}</div>
                  <div className="text-[#E5E9F2]/55 leading-relaxed">{row.traditional}</div>
                  <div className="text-[#E5E9F2]/90 leading-relaxed font-medium">{row.revo}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* COURSE MODULES */}
      <Reveal>
        <section id="course" className="py-28 md:py-36 bg-[#050812] border-y border-[#E5E9F2]/10 relative overflow-hidden">
          <div className="absolute inset-0 revo-grid-bg opacity-40" />
          <div className="relative max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="revo-chip mx-auto mb-6">The Course</div>
              <h2 className="font-display text-4xl md:text-6xl leading-tight mb-6">
                10 modules. <span className="revo-gold-text">30 days.</span> Certified.
              </h2>
              <p className="text-lg text-[#E5E9F2]/70">
                Self-paced, practical, and built by working roofers — not academics. Pass the final and you earn the Revo Certified Expert credential.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {COURSE_MODULES.map((m, i) => (
                <div key={i} className="revo-card rounded-xl p-5 group cursor-default">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="font-stat text-2xl font-bold revo-gold-text">{m.num}</div>
                    <div className="flex-1 h-px mt-4 bg-gradient-to-r from-[#D4A24C]/30 to-transparent" />
                  </div>
                  <h3 className="font-display text-base mb-2 leading-tight text-white group-hover:text-[#D4A24C] transition">{m.title}</h3>
                  <p className="text-xs text-[#E5E9F2]/60 leading-relaxed">{m.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link href="/register" className="revo-btn-primary inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold">
                Apply to Join the Next Cohort <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      {/* FAQ */}
      <Reveal>
        <section id="faq" className="py-28 md:py-36">
          <div className="max-w-4xl mx-auto px-6 md:px-12">
            <div className="text-center mb-14">
              <div className="revo-chip mx-auto mb-6">Questions & Answers</div>
              <h2 className="font-display text-4xl md:text-6xl leading-tight mb-4">
                Common questions, <span className="revo-gold-text">direct answers.</span>
              </h2>
              <p className="text-[#E5E9F2]/65">If your question isn&apos;t here, use the support button in the bottom-left — Paul reviews every ticket personally.</p>
            </div>
            <div className="space-y-3">
              {FAQ_ITEMS.map((f, i) => (
                <details key={i} className="revo-card rounded-2xl p-6 group">
                  <summary className="flex items-center justify-between cursor-pointer">
                    <span className="font-display text-lg pr-6">{f.q}</span>
                    <ChevronDown className="w-5 h-5 text-[#D4A24C] transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 text-[#E5E9F2]/75 text-base leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* FINAL CTA */}
      <Reveal>
        <section className="relative py-32 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1565402170291-8491f14678db?w=2000&q=85&auto=format&fit=crop)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1F] via-transparent to-[#0A0F1F]" />
          <div className="relative max-w-4xl mx-auto px-6 md:px-12 text-center">
            <div className="revo-chip mx-auto mb-6 border-[#D4A24C]/50 bg-[#D4A24C]/15">
              <Sparkles className="w-3 h-3" /> Cohort 3 · Closing Soon
            </div>
            <h2 className="font-display text-5xl md:text-7xl leading-[1.05] mb-8">
              The first 200 experts<br />
              <span className="revo-gradient-text">define the network.</span>
            </h2>
            <p className="text-lg md:text-xl text-[#E5E9F2]/75 mb-10 max-w-2xl mx-auto leading-relaxed">
              Paul Mikel personally reviews every application. Average response time is 48 hours. Financing available for the course.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="revo-btn-primary px-10 py-5 rounded-full font-bold text-lg inline-flex items-center justify-center gap-2">
                Apply Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/contact" className="revo-btn-ghost px-10 py-5 rounded-full font-semibold text-lg inline-flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" /> Talk to Paul
              </Link>
            </div>
            <div className="mt-12 flex flex-col md:flex-row justify-center items-center gap-6 text-sm text-[#E5E9F2]/55">
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#D4A24C]" /> 30-day money-back certification guarantee</span>
              <span className="hidden md:inline">·</span>
              <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-[#D4A24C]" /> 12 US markets · Expanding monthly</span>
            </div>
          </div>
        </section>
      </Reveal>

      <RevoFooter />
      <RevoSupportWidget />
    </main>
  );
}

function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.12 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {children}
    </div>
  );
}

function EarningsCalculator() {
  const [jobsPerMonth, setJobsPerMonth] = useState(6);
  const [avgTicket, setAvgTicket] = useState(12000);
  const [commission, setCommission] = useState(18);
  const monthly = (jobsPerMonth * avgTicket * commission) / 100;
  const annual = monthly * 12;

  return (
    <section id="earnings" className="py-28 md:py-36 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] revo-spot-gold pointer-events-none opacity-60" />
      <div className="relative max-w-6xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="revo-chip mb-6">Earnings Calculator</div>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.05] mb-6">
            Your income, <span className="revo-gold-text">modeled live.</span>
          </h2>
          <p className="text-lg text-[#E5E9F2]/70 leading-relaxed mb-8">
            Adjust the sliders to your market. Real Revo experts average 4–8 inspections per month at $9K–$18K per ticket, depending on market and storm activity. Commissions vary by tier.
          </p>
          <div className="space-y-6">
            <Slider label="Jobs per month" value={jobsPerMonth} min={1} max={20} step={1} onChange={setJobsPerMonth} format={v => `${v} jobs`} />
            <Slider label="Average ticket" value={avgTicket} min={3000} max={45000} step={500} onChange={setAvgTicket} format={v => `$${v.toLocaleString()}`} />
            <Slider label="Your commission %" value={commission} min={10} max={35} step={1} onChange={setCommission} format={v => `${v}%`} />
          </div>
        </div>

        <div className="revo-card rounded-3xl p-8 md:p-10 relative overflow-hidden">
          <div className="absolute inset-0 revo-grid-bg-small opacity-60 pointer-events-none" />
          <div className="relative">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A24C] font-semibold mb-3">Projected Earnings</div>
            <div className="mb-8">
              <div className="text-xs text-[#E5E9F2]/50 mb-2">Monthly</div>
              <div className="font-stat text-5xl md:text-6xl font-bold text-white">
                ${monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="revo-section-divider mb-8" />
            <div className="mb-8">
              <div className="text-xs text-[#E5E9F2]/50 mb-2">Annual</div>
              <div className="font-stat text-6xl md:text-7xl font-bold revo-gold-text leading-none">
                ${annual.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-[#E5E9F2]/50 mt-3">Top 10% of Revo experts exceed $180K annually</div>
            </div>
            <Link href="/register" className="revo-btn-primary w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold">
              Apply to Earn This <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Slider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <label className="text-sm text-[#E5E9F2]/75">{label}</label>
        <span className="font-stat text-lg font-semibold text-[#D4A24C]">{format(value)}</span>
      </div>
      <div className="relative">
        <div className="h-1.5 rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-[#D4A24C] to-[#E5B366]" style={{ width: `${pct}%` }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-[#D4A24C] shadow-lg pointer-events-none"
          style={{ left: `calc(${pct}% - 10px)` }}
        />
      </div>
    </div>
  );
}
