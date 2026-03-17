
import React, { useState } from 'react';
import { ShieldCheck, LogOut, User as UserIcon, Menu, Zap, ShieldAlert, X, History, CreditCard, Settings } from 'lucide-react';
import { User } from '../types';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  onLogoClick?: () => void;
  onHistoryClick?: () => void;
  onPricingClick?: () => void;
  onAdminClick?: () => void;
  onLoginClick?: () => void;
  showLanding?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  onLogout, 
  onLogoClick, 
  onHistoryClick, 
  onPricingClick,
  onAdminClick,
  onLoginClick, 
  showLanding 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogoClick = () => {
    window.location.hash = '#landing';
    onLogoClick?.();
  };

  const handleLoginClick = () => {
    window.location.hash = '#login';
    onLoginClick?.();
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-50 bg-[#0f2a43] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={handleLogoClick}>
              <Logo className="w-8 h-8" />
              <span className="text-xl font-bold tracking-tight">Prescription AI</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              {showLanding ? (
                <>
                  <a href="#struggles" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Struggles</a>
                  <a href="#solution" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Solution</a>
                  <a href="#how-it-works" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">How it Works</a>
                  <button 
                    onClick={onPricingClick}
                    className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Pricing
                  </button>
                </>
              ) : user ? (
                <>
                  <button 
                    onClick={onLogoClick}
                    className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center"
                  >
                    <Zap className="w-4 h-4 mr-1.5" />
                    New Scan
                  </button>
                  <button 
                    onClick={onHistoryClick}
                    className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center"
                  >
                    <History className="w-4 h-4 mr-1.5" />
                    History
                  </button>
                  <button 
                    onClick={onPricingClick}
                    className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center"
                  >
                    <CreditCard className="w-4 h-4 mr-1.5" />
                    Pricing
                  </button>
                  {user.role === 'admin' && (
                    <button 
                      onClick={onAdminClick}
                      className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors flex items-center"
                    >
                      <Settings className="w-4 h-4 mr-1.5" />
                      Admin
                    </button>
                  )}
                </>
              ) : null}
              
              {user ? (
                <div className="flex items-center space-x-4 pl-4 border-l border-white/10">
                  <div className="flex flex-col items-end mr-2">
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Credits</span>
                    <span className="text-sm font-bold text-[#00a3e0]">{user.credits ?? 0}</span>
                  </div>
                  <div className="flex items-center space-x-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                    <div className="w-6 h-6 bg-[#8ba888] rounded-full flex items-center justify-center">
                      <UserIcon className="w-3.5 h-3.5 text-[#0f2a43]" />
                    </div>
                    <span className="text-sm font-bold text-slate-200">{user.name.split(' ')[0]}</span>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLoginClick}
                  className="px-6 py-2.5 bg-[#00a3e0] text-white rounded-full font-bold text-sm hover:bg-[#0092c9] transition-all"
                >
                  Join Us
                </button>
              )}
            </nav>

            <button 
              className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#0f2a43] border-t border-white/10 px-4 py-6 space-y-4 animate-in slide-in-from-top duration-300">
            {showLanding && (
              <div className="flex flex-col space-y-4">
                <a href="#struggles" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Struggles</a>
                <a href="#solution" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Solution</a>
                <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">How it Works</a>
                <button onClick={() => { setIsMenuOpen(false); onPricingClick?.(); }} className="text-left text-sm font-medium text-slate-300 hover:text-white transition-colors">Pricing</button>
              </div>
            )}
            
            <div className="pt-4 border-t border-white/10">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#8ba888] rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-[#0f2a43]" />
                      </div>
                      <span className="text-sm font-bold text-slate-200">{user.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold">Credits</span>
                      <span className="text-sm font-bold text-[#00a3e0]">{user.credits ?? 0}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setIsMenuOpen(false); if (onLogoClick) onLogoClick(); }}
                    className="w-full flex items-center justify-start space-x-3 px-4 py-3 text-slate-300 hover:text-white transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-medium">New Scan</span>
                  </button>
                  <button 
                    onClick={() => { setIsMenuOpen(false); onHistoryClick?.(); }}
                    className="w-full flex items-center justify-start space-x-3 px-4 py-3 text-slate-300 hover:text-white transition-colors"
                  >
                    <History className="w-4 h-4" />
                    <span className="text-sm font-medium">Scan History</span>
                  </button>
                  <button 
                    onClick={() => { setIsMenuOpen(false); onPricingClick?.(); }}
                    className="w-full flex items-center justify-start space-x-3 px-4 py-3 text-slate-300 hover:text-white transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm font-medium">Pricing</span>
                  </button>
                  {user.role === 'admin' && (
                    <button 
                      onClick={() => { setIsMenuOpen(false); onAdminClick?.(); }}
                      className="w-full flex items-center justify-start space-x-3 px-4 py-3 text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm font-medium">Admin Dashboard</span>
                    </button>
                  )}
                  <button 
                    onClick={() => { onLogout(); setIsMenuOpen(false); }}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-red-500/10 text-red-400 rounded-xl font-bold text-sm border border-red-500/20"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLoginClick}
                  className="w-full px-6 py-3 bg-[#00a3e0] text-white rounded-xl font-bold text-sm hover:bg-[#0092c9] transition-all shadow-lg shadow-[#00a3e0]/20"
                >
                  Join Us
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-[#f8fafc] text-slate-500 py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-5">
              <div className="flex items-center space-x-3 mb-6">
                <Logo className="w-8 h-8" />
                <span className="text-xl font-bold tracking-tight text-[#0f2a43]">Prescription AI</span>
              </div>
              <p className="text-[#00a3e0] text-[10px] font-bold uppercase tracking-widest mb-6">Making healthcare understandable</p>
              <p className="text-slate-500 max-w-sm mb-8 leading-relaxed text-sm">
                AI-powered insights for prescriptions and medical billing. Deciphering clinical data for patients everywhere.
              </p>
              <div className="flex items-center space-x-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span className="flex items-center"><Zap className="w-3 h-3 mr-1" /> Fast</span>
                <span className="flex items-center"><ShieldCheck className="w-3 h-3 mr-1" /> Secure</span>
                <span className="flex items-center"><ShieldCheck className="w-3 h-3 mr-1" /> Private</span>
              </div>
            </div>
            
            <div className="md:col-span-3">
              <h4 className="text-[#0f2a43] font-bold text-xs uppercase tracking-widest mb-8">Product</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><a href="#struggles" className="flex items-center hover:text-[#0f2a43] transition-colors"><span className="w-5 h-5 mr-2 flex items-center justify-center border border-slate-200 rounded-full text-[10px]">?</span> Struggles</a></li>
                <li><a href="#solution" className="flex items-center hover:text-[#0f2a43] transition-colors"><Zap className="w-4 h-4 mr-2" /> Solution</a></li>
                <li><a href="#how-it-works" className="flex items-center hover:text-[#0f2a43] transition-colors"><span className="w-5 h-5 mr-2 flex items-center justify-center border border-slate-200 rounded-full text-[10px]">i</span> How it Works</a></li>
                <li><button onClick={onPricingClick} className="flex items-center hover:text-[#0f2a43] transition-colors"><CreditCard className="w-4 h-4 mr-2" /> Pricing</button></li>
              </ul>
            </div>
            
            <div className="md:col-span-3">
              <h4 className="text-[#0f2a43] font-bold text-xs uppercase tracking-widest mb-8">Legal</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><a href="#" className="flex items-center hover:text-[#0f2a43] transition-colors"><ShieldCheck className="w-4 h-4 mr-2" /> Privacy Policy</a></li>
                <li><a href="#" className="flex items-center hover:text-[#0f2a43] transition-colors"><span className="w-5 h-5 mr-2 flex items-center justify-center border border-slate-200 rounded-full text-[10px]">§</span> Terms of Service</a></li>
                <li><a href="#" className="flex items-center hover:text-[#0f2a43] transition-colors"><ShieldAlert className="w-4 h-4 mr-2" /> Medical Disclaimer</a></li>
                <li><a href="#" className="flex items-center hover:text-[#0f2a43] transition-colors"><span className="w-5 h-5 mr-2 flex items-center justify-center border border-slate-200 rounded-full text-[10px]">c</span> Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-200 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-slate-400 font-medium">&copy; 2026 Prescription AI. Built with care for patients everywhere.</p>
            <div className="flex space-x-6">
              <div className="flex items-center space-x-4 text-slate-300">
                <span className="w-6 h-6 flex items-center justify-center"><Zap className="w-4 h-4" /></span>
                <span className="w-6 h-6 flex items-center justify-center"><Zap className="w-4 h-4" /></span>
                <span className="w-6 h-6 flex items-center justify-center"><ShieldAlert className="w-4 h-4" /></span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};