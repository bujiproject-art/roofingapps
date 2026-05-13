import Link from 'next/link';
import RevoLogo from './RevoLogo';

export default function RevoFooter() {
  return (
    <footer className="relative border-t border-[#E5E9F2]/10 bg-gradient-to-b from-[#0A0F1F] to-[#050812] overflow-hidden">
      <div className="revo-grid-bg-small absolute inset-0 opacity-60" />
      <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-12">
          <div className="col-span-2 md:col-span-2">
            <RevoLogo size={42} showWordmark />
            <p className="mt-5 text-sm text-[#E5E9F2]/60 leading-relaxed max-w-xs">
              The AI-powered platform training the next generation of roofing experts. Drone intelligence. Instant proposals. Measurable income.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <SocialLink href="https://www.facebook.com" label="Facebook" icon="facebook" />
              <SocialLink href="https://www.instagram.com" label="Instagram" icon="instagram" />
              <SocialLink href="https://www.linkedin.com" label="LinkedIn" icon="linkedin" />
              <SocialLink href="https://www.youtube.com" label="YouTube" icon="youtube" />
              <SocialLink href="https://x.com" label="X" icon="x" />
              <SocialLink href="https://www.tiktok.com" label="TikTok" icon="tiktok" />
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-[#E5E9F2]/50">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 revo-pulse-slow" />
              <span>Accepting applications from 12 US markets</span>
            </div>
          </div>

          <FooterCol title="For Experts">
            <FooterLink href="/register">Apply Now</FooterLink>
            <FooterLink href="/login">Expert Login</FooterLink>
            <FooterLink href="/#course">Training Course</FooterLink>
            <FooterLink href="/#earnings">Earnings Calculator</FooterLink>
            <FooterLink href="/#community">Expert Community</FooterLink>
          </FooterCol>

          <FooterCol title="For Customers">
            <FooterLink href="/contact">Book an Inspection</FooterLink>
            <FooterLink href="/#features">How It Works</FooterLink>
            <FooterLink href="/#insurance">Insurance Claims</FooterLink>
            <FooterLink href="/#faq">FAQ</FooterLink>
          </FooterCol>

          <FooterCol title="Company">
            <FooterLink href="/contact">Contact Paul</FooterLink>
            <FooterLink href="/#story">Our Story</FooterLink>
            <FooterLink href="/#leaderboard">Leaderboard</FooterLink>
            <FooterLink href="https://agentmidas.xyz" external>Powered by Agent Midas</FooterLink>
          </FooterCol>

          <FooterCol title="Legal">
            <FooterLink href="/terms">Terms of Service</FooterLink>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
            <FooterLink href="/privacy#cookies">Cookie Policy</FooterLink>
            <FooterLink href="/privacy#accessibility">Accessibility</FooterLink>
            <FooterLink href="/contact">Support</FooterLink>
          </FooterCol>
        </div>

        <div className="revo-section-divider mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#E5E9F2]/45">
          <div className="flex items-center gap-4 flex-wrap">
            <span>© 2026 Revo Roofing AI · A Revo Ride Inc. company</span>
          </div>
          <div className="flex items-center gap-5 flex-wrap">
            <span>paul@revoride.com</span>
            <span className="hidden md:inline">·</span>
            <Link href="https://agentmidas.xyz" target="_blank" rel="noreferrer" className="hover:text-[#D4A24C] transition">
              Built on the Agent Midas Supra stack
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-[#D4A24C] mb-4">{title}</div>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  const externalProps = external ? { target: '_blank', rel: 'noreferrer' } : {};
  return (
    <li>
      <Link href={href} {...externalProps} className="text-sm text-[#E5E9F2]/70 hover:text-[#D4A24C] transition">
        {children}
      </Link>
    </li>
  );
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const paths: Record<string, React.ReactNode> = {
    facebook: <path d="M22 12a10 10 0 1 0-11.56 9.88v-7H8v-2.88h2.44V9.84c0-2.4 1.44-3.74 3.64-3.74 1.06 0 2.16.18 2.16.18v2.38h-1.22c-1.2 0-1.58.74-1.58 1.52v1.82h2.68L15.67 15h-2.23v7A10 10 0 0 0 22 12Z" />,
    instagram: <path d="M12 2.16c3.2 0 3.58 0 4.85.07 1.17.05 1.81.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.37 1.06.42 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.81-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.17-1.06.37-2.23.42-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.81-.25-2.23-.42-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.17-.42-.37-1.06-.42-2.23C2.17 15.58 2.16 15.2 2.16 12s0-3.58.07-4.85c.05-1.17.25-1.81.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.06-.37 2.23-.42C8.42 2.17 8.8 2.16 12 2.16Zm0 1.8c-3.15 0-3.5 0-4.74.07-1.07.05-1.65.23-2.04.38-.51.2-.88.44-1.26.82-.38.38-.62.75-.82 1.26-.15.39-.33.97-.38 2.04-.06 1.23-.07 1.59-.07 4.74s0 3.5.07 4.74c.05 1.07.23 1.65.38 2.04.2.51.44.88.82 1.26.38.38.75.62 1.26.82.39.15.97.33 2.04.38 1.23.06 1.59.07 4.74.07s3.5 0 4.74-.07c1.07-.05 1.65-.23 2.04-.38.51-.2.88-.44 1.26-.82.38-.38.62-.75.82-1.26.15-.39.33-.97.38-2.04.06-1.23.07-1.59.07-4.74s0-3.5-.07-4.74c-.05-1.07-.23-1.65-.38-2.04-.2-.51-.44-.88-.82-1.26-.38-.38-.75-.62-1.26-.82-.39-.15-.97-.33-2.04-.38-1.23-.06-1.59-.07-4.74-.07Zm0 3.07a5.04 5.04 0 1 1 0 10.08 5.04 5.04 0 0 1 0-10.08Zm0 8.3a3.26 3.26 0 1 0 0-6.52 3.26 3.26 0 0 0 0 6.52Zm6.4-8.5a1.18 1.18 0 1 1-2.36 0 1.18 1.18 0 0 1 2.36 0Z" />,
    linkedin: <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.62 0 4.28 2.38 4.28 5.47v6.27ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />,
    youtube: <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />,
    x: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />,
    tiktok: <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1Z" />,
  };
  return (
    <Link href={href} target="_blank" rel="noreferrer" aria-label={label} className="w-9 h-9 flex items-center justify-center rounded-full border border-[#E5E9F2]/15 hover:border-[#D4A24C] hover:bg-[#D4A24C]/10 transition">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-[#E5E9F2]/70 hover:text-[#D4A24C]">
        {paths[icon]}
      </svg>
    </Link>
  );
}
