import { EngineState, ArenaResponse, RunRecord, TaskCreateRequest, WhatIfRequest, WhatIfResponse } from '../types';

const API_BASE = '/api';

export const api = {
  async getState(): Promise<EngineState> {
    const res = await fetch(`${API_BASE}/state`);
    if (!res.ok) throw new Error('Failed to fetch state');
    return res.json();
  },

  async step(): Promise<EngineState> {
    const res = await fetch(`${API_BASE}/step`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to step simulation');
    return res.json();
  },

  async run(): Promise<EngineState> {
    const res = await fetch(`${API_BASE}/run`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start simulation');
    return res.json();
  },

  async pause(): Promise<EngineState> {
    const res = await fetch(`${API_BASE}/pause`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to pause simulation');
    return res.json();
  },

  async reset(): Promise<EngineState> {
    const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset simulation');
    return res.json();
  },

  async updateConfig(config: Record<string, any>): Promise<EngineState> {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Failed to update config');
    return res.json();
  },

  async addTask(task: { arrival: number; burst: number; priority: number; deadline: number; process_type: string }): Promise<EngineState> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to add task');
    }
    return res.json();
  },

  async deleteTask(pid: number): Promise<EngineState> {
    const res = await fetch(`${API_BASE}/tasks/${pid}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to delete task');
    }
    return res.json();
  },

  async loadPreset(name: string): Promise<EngineState> {
    const res = await fetch(`${API_BASE}/workload/preset/${name}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to load preset');
    return res.json();
  },

  async loadCustomWorkload(tasks: any[]): Promise<EngineState> {
    const res = await fetch(`${API_BASE}/workload/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tasks),
    });
    if (!res.ok) throw new Error('Failed to load custom workload');
    return res.json();
  },

  async getArenaBenchmark(quantum = 3): Promise<ArenaResponse> {
    const res = await fetch(`${API_BASE}/arena?quantum=${quantum}`);
    if (!res.ok) throw new Error('Failed to run arena benchmark');
    return res.json();
  },

  async simulateWhatIf(req: WhatIfRequest): Promise<WhatIfResponse> {
    const res = await fetch(`${API_BASE}/what-if`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to simulate What-If scenario');
    }
    return res.json();
  },

  async getHistory(): Promise<RunRecord[]> {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  async clearHistory(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear history');
    return res.json();
  }
};

