import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ListPlus,
  Cpu,
  Trophy,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Activity,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  clock: number;
  running: boolean;
  done: boolean;
  activePid: number | null;
  workloadName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  clock,
  running,
  done,
  activePid,
  workloadName,
}) => {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'System dashboard & 3D CPU architecture',
    },
    {
      id: 'manager',
      label: 'Process Manager',
      icon: ListPlus,
      description: 'Task configuration & What-If lab',
    },
    {
      id: 'simulation',
      label: 'Live Simulation',
      icon: Cpu,
      description: 'Real-time CPU execution & replay',
    },
    {
      id: 'arena',
      label: 'Algorithm Arena',
      icon: Trophy,
      description: '5-way competitive benchmark',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Deep telemetry & performance metrics',
    },
    {
      id: 'learning',
      label: 'Learning Lab',
      icon: BookOpen,
      description: 'CPU scheduling guides & glossary',
    },
  ];

  return (
    <aside
      className={`relative z-40 flex flex-col h-screen border-r border-white/[0.07] bg-[#07090E]/95 backdrop-blur-xl transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.07]">
        <div
          onClick={() => onTabChange('overview')}
          className="flex items-center space-x-3 cursor-pointer select-none overflow-hidden"
        >
          {/* Logo Icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan to-violet p-[1px] flex-shrink-0 shadow-cyan-glow">
            <div className="w-full h-full rounded-[11px] bg-[#07090E] flex items-center justify-center">
              <span className="text-cyan font-mono font-bold text-base tracking-tighter">◈</span>
            </div>
          </div>

          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col min-w-0"
            >
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-extrabold text-sm tracking-wider text-textPrimary">
                  PULSEQUEUE
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan/15 text-cyan border border-cyan/30">
                  2026
                </span>
              </div>
              <span className="text-[10px] text-textMuted tracking-tight truncate">
                Adaptive CPU Engine
              </span>
            </motion.div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-textMuted hover:text-textPrimary transition-all hidden md:flex items-center justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-none">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-textMuted/70">
            Navigation
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative w-full flex items-center ${
                collapsed ? 'justify-center px-2 py-3' : 'px-3.5 py-2.5 space-x-3'
              } rounded-xl text-xs font-medium transition-all group`}
              title={collapsed ? `${item.label}: ${item.description}` : undefined}
            >
              {/* Motion Primitives Sliding Active Indicator Pill */}
              {isActive && (
                <motion.div
                  layoutId="sidebarActive"
                  className="absolute inset-0 bg-gradient-to-r from-cyan/15 to-violet/10 border border-cyan/30 rounded-xl shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <Icon
                className={`w-4 h-4 relative z-10 flex-shrink-0 transition-colors ${
                  isActive
                    ? 'text-cyan'
                    : 'text-textMuted group-hover:text-textPrimary group-hover:scale-110'
                }`}
              />

              {!collapsed && (
                <div className="relative z-10 flex flex-col text-left min-w-0 flex-1">
                  <span
                    className={`font-semibold tracking-tight truncate ${
                      isActive ? 'text-textPrimary font-bold' : 'text-textMuted group-hover:text-textPrimary'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="text-[10px] text-textMuted/70 truncate">
                    {item.description}
                  </span>
                </div>
              )}

              {/* Active glow dot */}
              {isActive && (
                <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-cyan shadow-[0_0_8px_#35D6E8] ml-auto flex-shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Live Engine Telemetry Pill in Sidebar Footer */}
      <div className="p-3 border-t border-white/[0.07] bg-[#0B0F17]/80">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-textMuted flex items-center space-x-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    running ? 'bg-cyan animate-pulse shadow-[0_0_8px_#35D6E8]' : done ? 'bg-success' : 'bg-warning'
                  }`}
                />
                <span className="uppercase text-[10px] tracking-wider font-semibold">
                  {running ? 'Computing' : done ? 'Completed' : 'Suspended'}
                </span>
              </span>
              <span className="text-cyan font-bold">Tick {String(clock).padStart(2, '0')}</span>
            </div>

            <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-1 text-[10px] font-mono">
              <div className="flex justify-between text-textMuted">
                <span>Active Process:</span>
                <span className="text-textPrimary font-bold">
                  {activePid ? `Process P${String(activePid).padStart(2, '0')}` : 'CPU Idle'}
                </span>
              </div>
              <div className="flex justify-between text-textMuted truncate">
                <span>Workload:</span>
                <span className="text-violet font-semibold truncate ml-1">{workloadName}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-1 text-center font-mono text-[10px]">
            <span
              className={`w-2 h-2 rounded-full ${
                running ? 'bg-cyan animate-pulse' : done ? 'bg-success' : 'bg-warning'
              }`}
            />
            <span className="text-cyan font-bold text-[9px]">T{clock}</span>
          </div>
        )}
      </div>
    </aside>
  );
};

