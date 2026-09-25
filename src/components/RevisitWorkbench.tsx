import { useMemo, useState } from 'react';
import type { SmellMemory } from '../utils/constants';
import type { RevisitStatus } from '../utils/helpers';
import {
  getRevisitStatus,
  revisitStatusText,
  formatRevisitDate,
  collectTags,
  formatDate,
} from '../utils/helpers';
import { BellRing, Check, CalendarX, LocateFixed, Tag, Filter } from 'lucide-react';

interface Props {
  memories: SmellMemory[];
  onMarkRevisited: (id: string) => void;
  onCancelRevisit: (id: string) => void;
  onLocate: (id: string) => void;
}

type StatusFilter = '' | RevisitStatus;

const BUCKETS: { status: RevisitStatus; title: string; emoji: string; accent: string }[] = [
  { status: 'overdue', title: '已逾期', emoji: '🔴', accent: 'text-brick-600' },
  { status: 'today', title: '今天', emoji: '🟢', accent: 'text-moss-600' },
  { status: 'upcoming', title: '未来七天', emoji: '🔵', accent: 'text-ochre-600' },
  { status: 'later', title: '更晚', emoji: '⚪', accent: 'text-ink-700' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'overdue', label: '🔴 已逾期' },
  { value: 'today', label: '🟢 今天' },
  { value: 'upcoming', label: '🔵 未来七天' },
  { value: 'later', label: '⚪ 更晚' },
  { value: 'unscheduled', label: '➖ 未安排' },
];

function byRevisitDate(a: SmellMemory, b: SmellMemory) {
  return (a.revisit_date ?? '').localeCompare(b.revisit_date ?? '');
}

export default function RevisitWorkbench({ memories, onMarkRevisited, onCancelRevisit, onLocate }: Props) {
  const [tagFilter, setTagFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');

  const allTags = useMemo(() => collectTags(memories), [memories]);

  const groups = useMemo(() => {
    const tagged = tagFilter
      ? memories.filter((m) => (m.tags ?? []).includes(tagFilter))
      : memories;
    const map: Record<RevisitStatus, SmellMemory[]> = {
      overdue: [],
      today: [],
      upcoming: [],
      later: [],
      unscheduled: [],
    };
    for (const m of tagged) map[getRevisitStatus(m)].push(m);
    for (const s of Object.keys(map) as RevisitStatus[]) {
      map[s].sort(s === 'unscheduled'
        ? (a, b) => b.updated_at.localeCompare(a.updated_at)
        : byRevisitDate);
    }
    return map;
  }, [memories, tagFilter]);

  if (memories.length === 0) return null;

  const pendingTotal =
    groups.overdue.length + groups.today.length + groups.upcoming.length + groups.later.length;

  // 选具体状态时只显示对应分组；未选时按分桶展示（未安排不进工作台）
  const visibleGroups: { title: string; emoji: string; accent: string; items: SmellMemory[] }[] =
    statusFilter === ''
      ? BUCKETS.map((b) => ({ ...b, items: groups[b.status] }))
      : statusFilter === 'unscheduled'
        ? [{ title: '未安排回访', emoji: '➖', accent: 'text-ink-700', items: groups.unscheduled }]
        : BUCKETS.filter((b) => b.status === statusFilter).map((b) => ({
            ...b,
            items: groups[b.status],
          }));

  const visibleTotal = visibleGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <section className="container max-w-6xl mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="font-hand text-2xl text-ochre-600 flex items-center gap-2">
          <BellRing className="w-5 h-5" /> 回访工作台
        </span>
        <span className="text-xs text-ink-700/50">
          · {pendingTotal > 0 ? `${pendingTotal} 段气味待回访` : '暂无待回访的气味'}
        </span>
      </div>

      <div className="bg-paper-50/70 backdrop-blur rounded-2xl border border-paper-300 p-4 md:p-5 shadow-paper">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-ink-700/50 shrink-0">
            <Filter className="w-3.5 h-3.5" /> 筛选
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/40 pointer-events-none" />
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className={`appearance-none rounded-xl pl-8 pr-8 py-2 border text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-ochre-400 ${
                  tagFilter
                    ? 'bg-lavender-300/50 text-lavender-600 border-lavender-300'
                    : 'bg-paper-50 text-ink-800 border-paper-300 hover:bg-paper-100'
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B5A2B' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                }}
              >
                <option value="">全部标签</option>
                {allTags.map((t) => (
                  <option key={t} value={t} className="bg-paper-50 text-ink-800">
                    # {t}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className={`appearance-none rounded-xl px-3.5 pr-8 py-2 border text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-ochre-400 ${
                statusFilter
                  ? 'bg-ochre-500 text-paper-50 border-ochre-600'
                  : 'bg-paper-50 text-ink-800 border-paper-300 hover:bg-paper-100'
              }`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23${statusFilter ? 'FBF7EE' : '8B5A2B'}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
              }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-paper-50 text-ink-800">
                  {o.label}
                </option>
              ))}
            </select>
            {(tagFilter || statusFilter) && (
              <button
                onClick={() => { setTagFilter(''); setStatusFilter(''); }}
                className="text-xs text-brick-500 hover:text-brick-600 font-medium underline underline-offset-2"
              >
                清除筛选
              </button>
            )}
          </div>
        </div>

        {visibleTotal === 0 ? (
          <div className="py-10 text-center">
            <div className="text-4xl mb-2 select-none">🌬️</div>
            <p className="text-sm text-ink-700/60">
              {tagFilter || statusFilter
                ? '没有匹配的回访计划，换个筛选条件试试'
                : '暂时没有待回访的气味——在编辑里设置「下次回访日期」即可安排'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {visibleGroups.map(
              (g) =>
                g.items.length > 0 && (
                  <div key={g.title}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className={`text-sm font-semibold ${g.accent}`}>
                        {g.emoji} {g.title}
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-paper-200 text-ink-700/70">
                        {g.items.length}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {g.items.map((m) => (
                        <WorkbenchItem
                          key={m.id}
                          memory={m}
                          onMarkRevisited={() => onMarkRevisited(m.id)}
                          onCancelRevisit={() => onCancelRevisit(m.id)}
                          onLocate={() => onLocate(m.id)}
                        />
                      ))}
                    </ul>
                  </div>
                ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function WorkbenchItem({
  memory,
  onMarkRevisited,
  onCancelRevisit,
  onLocate,
}: {
  memory: SmellMemory;
  onMarkRevisited: () => void;
  onCancelRevisit: () => void;
  onLocate: () => void;
}) {
  const scheduled = !!memory.revisit_date;
  const count = memory.revisit_count ?? 0;

  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl bg-paper-50 border border-paper-200 hover:border-paper-400 transition-colors">
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0 hidden sm:block"
        style={{ backgroundColor: memory.color_association }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onLocate}
            className="font-serif font-semibold text-ink-800 hover:text-ochre-600 transition-colors truncate max-w-full"
            title="定位到气味档案卡片"
          >
            {memory.location}
          </button>
          {scheduled ? (
            <span className="text-[11px] text-ochre-600 font-medium shrink-0">
              {formatRevisitDate(memory.revisit_date!)} · {revisitStatusText(memory)}
            </span>
          ) : (
            <span className="text-[11px] text-ink-700/45 shrink-0">未安排回访</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-ink-700/55">
          {(memory.tags ?? []).map((t) => (
            <span key={t} className="px-1.5 py-0.5 rounded-full bg-lavender-300/40 text-lavender-600">
              # {t}
            </span>
          ))}
          {memory.revisit_note && (
            <span className="truncate max-w-[16rem]" title={memory.revisit_note}>
              备注：{memory.revisit_note}
            </span>
          )}
          {count > 0 && (
            <span className="shrink-0">
              已回访 {count} 次
              {memory.last_revisited_at && ` · 最近 ${formatDate(memory.last_revisited_at)}`}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
        {scheduled && (
          <>
            <button
              onClick={onMarkRevisited}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-moss-500 hover:bg-moss-600 text-paper-50 transition-colors"
              title="点一下，记录今天已回访"
            >
              <Check className="w-3.5 h-3.5" /> 今天回访过
            </button>
            <button
              onClick={onCancelRevisit}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-ink-700/70 hover:bg-paper-200 border border-paper-300 transition-colors"
              title="清除回访日期，保留回访记录"
            >
              <CalendarX className="w-3.5 h-3.5" /> 取消回访
            </button>
          </>
        )}
        <button
          onClick={onLocate}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-ochre-600 hover:bg-ochre-100 transition-colors"
          title="定位到气味档案卡片"
        >
          <LocateFixed className="w-3.5 h-3.5" /> 定位
        </button>
      </div>
    </li>
  );
}
