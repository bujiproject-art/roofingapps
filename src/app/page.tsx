import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="revo-hero-bg min-h-screen">
      {/* NAV */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4A24C] to-[#3B82F6] flex items-center justify-center text-[#0A0F1F] font-bold text-xl">R</div>
          <span className="font-display text-xl tracking-tight">Revo Roofing AI</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-[#E5E9F2]/80 hover:text-white text-sm transition">Login</Link>
          <Link href="/register" className="px-5 py-2.5 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold text-sm hover:bg-[#E5B366] transition">Become an Expert</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 pt-24 pb-32 text-center">
        <div className="revo-fade-up text-[#D4A24C] uppercase tracking-[0.3em] text-xs font-semibold mb-6">The Future of Roofing</div>
        <h1 className="revo-fade-up revo-fade-up-delay-1 font-display text-5xl md:text-7xl leading-[0.95] font-bold mb-8">
          Become a <span className="revo-gradient-text">Certified AI Roofing Expert</span><br />
          in 30 Days.
        </h1>
        <p className="revo-fade-up revo-fade-up-delay-2 text-xl md:text-2xl text-[#E5E9F2]/80 max-w-3xl mx-auto mb-12 leading-relaxed">
          Drone inspections. AI damage analysis. Instant proposals. A platform that turns ambitious entrepreneurs into six-figure roofing consultants — backed by Revo.
        </p>
        <div className="revo-fade-up revo-fade-up-delay-3 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/register" className="px-8 py-4 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-bold text-base hover:bg-[#E5B366] transition shadow-xl shadow-[#D4A24C]/20">
            Start Your Application →
          </Link>
          <Link href="#how" className="px-8 py-4 rounded-full border border-[#E5E9F2]/20 hover:border-[#E5E9F2]/50 text-[#E5E9F2] transition">
            How It Works
          </Link>
        </div>
      </section>

      {/* VALUE STRIP */}
      <section id="how" className="border-t border-[#E5E9F2]/10 py-20">
        <div className="max-w-6xl mx-auto px-6 md:px-12 grid md:grid-cols-3 gap-12">
          {[
            { title: 'AI-Powered Inspections', body: 'Fly a drone, upload photos, get a professional damage report in seconds. Claude vision, GPT, or Gemini — your choice.' },
            { title: 'Instant Proposals', body: 'From inspection to signed contract in one meeting. Proposals auto-generated from ATTOM property data + your pricing.' },
            { title: 'Full CRM + Training', body: 'Your own pipeline, your own customers, backed by our 10-module training course and live expert community.' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4A24C] to-[#3B82F6] mx-auto mb-6" />
              <h3 className="font-display text-2xl mb-4">{item.title}</h3>
              <p className="text-[#E5E9F2]/70 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 text-center border-t border-[#E5E9F2]/10">
        <h2 className="font-display text-4xl md:text-5xl mb-6">The First 100 Experts<br /><span className="revo-gradient-text">Define the Network.</span></h2>
        <p className="text-[#E5E9F2]/70 text-lg mb-10 max-w-2xl mx-auto">Apply now. Paul Mikel reviews every application personally.</p>
        <Link href="/register" className="inline-block px-10 py-5 rounded-full bg-gradient-to-r from-[#D4A24C] to-[#3B82F6] text-[#0A0F1F] font-bold text-lg hover:opacity-90 transition shadow-2xl">
          Apply to Become an Expert
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#E5E9F2]/10 py-8 px-6 md:px-12 text-sm text-[#E5E9F2]/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>© 2026 Revo Roofing AI. Built with Agent Midas.</div>
        <div className="flex gap-6">
          <Link href="/login" className="hover:text-[#E5E9F2] transition">Expert Login</Link>
          <Link href="mailto:paul@revoride.com" className="hover:text-[#E5E9F2] transition">Contact Paul</Link>
        </div>
      </footer>
    </main>
  );
}
