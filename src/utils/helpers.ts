import type { SmellMemory } from './constants';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

/** 本地今天，'YYYY-MM-DD' */
export function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** dateStr('YYYY-MM-DD') 相对今天的天数差：负数=已过去，0=今天 */
export function daysFromToday(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86400000);
}

export type RevisitStatus = 'unscheduled' | 'overdue' | 'today' | 'upcoming' | 'later';

/** 计算回访状态；旧记录缺少 revisit_date 时按未安排处理 */
export function getRevisitStatus(m: SmellMemory): RevisitStatus {
  if (!m.revisit_date) return 'unscheduled';
  const diff = daysFromToday(m.revisit_date);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  return diff <= 7 ? 'upcoming' : 'later';
}

export const REVISIT_STATUS_META: Record<RevisitStatus, { label: string; emoji: string }> = {
  overdue: { label: '已逾期', emoji: '🔴' },
  today: { label: '今天回访', emoji: '🟢' },
  upcoming: { label: '未来七天', emoji: '🔵' },
  later: { label: '更晚', emoji: '⚪' },
  unscheduled: { label: '未安排', emoji: '➖' },
};

/** 状态一句话描述，如「逾期 3 天」「2 天后回访」 */
export function revisitStatusText(m: SmellMemory): string {
  if (!m.revisit_date) return '未安排回访';
  const diff = daysFromToday(m.revisit_date);
  if (diff < 0) return `逾期 ${-diff} 天`;
  if (diff === 0) return '今天回访';
  return `${diff} 天后回访`;
}

/** 'YYYY-MM-DD' -> 'M月D日' */
export function formatRevisitDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${m}月${d}日`;
}

/** 收集所有记忆里出现过的标签（去重，按使用次数降序） */
export function collectTags(memories: SmellMemory[]): string[] {
  const count = new Map<string, number>();
  for (const m of memories) {
    for (const t of m.tags ?? []) {
      count.set(t, (count.get(t) ?? 0) + 1);
    }
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

export interface Filters {
  smellType: string;
  season: string;
  emotion: string;
}

export function filterMemories(memories: SmellMemory[], filters: Filters): SmellMemory[] {
  return memories.filter(m => {
    if (filters.smellType && m.smell_type !== filters.smellType) return false;
    if (filters.season && m.season !== filters.season) return false;
    if (filters.emotion && m.emotion !== filters.emotion) return false;
    return true;
  });
}

export interface IntensityDistribution {
  bucket: string;
  count: number;
  range: [number, number];
}

export function getIntensityDistribution(memories: SmellMemory[]): IntensityDistribution[] {
  const buckets = [
    { bucket: '1-2', range: [1, 2] as [number, number] },
    { bucket: '3-4', range: [3, 4] as [number, number] },
    { bucket: '5-6', range: [5, 6] as [number, number] },
    { bucket: '7-8', range: [7, 8] as [number, number] },
    { bucket: '9-10', range: [9, 10] as [number, number] },
  ];
  return buckets.map(b => ({
    ...b,
    count: memories.filter(m => m.intensity >= b.range[0] && m.intensity <= b.range[1]).length,
  }));
}

export function getAverageIntensity(memories: SmellMemory[]): number {
  if (!memories.length) return 0;
  const sum = memories.reduce((acc, m) => acc + m.intensity, 0);
  return Math.round((sum / memories.length) * 10) / 10;
}

export function getTopIntensityMemories(memories: SmellMemory[], n = 5): SmellMemory[] {
  return [...memories].sort((a, b) => b.intensity - a.intensity).slice(0, n);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

export function isLightColor(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

export function contrastTextColor(hex: string): string {
  return isLightColor(hex) ? '#2A2118' : '#FBF7EE';
}
