
import React from 'react';
import { AppScreen } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeScreen, onNavigate, title }) => {
  const navItems = [
    { id: AppScreen.HOME, icon: 'fa-house', label: 'Home' },
    { id: AppScreen.INFO, icon: 'fa-circle-info', label: 'Info' },
    { id: AppScreen.QUIZ, icon: 'fa-lightbulb', label: 'Quiz' },
    { id: AppScreen.CHAT, icon: 'fa-comments', label: 'Ask AI' },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-2xl relative border-x border-slate-200">
      {/* Header */}
      <header className="p-4 bg-indigo-600 text-white flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-bolt-lightning text-white"></i>
          </div>
          <h1 className="font-bold text-lg tracking-tight">{title}</h1>
        </div>
        <button className="text-white/80 hover:text-white">
          <i className="fa-solid fa-gear text-xl"></i>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scroll pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-20">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
              activeScreen === item.id ? 'text-indigo-600 scale-110' : 'text-slate-400'
            }`}
          >
            <i className={`fa-solid ${item.icon} text-xl`}></i>
            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
