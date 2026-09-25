import { useMemo, useState } from 'react';
import type { SmellMemory, RevisitStatus } from '../utils/constants';
import { REVISIT_STATUS_META } from '../utils/constants';
import { collectTags, formatDate, formatDay, getRevisitStatus, revisitRelativeLabel } from '../utils/helpers';
import { CalendarClock, Check, RotateCcw, XCircle } from 'lucide-react';

interface Props {
  memories: SmellMemory[];
  onMarkRevisited: (id: string) => void;
  onCancelRevisit: (id: string) => void;
  onSelect: (id: string) => void;
}

type StatusFilter = '' | RevisitStatus;

const SECTION_ORDER: Exclude<RevisitStatus, 'unscheduled'>[] = ['overdue', 'today', 'upcoming', 'later'];

const SECTION_ACCENT: Record<Exclude<RevisitStatus, 'unscheduled'>, { title: string; badge: string }> = {
  overdue: { title: 'text-brick-500', badge: 'bg-brick-500/10 text-brick-600' },
  today: { title: 'text-ochre-600', badge: 'bg-ochre-100 text-ochre-600' },
  upcoming: { title: 'text-moss-600', badge: 'bg-moss-100 text-moss-600' },
  later: { title: 'text-lavender-600', badge: 'bg-lavender-300/40 text-lavender-600' },
};

function selectClass(active: boolean) {
  return `appearance-none rounded-xl px-3 py-2 pr-8 border text-xs font-medium transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ochre-400 ${
    active
      ? 'bg-ochre-500 text-paper-50 border-ochre-600 shadow-paper'
      : 'bg-paper-50 text-ink-800 border-paper-300 hover:bg-paper-100 hover:border-paper-400'
  }`;
}

const chevron = (active: boolean) => ({
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23${active ? 'FBF7EE' : '8B5A2B'}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
});

export default function RevisitWorkbench({ memories, onMarkRevisited, onCancelRevisit, onSelect }: Props) {
  const [tagFilter, setTagFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');

  const allTags = useMemo(() => collectTags(memories), [memories]);

  // 只收录安排了回访日期的气味；旧记录没有 revisit_date，按未安排处理，不进工作台
  const scheduled = useMemo(
    () => memories.filter((m) => getRevisitStatus(m) !== 'unscheduled'),
    [memories],
  );

  const visible = useMemo(
    () => scheduled.filter((m) => !tagFilter || (m.tags ?? []).includes(tagFilter)),
    [scheduled, tagFilter],
  );

  const grouped = useMemo(() => {
    const map = new Map<RevisitStatus, SmellMemory[]>();
    for (const m of visible) {
      const s = getRevisitStatus(m);
      const list = map.get(s) ?? [];
      list.push(m);
      map.set(s, list);
    }
    // 每个分组内按回访日期升序，最急的排前面
    for (const list of map.values()) {
      list.sort((a, b) => (a.revisit_date! < b.revisit_date! ? -1 : 1));
    }
    return map;
  }, [visible]);

  const sections = SECTION_ORDER.filter((s) => {
    if (statusFilter) return s === statusFilter;
    // 「更晚」只在有内容时出现，三个核心分组常驻
    return s !== 'later' || (grouped.get('later')?.length ?? 0) > 0;
  });

  const hasFilter = tagFilter || statusFilter;
  const resetFilters = () => { setTagFilter(''); setStatusFilter(''); };

  return (
    <section className="container max-w-6xl mb-8">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="font-hand text-2xl text-ochre-600 inline-flex items-center gap-2">
            <CalendarClock className="w-5 h-5" />
            回访工作台
          </span>
          <span className="text-xs text-ink-700/50">· {scheduled.length} 段待回访</span>
        </div>

        <div className="flex-1" />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className={selectClass(!!tagFilter)}
            style={chevron(!!tagFilter)}
          >
            <option value="">全部标签</option>
            {allTags.map((t) => (
              <option key={t} value={t} className="bg-paper-50 text-ink-800"># {t}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={selectClass(!!statusFilter)}
            style={chevron(!!statusFilter)}
          >
            <option value="">全部状态</option>
            {SECTION_ORDER.map((s) => (
              <option key={s} value={s} className="bg-paper-50 text-ink-800">
                {REVISIT_STATUS_META[s].emoji} {REVISIT_STATUS_META[s].label}
              </option>
            ))}
          </select>

          {hasFilter && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-brick-500 hover:bg-brick-600 text-paper-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置
            </button>
          )}
        </div>
      </div>

      {scheduled.length === 0 ? (
        <div className="bg-paper-50/70 backdrop-blur rounded-2xl border-2 border-dashed border-paper-400 py-10 text-center">
          <div className="text-4xl mb-2 select-none">📭</div>
          <p className="text-sm text-ink-700/60">
            还没有安排任何回访 — 在气味卡片上点「编辑」设置下次回访日期，就会出现在这里
          </p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-4 ${sections.length > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : ''}`}>
          {sections.map((status) => {
            const items = grouped.get(status) ?? [];
            const meta = REVISIT_STATUS_META[status];
            const accent = SECTION_ACCENT[status];
            return (
              <div
                key={status}
                className="bg-paper-50/70 backdrop-blur rounded-2xl border border-paper-300 p-4 shadow-paper"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-hand text-lg ${accent.title}`}>
                    {meta.emoji} {meta.label}
                  </h3>
                  <span className={`inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full text-xs font-bold ${accent.badge}`}>
                    {items.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {items.length === 0 ? (
                    <div className="text-center py-5 text-xs text-ink-700/40">
                      {hasFilter ? '没有匹配的回访' : '暂无'}
                    </div>
                  ) : (
                    items.map((m) => {
                      const count = m.revisit_count ?? 0;
                      return (
                        <div
                          key={m.id}
                          className="group flex items-stretch gap-2.5 p-2.5 rounded-xl bg-paper-100/60 hover:bg-paper-200/70 transition-colors"
                        >
                          <div
                            className="w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: m.color_association }}
                          />
                          <button
                            onClick={() => onSelect(m.id)}
                            className="flex-1 min-w-0 text-left"
                            title="在气味档案中查看"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-ink-800 truncate">{m.location}</span>
                              <span className={`shrink-0 text-[10px] font-semibold ${accent.title}`}>
                                {revisitRelativeLabel(m)}
                              </span>
                            </div>
                            <div className="text-[11px] text-ink-700/60 truncate">{m.source_guess}</div>
                            {(m.tags ?? []).length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {(m.tags ?? []).map((t) => (
                                  <span key={t} className="px-1.5 py-0.5 rounded-full bg-paper-200 text-[10px] text-ink-700 border border-paper-300">
                                    # {t}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="mt-1 text-[10px] text-ink-700/50">
                              📅 {formatDay(m.revisit_date!)}
                              {m.revisit_note && <span className="ml-1.5">· 备注：{m.revisit_note}</span>}
                            </div>
                            {count > 0 && (
                              <div className="text-[10px] text-ink-700/50">
                                已回访 {count} 次{m.last_revisited_at && ` · 最近 ${formatDate(m.last_revisited_at)}`}
                              </div>
                            )}
                          </button>
                          <div className="flex flex-col justify-center gap-1 shrink-0">
                            <button
                              onClick={() => onMarkRevisited(m.id)}
                              title="点一下，就算今天回访过"
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium bg-moss-100 text-moss-600 hover:bg-moss-200/80 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              回访过
                            </button>
                            <button
                              onClick={() => onCancelRevisit(m.id)}
                              title="取消回访安排（保留记录）"
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-brick-500 hover:bg-brick-500/10 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              取消
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
