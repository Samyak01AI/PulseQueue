import React from 'react';
import { BookOpen, Code2, Cpu, CheckCircle } from 'lucide-react';

export const TheorySection: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-cyan" />
          <h2 className="text-base font-mono font-bold text-textPrimary uppercase tracking-wider">
            ALGORITHMIC SPECIFICATIONS & DSA ARCHITECTURE
          </h2>
        </div>
        <p className="text-xs text-textMuted mt-1">
          Theoretical foundation, mathematical formulas, and asymptotic time-complexity proofs behind PulseQueue X.
        </p>
      </div>

      {/* 1. Indexed Min-Heap Card */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-cyan" />
          <h3 className="text-sm font-mono font-bold text-cyan uppercase tracking-wider">
            1. INDEXED MIN-HEAP DATA STRUCTURE
          </h3>
        </div>

        <div className="text-xs font-mono text-textPrimary space-y-3 leading-relaxed">
          <p>
            Standard binary heaps require <span className="text-warning">O(N)</span> linear search to locate an arbitrary element before updating its key. PulseQueue X utilizes an <span className="text-cyan font-bold">IndexedMinHeap</span> featuring an internal hash table mapping <span className="text-violet">PID → Heap Array Index</span>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-secondary/80 border border-white/5">
              <span className="text-[10px] text-textMuted">PEEK ROOT</span>
              <div className="text-base font-bold text-success font-mono">O(1)</div>
              <p className="text-[10px] text-textMuted mt-1">Instant query of highest priority candidate</p>
            </div>

            <div className="p-3 rounded-xl bg-secondary/80 border border-white/5">
              <span className="text-[10px] text-textMuted">PUSH / UPDATE KEY</span>
              <div className="text-base font-bold text-cyan font-mono">O(log N)</div>
              <p className="text-[10px] text-textMuted mt-1">Sift-up / sift-down from tracked index</p>
            </div>

            <div className="p-3 rounded-xl bg-secondary/80 border border-white/5">
              <span className="text-[10px] text-textMuted">FLOYD REBUILD</span>
              <div className="text-base font-bold text-violet font-mono">O(N)</div>
              <p className="text-[10px] text-textMuted mt-1">Bottom-up heapification on each clock tick</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Adaptive Priority Formula */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-violet" />
          <h3 className="text-sm font-mono font-bold text-violet uppercase tracking-wider">
            2. ADAPTIVE SCHEDULING FORMULATION
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-[#0B101B] border border-cyan/25 font-mono text-xs text-cyan text-center tracking-wider">
          Score = BasePriority - (α × WaitedTicks) - (β × max(0, 5 - SlackTicks))
        </div>

        <div className="text-xs font-mono text-textMuted space-y-2 leading-relaxed">
          <div>
            <span className="text-textPrimary font-bold">WaitedTicks:</span> Total elapsed ticks spent queued in READY state without receiving CPU execution:
            <br />
            <code className="text-cyan">WaitedTicks = max(0, Clock - Arrival - ExecutedTicks)</code>
          </div>

          <div>
            <span className="text-textPrimary font-bold">SlackTicks:</span> Remaining leeway before deadline expiration:
            <br />
            <code className="text-cyan">SlackTicks = Deadline - Clock - RemainingBurst</code>
          </div>

          <div>
            <span className="text-textPrimary font-bold">Starvation Elimination:</span> As long-waiting low-priority processes sit in the ready queue, <code className="text-success">- (α × WaitedTicks)</code> continuously lowers their score until they overtake incoming high-priority tasks.
          </div>

          <div>
            <span className="text-textPrimary font-bold">Deadline Adherence:</span> When a task approaches its deadline with <code className="text-danger">Slack ≤ 5 ticks</code>, the quadratic-style urgency factor rapidly depresses its score to prioritize completion before deadline violation.
          </div>
        </div>
      </div>
    </div>
  );
};

