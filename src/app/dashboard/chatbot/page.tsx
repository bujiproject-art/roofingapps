'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';

interface Msg { role: 'user' | 'assistant'; content: string; }

const SUGGESTIONS = [
  'How do I document hail damage for an insurance claim?',
  'What\'s the difference between a 3-tab and architectural shingle?',
  'How do I price a 2,400 sqft asphalt re-roof in Atlanta?',
  'When do I need to recommend full replacement vs repair?',
  'What questions should I ask on a first homeowner phone call?',
];

const ANSWERS: Record<string, string> = {
  'hail': `When documenting hail damage for an insurance claim, walk the roof systematically. Photograph every damaged shingle in clusters of three (wide, medium, close-up) so the adjuster can see scale. Mark the impact dimples with chalk before shooting — the chalk picks up the bruise edge in the photo even when the human eye misses it. Hit four reference items: the soft metals (vents, flashings) since they record hail size, the gutters, the AC fins, and at least one window screen. Hailstones leave shiny exposure spots where granules have been knocked off — those are the money shots. Cross-reference the date with NOAA Storm Events or HailTrace for the property\'s zip code; the report ID becomes evidence the adjuster can\'t argue with.`,
  '3-tab': `A 3-tab is a single-layer asphalt shingle with three cutouts that look like three separate tabs once installed — flat, traditional, around $70/sq materials. Architectural (also called dimensional or laminated) is a two-layer shingle with random tab shapes that creates a textured wood-shake look — $110-130/sq materials, 30-50 year warranties vs 20-25 on 3-tab, and they hold up much better in 60+ mph wind because the laminated layer is harder to lift. For most retail Atlanta-area roofs you\'re selling architectural — the price difference per square foot is small, the curb appeal is dramatically better, and the wind warranty closes deals when you mention storms.`,
  'price': `A 2,400 sqft asphalt re-roof in Atlanta in 2026 typically prices at $11,500 to $16,800 retail. Build it: 24 squares roof area (assume 1.0x pitch factor for 4/12-6/12), $110/sq architectural shingle = $2,640 materials, $680 underlayment + ice/water shield, $420 starter + ridge, $580 flashings/boots/vents, $1,200 dump fees and tearoff disposal, $3,000-4,500 labor (8-10 man-hours), $300-500 permits depending on county. Add 18-22% margin. If the customer is insurance-assisted you can write the proposal at the Xactimate price and skip the homeowner-side haggle. Always include a written warranty and at least one upgrade line item — sales close 23% higher when there\'s a labeled "good / better / best" rather than one number.`,
  'replace': `Replace, don\'t repair, when ANY of these are true: roof is past 80% of its expected service life (so 20+ years on 25-year shingles), more than three areas of damage, granule loss is widespread (not just along one ridge), decking has visible sagging, you can see daylight from inside the attic, two or more layers are already on the roof, OR the homeowner is pursuing an insurance claim and the adjuster has approved replacement. Repair-only when: damage is localized to one storm event, fewer than 25 shingles affected, roof is under 12 years old, and the homeowner has explicitly declined a replacement quote. Always present both options in the proposal — if you only quote replacement, you look greedy; if you only quote repair, you leave money on the table when they were going to replace anyway.`,
  'first': `On the first homeowner phone call, you want six things in under 8 minutes: 1) Property address and year built (gives you roof age estimate). 2) What prompted the call — leak, storm, age, insurance, sale of home. The answer tells you whether you\'re selling, repairing, or providing documentation. 3) Have you contacted your insurance company yet — and if yes, do you have a claim number. 4) Are you the homeowner or a property manager. 5) What is the best time to walk the roof for an inspection — same-day if possible because urgency closes deals. 6) What\'s the best email for the proposal. End the call with a confirmed appointment slot and a text-message confirmation. Don\'t price on the phone — every minute spent quoting before you\'ve seen the roof costs you 4x conversion.`,
};

const FALLBACK = `Great question. The Revo AI knowledge base covers shingle systems, insurance claims, pricing, sales process, and code compliance across all 50 states. Try one of the suggested questions, or ask me about a specific damage type, customer scenario, or regional permitting requirement.`;

function answerFor(q: string): string {
  const lc = q.toLowerCase();
  if (lc.includes('hail') || lc.includes('insurance claim')) return ANSWERS['hail'];
  if (lc.includes('3-tab') || lc.includes('architectural') || lc.includes('shingle')) return ANSWERS['3-tab'];
  if (lc.includes('price') || lc.includes('cost') || lc.includes('quote')) return ANSWERS['price'];
  if (lc.includes('replace') || lc.includes('repair')) return ANSWERS['replace'];
  if (lc.includes('first') || lc.includes('phone') || lc.includes('call')) return ANSWERS['first'];
  return FALLBACK;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, thinking]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: q }]);
    setThinking(true);
    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Fall back to the canned keyword answer so the demo never dead-ends
        const fallback = (data.error as string) || answerFor(q);
        setMessages(m => [...m, { role: 'assistant', content: fallback }]);
      } else {
        setMessages(m => [...m, { role: 'assistant', content: data.answer || answerFor(q) }]);
      }
    } catch {
      // Network error → canned keyword answer fallback
      setMessages(m => [...m, { role: 'assistant', content: answerFor(q) }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <main className="flex flex-col h-[calc(100vh-0px)]">
      <header className="px-8 py-6 border-b border-[#E5E9F2]/10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-[#D4A24C]" /><span className="text-xs uppercase tracking-widest text-[#D4A24C]">Revo AI</span></div>
          <h1 className="font-display text-3xl">Ask the network</h1>
          <p className="text-sm text-[#E5E9F2]/60">Trained on 60+ years of roofing expertise from the Revo expert network.</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-[#E5E9F2]/60 mb-4">Try one of these to start:</p>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} className="block w-full text-left p-4 rounded-xl bg-[#0F1729] border border-[#E5E9F2]/10 hover:border-[#D4A24C]/40 hover:bg-[#0F1729]/80 transition">
                  <span className="text-sm">{s}</span>
                </button>
              ))}
            </div>
          )}
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-[#D4A24C] text-[#0A0F1F]' : 'bg-[#0F1729] border border-[#E5E9F2]/10'}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="bg-[#0F1729] border border-[#E5E9F2]/10 p-4 rounded-2xl flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4A24C]" />
                  <span className="text-sm text-[#E5E9F2]/70">Revo AI is thinking…</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); send(); }} className="border-t border-[#E5E9F2]/10 p-6">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Revo AI…" className="flex-1 px-5 py-3 rounded-full bg-[#0F1729] border border-[#E5E9F2]/10 text-white placeholder-[#E5E9F2]/30 focus:border-[#D4A24C] focus:outline-none" />
          <button type="submit" disabled={!input.trim() || thinking} className="px-6 py-3 rounded-full bg-[#D4A24C] text-[#0A0F1F] font-semibold disabled:opacity-40 hover:bg-[#E5B366] transition flex items-center gap-2">
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </form>
    </main>
  );
}
