
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser, useAuth, useClerk, SignIn, SignUp } from '@clerk/clerk-react';
import { Layout } from './components/Layout.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { FileUploader } from './components/FileUploader.tsx';
import { AnalysisView } from './components/AnalysisView.tsx';
import { PricingPage } from './components/PricingPage.tsx';
import { BuyCreditsModal } from './components/BuyCreditsModal.tsx';
import { AnalysisModeToggle } from './components/AnalysisModeToggle.tsx';
import { ProUpsell } from './components/ProUpsell.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { analyzeMedicalDocument } from './services/geminiService.ts';
import { getCredits, deductCredits } from './services/creditService.ts';
import { AnalysisState, User, MedicalAnalysis } from './types.ts';
import { Loader2, AlertCircle, Sparkles, History, MapPin, ArrowRight } from 'lucide-react';
import { createClerkSupabaseClient } from './lib/supabase.ts';
import { ANALYSIS_COSTS } from './constants.ts';

const App: React.FC = () => {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded, userId } = useAuth();
  const { signOut } = useClerk();

  const isClerkLoaded = isAuthLoaded && (!userId || isUserLoaded);

  const [userCredits, setUserCredits] = useState<{ credits: number; role: string } | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'basic' | 'pro'>('basic');
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  useEffect(() => {
    // Environment check removed to reduce noise
  }, []);

  const getSafeToken = useCallback(async () => {
    try {
      return await getToken({ template: 'supabase' });
    } catch {
      console.warn('Clerk Supabase template not found, falling back to default token.');
      return await getToken();
    }
  }, [getToken]);

  const fetchUserCredits = useCallback(async () => {
    if (!userId || !clerkUser) return;
    try {
      const token = await getSafeToken();
      const email = clerkUser.primaryEmailAddress?.emailAddress || '';
      const creditsData = await getCredits(userId, token, email);
      setUserCredits(creditsData);
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    }
  }, [userId, clerkUser, getSafeToken]);

  useEffect(() => {
    if (userId && clerkUser) {
      fetchUserCredits();
    }
  }, [userId, clerkUser, fetchUserCredits]);

  useEffect(() => {
    if (isClerkLoaded) {
      return;
    }
  }, [isClerkLoaded]);

  const user: User | null = useMemo(() => {
    if (!clerkUser) return null;
    const email = clerkUser.primaryEmailAddress?.emailAddress || '';
    const ADMIN_EMAILS = ['rajathmpatil@gmail.com', 'rahulam19aug@gmail.com', 'bb.build.better@gmail.com'];
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

    return {
      id: clerkUser.id,
      email: email,
      name: clerkUser.fullName || clerkUser.firstName || 'User',
      cityTier: (clerkUser.publicMetadata?.cityTier as 'Tier-1' | 'Tier-2' | 'Tier-3') || 'Tier-1',
      credits: userCredits?.credits ?? 0,
      role: isAdmin ? 'admin' : (userCredits?.role ?? 'user')
    };
  }, [clerkUser, userCredits]);
  
  const [selectedCityTier, setSelectedCityTier] = useState<'Tier-1' | 'Tier-2' | 'Tier-3' | null>(null);
  const cityTier = selectedCityTier || user?.cityTier || 'Tier-1';

  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#login') setAuthView('login');
      else if (hash === '#signup') setAuthView('signup');
      else if (hash === '#landing' || !hash || hash === '#') setAuthView('landing');
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [state, setState] = useState<AnalysisState>({
    file: null, 
    preview: null, 
    isAnalyzing: false, 
    result: null, 
    error: null
  });
  const [history, setHistory] = useState<MedicalAnalysis[]>([]);
  const [view, setView] = useState<'scan' | 'history' | 'pricing' | 'admin'>('scan');

  const fetchHistory = useCallback(async (userId: string) => {
    try {
      const token = await getSafeToken();
      const supabase = createClerkSupabaseClient(token);
      
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setHistory(data.map(item => ({
          ...item.analysis_data,
          id: item.id,
          timestamp: new Date(item.created_at).getTime()
        })));
        return;
      }
    } catch (err) {
      console.warn('Failed to fetch history:', err);
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const localHistory = localStorage.getItem(`history_${userId}`);
        if (localHistory) setHistory(JSON.parse(localHistory));
      }
    } catch (e) {
      console.warn('LocalStorage access failed:', e);
    }
  }, [getSafeToken]);

  useEffect(() => {
    if (user) {
      fetchHistory(user.id);
    } else {
      setHistory([]);
    }
  }, [user, fetchHistory]);

  const handleLogout = async () => {
    await signOut();
    setAuthView('landing');
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setState(prev => ({ 
        ...prev, 
        file, 
        preview: reader.result as string, 
        error: null, 
        result: null 
      }));
      setView('scan');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!state.preview || !state.file || !user) return;

    const cost = ANALYSIS_COSTS[analysisMode.toUpperCase() as keyof typeof ANALYSIS_COSTS];
    
    // Check credits first (unless admin)
    if (user.role !== 'admin' && user.credits < cost) {
      setIsBuyModalOpen(true);
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    try {
      const base64Data = state.preview.split(',')[1];
      const result = await analyzeMedicalDocument(base64Data, state.file.type, cityTier, analysisMode === 'pro');
      
      const enriched = { 
        ...result, 
        id: Date.now().toString(), 
        timestamp: Date.now(),
        isPro: analysisMode === 'pro'
      };

      // Deduct credits
      const token = await getSafeToken();
      const newCredits = await deductCredits(user.id, cost, token);
      
      if (newCredits === null) {
        setState(prev => ({ ...prev, isAnalyzing: false, error: "Insufficient credits. Please refill." }));
        setIsBuyModalOpen(true);
        return;
      }
      
      setUserCredits(prev => prev ? { ...prev, credits: newCredits } : null);

      setState(prev => ({ ...prev, isAnalyzing: false, result: enriched }));
      
      setIsSaving(true);
      try {
        const supabase = createClerkSupabaseClient(token);
        await supabase.from('scans').insert({
          user_id: user.id,
          analysis_data: enriched,
          document_type: result.documentType,
          is_pro: analysisMode === 'pro'
        });
        fetchHistory(user.id);
      } catch (err) {
        console.error('Failed to save to Supabase:', err);
      }

      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const localKey = `history_${user.id}`;
          const currentLocal = JSON.parse(localStorage.getItem(localKey) || '[]');
          const updatedLocal = [enriched, ...currentLocal].slice(0, 50);
          localStorage.setItem(localKey, JSON.stringify(updatedLocal));
        }
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
      setIsSaving(false);
    } catch (err) {
      console.error('Analysis Error:', err);
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        error: err instanceof Error ? err.message : "Analysis failed. Please try again." 
      }));
    }
  };

  const handleUpgradeToPro = async () => {
    if (!state.result || !user) return;
    
    const upgradeCost = ANALYSIS_COSTS.PRO - ANALYSIS_COSTS.BASIC;
    
    if (user.role !== 'admin' && user.credits < upgradeCost) {
      setIsBuyModalOpen(true);
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    try {
      const base64Data = state.preview?.split(',')[1];
      if (!base64Data || !state.file) throw new Error("No file data found");

      const result = await analyzeMedicalDocument(base64Data, state.file.type, cityTier, true);
      
      const enriched = { 
        ...result, 
        id: state.result.id, 
        timestamp: state.result.timestamp,
        isPro: true
      };

      const token = await getSafeToken();
      const newCredits = await deductCredits(user.id, upgradeCost, token);
      
      if (newCredits === null) {
        setState(prev => ({ ...prev, isAnalyzing: false, error: "Insufficient credits for upgrade." }));
        setIsBuyModalOpen(true);
        return;
      }
      
      setUserCredits(prev => prev ? { ...prev, credits: newCredits } : null);

      setState(prev => ({ ...prev, isAnalyzing: false, result: enriched }));
      
      // Update in history
      const supabase = createClerkSupabaseClient(token);
      await supabase.from('scans').update({
        analysis_data: enriched,
        is_pro: true
      }).eq('id', state.result.id);
      
      fetchHistory(user.id);
    } catch {
      setState(prev => ({ ...prev, isAnalyzing: false, error: "Upgrade failed. Please try again." }));
    }
  };

  if (!isClerkLoaded) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0f2a43] text-white p-6">
        <Loader2 className="w-12 h-12 animate-spin text-[#00a3e0]" />
        <div className="mt-8 text-center">
          <h2 className="text-xl font-bold mb-2">Establishing Secure Connection</h2>
          <p className="text-slate-400 text-sm animate-pulse">Retrieving your secure medical vault...</p>
        </div>
      </div>
    );
  }

  if (!user && authView !== 'landing') {
    return (
      <Layout user={null} onLogout={() => {}}>
        <div className="py-12 flex justify-center">
          {authView === 'login' ? (
            <SignIn routing="hash" signUpUrl="#signup" appearance={{ elements: { rootBox: "mx-auto", card: "rounded-3xl border-slate-100 shadow-xl" } }} />
          ) : (
            <SignUp routing="hash" signInUrl="#login" appearance={{ elements: { rootBox: "mx-auto", card: "rounded-3xl border-slate-100 shadow-xl" } }} />
          )}
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout 
        user={null} 
        onLogout={() => {}} 
        showLanding 
        onPricingClick={() => setAuthView('login')}
      >
        <LandingPage />
      </Layout>
    );
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      onLogoClick={() => { setState(p => ({ ...p, result: null, file: null, preview: null })); setView('scan'); }}
      onHistoryClick={() => setView('history')}
      onPricingClick={() => setView('pricing')}
      onAdminClick={() => setView('admin')}
    >
      {view === 'pricing' ? (
        <PricingPage onBuyClick={() => setIsBuyModalOpen(true)} />
      ) : view === 'admin' && user.role === 'admin' ? (
        <AdminDashboard />
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-4 space-y-6 no-print hidden lg:block">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="font-bold flex items-center mb-4 text-[#0f2a43]"><MapPin className="w-5 h-5 mr-2 text-[#00a3e0]" /> Healthcare Location</h3>
              <select 
                value={cityTier} 
                onChange={(e) => setSelectedCityTier(e.target.value as 'Tier-1' | 'Tier-2' | 'Tier-3')} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00a3e0] transition-all text-[#0f2a43]"
              >
                <option value="Tier-1">Metro / Tier 1 (Mumbai, Delhi, BLR)</option>
                <option value="Tier-2">Tier 2 (Pune, Jaipur, Lucknow)</option>
                <option value="Tier-3">Tier 3 / Smaller Towns</option>
              </select>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <h3 className="font-bold flex items-center mb-4 text-[#0f2a43]"><History className="w-5 h-5 mr-2 text-[#00a3e0]" /> Recent Scans</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {history.map(h => (
                  <button 
                    key={h.id} 
                    onClick={() => { setState(p => ({ ...p, result: h })); setView('scan'); }} 
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${state.result?.id === h.id ? 'bg-[#e0f2fe] border-[#00a3e0]/30' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
                  >
                    <p className="text-[10px] font-bold text-[#00a3e0] uppercase tracking-tighter">{h.documentType.replace('_', ' ')}</p>
                    <p className="text-sm font-semibold truncate text-[#0f2a43]">{h.summary}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{new Date(h.timestamp || 0).toLocaleDateString()}</p>
                  </button>
                ))}
                {history.length === 0 && <p className="text-xs text-slate-500 text-center py-8">Your recent analysis history will appear here.</p>}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8">
            <div className="lg:hidden flex p-1 bg-slate-100 rounded-2xl mb-6 no-print">
              <button 
                onClick={() => setView('scan')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${view === 'scan' ? 'bg-white text-[#0f2a43] shadow-sm' : 'text-slate-500'}`}
              >
                New Scan
              </button>
              <button 
                onClick={() => setView('history')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${view === 'history' ? 'bg-white text-[#0f2a43] shadow-sm' : 'text-slate-500'}`}
              >
                History ({history.length})
              </button>
            </div>

            {view === 'history' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold text-[#0f2a43] mb-6 flex items-center">
                  <History className="w-6 h-6 mr-2 text-[#00a3e0]" /> 
                  Your Scan History
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {history.map(h => (
                    <button 
                      key={h.id} 
                      onClick={() => { setState(p => ({ ...p, result: h })); setView('scan'); }} 
                      className="text-left p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:border-[#00a3e0]/30 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 bg-[#e0f2fe] text-[#00a3e0] text-[10px] font-bold rounded-full uppercase tracking-wider">
                          {h.documentType.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(h.timestamp || 0).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#0f2a43] mb-2 line-clamp-2 group-hover:text-[#00a3e0] transition-colors">{h.summary}</p>
                      <div className="flex items-center text-[#00a3e0] text-[10px] font-bold uppercase tracking-widest">
                        <span>View Analysis</span>
                        <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : state.isAnalyzing ? (
              <div className="bg-white p-20 rounded-[3rem] text-center border border-slate-100 flex flex-col items-center shadow-sm">
                <Loader2 className="w-16 h-16 animate-spin text-[#00a3e0] mb-8" />
                <h2 className="text-2xl font-bold text-[#0f2a43]">Running Medical IQ Scan...</h2>
                <p className="text-slate-500 mt-4 max-w-sm">Our AI is decoding handwriting, checking costs, and simplifying jargon for you.</p>
              </div>
            ) : state.result ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <button 
                    onClick={() => setState(p => ({ ...p, result: null, file: null, preview: null }))}
                    className="no-print text-sm font-bold text-[#00a3e0] flex items-center space-x-1 hover:text-[#0092c9]"
                  >
                    <span>&larr; Analyze Another Document</span>
                  </button>
                </div>
                <AnalysisView analysis={state.result} />
                
                {!state.result.isPro && (
                  <ProUpsell onUpgrade={handleUpgradeToPro} />
                )}
              </div>
            ) : (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                <div className="w-20 h-20 bg-[#e0f2fe] rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <Sparkles className="w-10 h-10 text-[#00a3e0]" />
                </div>
                <h2 className="text-3xl font-bold text-[#0f2a43] mb-4">Medical Document Explainer</h2>
                <p className="text-slate-500 mb-10 max-w-md mx-auto">Upload a prescription, bill, or lab report to get a simplified explanation in plain English.</p>
                
                <FileUploader 
                  onFileSelect={handleFileSelect} 
                  selectedFile={state.file} 
                  onClear={() => setState(p => ({ ...p, file: null, preview: null }))} 
                />
                
                {state.file && (
                  <div className="mt-8 space-y-6">
                    <AnalysisModeToggle mode={analysisMode} onChange={setAnalysisMode} />
                    
                    <button 
                      onClick={handleAnalyze} 
                      className="w-full bg-[#0f2a43] text-white py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-slate-200 active:scale-[0.98]"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>Analyze IQ ({analysisMode === 'basic' ? '1 Credit' : '3 Credits'})</span>
                    </button>
                  </div>
                )}
                
                {state.error && (
                  <div className="mt-6 flex items-center justify-center space-x-2 text-red-400 bg-red-900/20 p-4 rounded-2xl border border-red-900/30">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-bold">{state.error}</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {isBuyModalOpen && (
        <BuyCreditsModal 
          isOpen={isBuyModalOpen} 
          onClose={() => setIsBuyModalOpen(false)} 
          onSuccess={() => {
            setIsBuyModalOpen(false);
            fetchUserCredits();
          }}
          userId={user.id}
        />
      )}
    </Layout>
  );
};

export default App;
