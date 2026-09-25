import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SmellMemory, Season, SmellType, Emotion } from '../utils/constants';
import { generateId } from '../utils/helpers';
import { mockMemories } from '../data/mockData';

export interface MemoryInput {
  location: string;
  source_guess: string;
  intensity: number;
  humidity: number;
  season: Season;
  smell_type: SmellType;
  memory_text: string;
  color_association: string;
  emotion: Emotion;
  want_again: boolean;
  tags: string[];
  revisit_date: string | null;
  revisit_note: string;
}

interface MemoryStore {
  memories: SmellMemory[];
  addMemory: (input: MemoryInput) => void;
  updateMemory: (id: string, input: MemoryInput) => void;
  deleteMemory: (id: string) => void;
  /** 点一下 = 今天回访过：次数 +1、记录最近时间，并消费掉本次回访日期 */
  markRevisited: (id: string) => void;
  /** 取消回访安排（保留标签、备注与历史回访记录） */
  cancelRevisit: (id: string) => void;
  initIfEmpty: () => void;
}

export const useMemoryStore = create<MemoryStore>()(
  persist(
    (set, get) => ({
      memories: [],
      addMemory: (input) => {
        const now = new Date().toISOString();
        const newMem: SmellMemory = {
          id: generateId(),
          ...input,
          revisit_count: 0,
          last_revisited_at: null,
          created_at: now,
          updated_at: now,
        };
        set({ memories: [newMem, ...get().memories] });
      },
      updateMemory: (id, input) => {
        set({
          memories: get().memories.map((m) =>
            m.id === id
              ? { ...m, ...input, updated_at: new Date().toISOString() }
              : m,
          ),
        });
      },
      deleteMemory: (id) => {
        set({ memories: get().memories.filter((m) => m.id !== id) });
      },
      markRevisited: (id) => {
        const now = new Date().toISOString();
        set({
          memories: get().memories.map((m) =>
            m.id === id
              ? {
                  ...m,
                  revisit_count: (m.revisit_count ?? 0) + 1,
                  last_revisited_at: now,
                  revisit_date: null,
                  updated_at: now,
                }
              : m,
          ),
        });
      },
      cancelRevisit: (id) => {
        set({
          memories: get().memories.map((m) =>
            m.id === id
              ? { ...m, revisit_date: null, updated_at: new Date().toISOString() }
              : m,
          ),
        });
      },
      initIfEmpty: () => {
        if (get().memories.length === 0) {
          set({ memories: mockMemories });
        }
      },
    }),
    {
      name: 'scent-memory-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
