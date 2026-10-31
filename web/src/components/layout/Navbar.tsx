import React from 'react';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  LayoutDashboard,
  Cpu,
  Sliders,
  Trophy,
  BookOpen,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  clock: number;
  running: boolean;
  done: boolean;
  onToggleRun: () => void;
  onStep: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  clock,
  running,
  done,
  onToggleRun,
  onStep,
  onReset,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'simulation', label: 'Live Simulator', icon: Cpu },
    { id: 'whatif', label: 'What-If Lab', icon: Sliders },
    { id: 'arena', label: 'Battle Arena', icon: Trophy },
    { id: 'learning', label: 'Learning Mode', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#080B12]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          className="flex items-center space-x-3 cursor-pointer select-none"
          onClick={() => onTabChange('dashboard')}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-violet flex items-center justify-center shadow-sm">
            <span className="text-[#080B12] font-mono font-bold text-base">◈</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-base tracking-wide text-textPrimary">
                PulseQueue
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan/15 text-cyan border border-cyan/30">
                LAB
              </span>
            </div>
            <p className="text-[10px] text-textMuted tracking-tight hidden sm:block">
              Interactive CPU Scheduling Laboratory
            </p>
          </div>
        </div>

        {/* Clean Navigation Tabs */}
        <nav className="flex items-center space-x-1 p-1 bg-secondary/80 border border-white/5 rounded-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan/20 text-cyan border border-cyan/40 shadow-sm'
                    : 'text-textMuted hover:text-textPrimary hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan' : ''}`} />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Simulation Controls & Status */}
        <div className="flex items-center space-x-2.5">
          {/* Clock Pill */}
          <div className="hidden sm:block px-2.5 py-1 rounded-lg bg-secondary border border-white/10 text-xs font-mono text-cyan">
            Tick {String(clock).padStart(2, '0')}
          </div>

          {/* Start / Pause Button */}
          <button
            onClick={onToggleRun}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              running
                ? 'bg-warning text-[#080B12] hover:bg-warning/90'
                : 'bg-cyan text-[#080B12] hover:bg-cyan/90 shadow-sm'
            }`}
          >
            {running ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{running ? 'Pause' : 'Start'}</span>
          </button>

          {/* Next Step Button */}
          <button
            onClick={onStep}
            title="Advance 1 step forward"
            className="p-1.5 rounded-lg bg-secondary hover:bg-white/10 text-textPrimary border border-white/10 transition-all"
          >
            <StepForward className="w-4 h-4" />
          </button>

          {/* Reset Button */}
          <button
            onClick={onReset}
            title="Reset simulation"
            className="p-1.5 rounded-lg bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
