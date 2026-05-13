import { EmptyState } from '@/components/RevoUI';
import { Sparkles } from 'lucide-react';

export default function Page() {
  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-4xl mb-2">Courses</h1>
      <p className="text-[#E5E9F2]/60 mb-8">Author and edit the 10-module training course.</p>
      <EmptyState
        icon={Sparkles}
        title="Phase 2 — coming soon"
        body="This area is scaffolded and ready to wire up. The schema is live; the UI is on the next sprint."
      />
    </main>
  );
}
