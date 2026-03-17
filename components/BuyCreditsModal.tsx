import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, IndianRupee, Loader2, Sparkles } from 'lucide-react';
import { CREDIT_PACKS } from '../constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCredits: number) => void;
  userId: string;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onClose, onSuccess, userId }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePayment = async (packId: string) => {
    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (!pack) return;

    setLoading(packId);

    try {
      // 1. Create Order
      const orderRes = await fetch('/.netlify/functions/create-order', {
        method: 'POST',
        body: JSON.stringify({
          amount: pack.price,
          receipt: `receipt_${Date.now()}`,
        }),
      });
      const order = await orderRes.json();

      // 2. Open Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Prescription IQ',
        description: `Purchase ${pack.credits} Credits`,
        order_id: order.id,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // 3. Verify Payment
          const verifyRes = await fetch('/.netlify/functions/verify-payment', {
            method: 'POST',
            body: JSON.stringify({
              ...response,
              userId,
              creditsToAdd: pack.credits
            }),
          });
          const result = await verifyRes.json();
          
          if (result.success) {
            setSuccess(true);
            setTimeout(() => {
              onSuccess(result.newCredits);
              onClose();
              setSuccess(false);
            }, 2000);
          }
        },
        prefill: {
          name: '',
          email: '',
        },
        theme: {
          color: '#00a3e0',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0f2a43]/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl"
        >
          {success ? (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-[#0f2a43] mb-2">Payment Successful!</h2>
              <p className="text-slate-500">Your credits have been added to your account.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center p-8 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-bold text-[#0f2a43]">Refill Credits</h2>
                  <p className="text-sm text-slate-500">Choose a pack to continue your analysis</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {CREDIT_PACKS.map((pack) => (
                  <div
                    key={pack.id}
                    className={cn(
                      "relative p-6 rounded-3xl border transition-all flex flex-col",
                      pack.id === 'popular' ? "border-[#00a3e0] bg-[#e0f2fe]/10" : "border-slate-100"
                    )}
                  >
                    {pack.badge && (
                      <span className="absolute -top-3 left-6 bg-[#00a3e0] text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {pack.badge}
                      </span>
                    )}
                    <div className="mb-6">
                      <h3 className="font-bold text-[#0f2a43] mb-1">{pack.name}</h3>
                      <p className="text-xs text-slate-500">{pack.label}</p>
                    </div>
                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <IndianRupee className="w-4 h-4 text-[#0f2a43]" />
                        <span className="text-3xl font-black text-[#0f2a43]">{pack.price}</span>
                      </div>
                      <p className="text-[#00a3e0] font-bold text-sm">{pack.credits} Credits</p>
                    </div>
                    <div className="mt-auto">
                      <button
                        disabled={!!loading}
                        onClick={() => handlePayment(pack.id)}
                        className={cn(
                          "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2",
                          pack.id === 'popular' 
                            ? "bg-[#00a3e0] text-white hover:bg-[#0092c9]" 
                            : "bg-slate-100 text-[#0f2a43] hover:bg-slate-200"
                        )}
                      >
                        {loading === pack.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>Buy Now</span>
                            <Sparkles className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">
                  Secure payment via Razorpay. 1 Credit ≈ ₹2. Credits never expire.
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
