import {
  ShieldCheck,
  FileCheck2,
  UserCheck
} from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-100 py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#0d9488_0.7px,transparent_0.7px)] [background-size:24px_24px] opacity-15"></div>

        <div className="relative max-w-4xl mx-auto z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-100 text-sm font-semibold text-brand-700 mb-6">
            <ShieldCheck className="h-5 w-5" />
            <span>Empowering Bangladeshi Communities with Honest Reviews</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6">
            Find the Truth About <br />
            <span className="text-gradient">
              Doctors, Hospitals & Services
            </span>
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            TruthHubBD is a community-driven transparency platform where people
            can share honest experiences and help others make informed decisions.
            No sponsored rankings, no fake reviews—just real stories from real
            people.
          </p>
        </div>
      </section>

      {/* Trust Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">
            Why Choose TruthHubBD?
          </h2>
          <p className="text-slate-500 mt-3">
            Built with transparency, trust, and accountability in mind.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Card 1 */}
          <div className="bg-white border rounded-2xl p-8 shadow-sm hover:shadow-lg transition">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-700 mb-5">
              <FileCheck2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold mb-3">
              Evidence-Based Reviews
            </h3>

            <p className="text-slate-600">
              Users can upload supporting documents such as receipts,
              prescriptions, or appointment slips to increase the credibility of
              their reviews.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border rounded-2xl p-8 shadow-sm hover:shadow-lg transition">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-teal-50 text-teal-700 mb-5">
              <UserCheck className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold mb-3">
              Anonymous Reviews
            </h3>

            <p className="text-slate-600">
              Users can safely share their experiences anonymously without
              revealing their identity while helping others stay informed.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border rounded-2xl p-8 shadow-sm hover:shadow-lg transition">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-700 mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold mb-3">
              Community Moderation
            </h3>

            <p className="text-slate-600">
              Reviews are monitored through community reporting and moderation to
              reduce spam, fake reviews, and misleading information.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}