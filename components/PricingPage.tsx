import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Shield, IndianRupee, ArrowRight, Star } from 'lucide-react';
import { CREDIT_PACKS } from '../constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PricingPageProps {
  onBuyClick: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onBuyClick }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-[#0f2a43] text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#00a3e0] rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#00a3e0] rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
          >
            Understand Your Prescription.<br />
            <span className="text-[#00a3e0]">Save Money. Stay Safe.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto"
          >
            Simple AI analysis starting at just ₹2 per scan. Avoid overpaying for medicines and get smart healthcare insights.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={onBuyClick}
            className="bg-[#00a3e0] hover:bg-[#0092c9] text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-[#00a3e0]/20 flex items-center mx-auto space-x-2"
          >
            <span>Buy Credits Now</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#0f2a43] mb-16">How it Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: 1, title: 'Upload Prescription', desc: 'Take a photo or upload your medical document securely.' },
              { step: 2, title: 'Get AI Analysis', desc: 'Our AI decodes jargon and identifies branded medicines.' },
              { step: 3, title: 'Save Money', desc: 'Get generic alternatives and cost benchmarks instantly.' }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-[#e0f2fe] text-[#00a3e0] rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-[#0f2a43] mb-3">{item.title}</h3>
                <p className="text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {CREDIT_PACKS.map((pack) => (
              <motion.div
                key={pack.id}
                whileHover={{ y: -10 }}
                className={cn(
                  "relative bg-white p-8 rounded-[2.5rem] border transition-all",
                  pack.id === 'popular' ? "border-[#00a3e0] shadow-2xl scale-105 z-10" : "border-slate-100 shadow-sm"
                )}
              >
                {pack.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00a3e0] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                    {pack.badge}
                  </div>
                )}

                <div className="text-center mb-8">
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">{pack.label}</p>
                  <h3 className="text-2xl font-bold text-[#0f2a43] mb-4">{pack.name}</h3>
                  <div className="flex items-center justify-center mb-2">
                    <IndianRupee className="w-6 h-6 text-[#0f2a43]" />
                    <span className="text-5xl font-black text-[#0f2a43]">{pack.price}</span>
                  </div>
                  <p className="text-[#00a3e0] font-bold">{pack.credits} Credits</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Equivalent Usage</p>
                    <p className="text-sm font-bold text-[#0f2a43]">
                      ≈ {pack.credits} Basic Scans <br />
                      <span className="text-slate-400 font-normal">OR</span> {Math.floor(pack.credits / 3)} Pro Insights
                    </p>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center text-sm text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500 mr-2" />
                      <span>Instant AI Analysis</span>
                    </li>
                    <li className="flex items-center text-sm text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500 mr-2" />
                      <span>Generic Medicine Finder</span>
                    </li>
                    <li className="flex items-center text-sm text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500 mr-2" />
                      <span>Cost Benchmarking</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={onBuyClick}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold transition-all",
                    pack.id === 'popular'
                      ? "bg-[#00a3e0] text-white hover:bg-[#0092c9] shadow-lg shadow-[#00a3e0]/20"
                      : "bg-slate-100 text-[#0f2a43] hover:bg-slate-200"
                  )}
                >
                  Buy Now
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-[#0f2a43] mb-12">Compare Analysis Modes</h2>
          <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-6 font-bold text-[#0f2a43]">Feature</th>
                  <th className="p-6 font-bold text-[#0f2a43] text-center">Basic (1 Credit)</th>
                  <th className="p-6 font-bold text-[#00a3e0] text-center">Pro (3 Credits)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: 'Medicine Explanation', basic: true, pro: true },
                  { name: 'Generic Alternatives', basic: false, pro: true },
                  { name: 'Cost Savings Insight', basic: false, pro: true },
                  { name: 'Safety Warnings', basic: false, pro: true },
                  { name: 'Structured Data', basic: 'Limited', pro: 'Full' }
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="p-6 text-slate-600 font-medium">{row.name}</td>
                    <td className="p-6 text-center">
                      {typeof row.basic === 'boolean' ? (
                        row.basic ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : <span className="text-slate-300">—</span>
                      ) : <span className="text-sm font-bold text-slate-400">{row.basic}</span>}
                    </td>
                    <td className="p-6 text-center bg-[#e0f2fe]/30">
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? <Check className="w-5 h-5 text-[#00a3e0] mx-auto" /> : <span className="text-slate-300">—</span>
                      ) : <span className="text-sm font-bold text-[#00a3e0]">{row.pro}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-12 text-slate-400 font-bold uppercase tracking-widest text-xs">
            <div className="flex items-center space-x-2">
              <span>Built for Indian users 🇮🇳</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Reduced Healthcare Costs</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Private &amp; Secure</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
