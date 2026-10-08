import Link from 'next/link';

interface PolicySection {
  title: string;
  body: string;
}

interface PolicyPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  sections: PolicySection[];
}

export function PolicyPage({ eyebrow, title, intro, sections }: PolicyPageProps) {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 md:py-14">
      <div className="space-y-8">
        <header className="border-b border-eco-100 pb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-eco-700">{eyebrow}</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-slate-900 md:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{intro}</p>
        </header>

        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-eco-100 bg-white p-5 shadow-xs md:p-7">
              <h2 className="font-serif text-lg font-bold text-slate-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="rounded-2xl border border-jute-200 bg-jute-50 p-5 text-sm leading-7 text-jute-900">
          Business-specific terms such as retention periods, cancellation windows, delivery timelines, and any applicable charges require owner confirmation before being treated as final policy.
        </div>

        <p className="text-sm text-slate-600">
          Questions? Contact <Link href="/contact" className="font-bold text-eco-700 hover:underline">Ujwala Eco Products</Link>.
        </p>
      </div>
    </div>
  );
}