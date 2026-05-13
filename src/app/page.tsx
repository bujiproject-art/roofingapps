import Link from 'next/link';
import { Camera, FileSignature, Users, Sparkles, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="revo-hero-bg min-h-screen overflow-x-hidden">
      {/* NAV */}
      <nav className="flex items-center justify-between px-5 md:px-12 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4A24C] to-[#3B82F6] flex items-center justify-center text-[#0A0F1F] font-bold text-xl shadow-lg shadow-[#D4A24C]/25">R</div>
          <span className="font-display text-lg md:text-xl tracking-tight">Revo Roofing AI</span>
        </Link>
        <div className="flex items-center gap-3 md:gap-5">
          <Link href="/login" className="text-[#E5E9F2]/80 hover:text-white text-sm font-medium transition">Login</Link>
          <Link href="/register" className="revo-btn revo-btn-primary !py-2.5 !px-5 !text-sm">Become an Expert</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-5 md:px-12 pt-12 md:pt-20 pb-24 md:pb-32 text-center">
        <div className="revo-fade-up text-[#D4A24C] uppercase tracking-[0.3em] text-[11px] md:text-xs font-semibold mb-5 md:mb-6">
          <Sparkles className="inline w-3.5 h-3.5 mr-2 -mt-0.5" />
          The Future of Roofing
        </div>
        <h1 className="revo-fade-up revo-fade-up-delay-1 font-display font-bold mb-6 md:mb-8 leading-[0.95]" style={{ fontSize: 'var(--type-display)' }}>
          Become a <span className="revo-gradient-text">Certified AI Roofing Expert</span><br className="hidden sm:inline" />
          <span className="sm:hidden"> </span>in 30 Days.
        </h1>
        <p className="revo-fade-up revo-fade-up-delay-2 text-[#E5E9F2]/85 max-w-3xl mx-auto mb-10 md:mb-12 leading-relaxed px-2" style={{ fontSize: 'var(--type-body)' }}>
          Drone inspections. AI damage analysis. Instant proposals. A platform that turns ambitious entrepreneurs into six-figure roofing consultants — backed by Revo.
        </p>
        <div className="revo-fade-up revo-fade-up-delay-3 flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto">
          <Link href="/register" className="revo-btn revo-btn-primary">
            Start Your Application <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="#how" className="revo-btn revo-btn-ghost">
            How It Works
          </Link>
        </div>

        {/* Social proof strip */}
        <div className="revo-fade-up revo-fade-up-delay-4 mt-14 md:mt-20 grid grid-cols-3 gap-4 md:gap-12 max-w-3xl mx-auto">
          <Stat value="9" label="Founding experts" />
          <Stat value="~3s" label="AI roof analysis" />
          <Stat value="30 days" label="To certification" />
        </div>
      </section>

      {/* VALUE STRIP */}
      <section id="how" className="border-t border-[#E5E9F2]/10 py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-5 md:px-12">
          <div className="text-center mb-12 md:mb-16">
            <div className="text-[#D4A24C] uppercase tracking-[0.3em] text-[11px] font-semibold mb-3">How it works</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">Three tools. <span className="revo-gradient-text">One unfair advantage.</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              { icon: Camera, title: 'AI-Powered Inspections', body: 'Fly a drone, upload photos, get a professional damage report in under 3 seconds. GPT-4o Vision identifies missing shingles, flashing failure, and storm damage with 91% confidence.' },
              { icon: FileSignature, title: 'Instant Proposals', body: 'From inspection to signed contract in one meeting. Proposals auto-generated from ATTOM property data plus your pricing — emailed before the homeowner walks back inside.' },
              { icon: Users, title: 'Full CRM + Training', body: 'Your own pipeline, your own customers, plus a 10-module certification course and a network of experts trading wins, scripts, and storm tips daily.' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="text-center group">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4A24C] to-[#3B82F6] mx-auto mb-6 flex items-center justify-center shadow-lg shadow-[#D4A24C]/25 group-hover:scale-110 group-hover:shadow-[#D4A24C]/40 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    <Icon className="w-7 h-7 text-[#0A0F1F]" />
                  </div>
                  <h3 className="font-display text-2xl mb-3">{item.title}</h3>
                  <p className="text-[#E5E9F2]/70 leading-relaxed">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 px-5 md:px-12 text-center border-t border-[#E5E9F2]/10">
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 md:mb-6 leading-tight">
          The First 100 Experts<br /><span className="revo-gradient-text">Define the Network.</span>
        </h2>
        <p className="text-[#E5E9F2]/75 text-base md:text-lg mb-8 md:mb-10 max-w-2xl mx-auto">
          Apply now. Paul Mikel reviews every application personally.
        </p>
        <Link href="/register" className="revo-btn revo-btn-gradient !text-base md:!text-lg !px-10 md:!px-12 !py-4 md:!py-5">
          Apply to Become an Expert <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#E5E9F2]/10 py-8 px-5 md:px-12 text-sm text-[#E5E9F2]/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>© 2026 Revo Roofing AI. Built with Agent Midas.</div>
        <div className="flex gap-6">
          <Link href="/login" className="hover:text-[#E5E9F2] transition">Expert Login</Link>
          <Link href="mailto:paul@revoride.com" className="hover:text-[#E5E9F2] transition">Contact Paul</Link>
        </div>
      </footer>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl md:text-5xl text-[#D4A24C] mb-1 md:mb-2">{value}</div>
      <div className="text-[10px] md:text-xs uppercase tracking-widest text-[#E5E9F2]/55">{label}</div>
    </div>
  );
}
