/**
 * Quick Add Bet Component
 * Floating button to quickly add a bet
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface QuickAddBetProps {
  className?: string;
}

export default function QuickAddBet({ className = '' }: QuickAddBetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleQuickAdd = () => {
    // Navigate to a quick add modal or page
    // For now, navigate to MyBets with a query param
    navigate('/my-bets?action=add');
    toast.success('Agregando nueva apuesta...');
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 flex items-center justify-center group ${className}`}
        aria-label="Agregar apuesta rápida"
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>

      {/* Quick Actions Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="fixed bottom-24 right-6 z-50 bg-dark-800 rounded-xl shadow-2xl border border-primary-500/30 p-4 min-w-[200px]">
            <div className="space-y-2">
              <button
                onClick={handleQuickAdd}
                className="w-full text-left px-4 py-3 bg-primary-500/20 hover:bg-primary-500/30 rounded-lg text-white font-semibold transition-colors flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar Apuesta
              </button>
              <button
                onClick={() => {
                  navigate('/my-bets?action=template');
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 bg-accent-500/20 hover:bg-accent-500/30 rounded-lg text-white font-semibold transition-colors flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Usar Template
              </button>
              <button
                onClick={() => {
                  navigate('/my-bets?action=import');
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 bg-gold-500/20 hover:bg-gold-500/30 rounded-lg text-white font-semibold transition-colors flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Importar CSV
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}



