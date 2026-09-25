import { useEffect, useRef, useState } from 'react';
import { X, Tag, CalendarClock } from 'lucide-react';
import type { SmellMemory, Season, SmellType, Emotion } from '../utils/constants';
import { SEASONS, SMELL_TYPES, EMOTIONS, MAX_TAGS } from '../utils/constants';
import type { MemoryInput } from '../store/memoryStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MemoryInput) => void;
  editingData: SmellMemory | null;
}

const defaultForm: MemoryInput = {
  location: '',
  source_guess: '',
  intensity: 5,
  humidity: 5,
  season: 'autumn',
  smell_type: 'woody',
  memory_text: '',
  color_association: '#8B5A2B',
  emotion: 'nostalgic',
  want_again: true,
  tags: [],
  revisit_date: null,
  revisit_note: '',
};

const intensityTicks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const humidityTicks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function MemoryModal({ isOpen, onClose, onSubmit, editingData }: Props) {
  const [form, setForm] = useState<MemoryInput>(defaultForm);
  const [tagInput, setTagInput] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        // 显式逐字段拷贝：旧记录可能缺少 tags / revisit_* 字段，按未安排回访处理
        setForm({
          location: editingData.location,
          source_guess: editingData.source_guess,
          intensity: editingData.intensity,
          humidity: editingData.humidity,
          season: editingData.season,
          smell_type: editingData.smell_type,
          memory_text: editingData.memory_text,
          color_association: editingData.color_association,
          emotion: editingData.emotion,
          want_again: editingData.want_again,
          tags: editingData.tags ?? [],
          revisit_date: editingData.revisit_date ?? null,
          revisit_note: editingData.revisit_note ?? '',
        });
      } else {
        setForm(defaultForm);
      }
      setTagInput('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, editingData]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const update = <K extends keyof MemoryInput>(key: K, value: MemoryInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/^#+/, '');
    if (!tag) return;
    if (form.tags.includes(tag)) { setTagInput(''); return; }
    if (form.tags.length >= MAX_TAGS) return;
    update('tags', [...form.tags, tag]);
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    update('tags', form.tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === '，') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && form.tags.length > 0) {
      removeTag(form.tags[form.tags.length - 1]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.location.trim()) return;
    onSubmit(form);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 pt-8 md:p-6 overflow-y-auto">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-paper-50 rounded-3xl shadow-2xl border border-paper-300 animate-slideDown"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.54 0 0 0 0 0.35 0 0 0 0 0.18 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-paper-200 rounded-t-3xl bg-paper-50/95 backdrop-blur">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink-800">
              {editingData ? '编辑这段气味' : '封存一段新气味'}
            </h2>
            <p className="text-sm text-ink-700/60 mt-0.5 font-hand">
              {editingData ? '回忆已经变了吗？修改它吧～' : '把此刻空气中的味道记录下来'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-700/60 hover:text-ink-800 hover:bg-paper-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-paper-200">
              <span className="w-1.5 h-6 bg-ochre-500 rounded-full" />
              <h3 className="font-hand text-xl text-ochre-600">基础信息</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">地点 *</label>
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  placeholder="例如：外婆家的老衣柜"
                  className="scent-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">气味来源猜测</label>
                <input
                  type="text"
                  value={form.source_guess}
                  onChange={(e) => update('source_guess', e.target.value)}
                  placeholder="例如：樟木 + 旧毛衣"
                  className="scent-input"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-paper-200">
              <span className="w-1.5 h-6 bg-moss-500 rounded-full" />
              <h3 className="font-hand text-xl text-moss-600">感官属性</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-ink-700">气味强度</label>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ochre-100 text-ochre-600 font-semibold text-sm">
                    {form.intensity} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={form.intensity}
                  onChange={(e) => update('intensity', Number(e.target.value))}
                  className="scent-slider"
                />
                <div className="scent-slider-ticks">
                  {intensityTicks.map((v) => (
                    <span key={v} data-value={v} />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-ink-700">湿度感</label>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-moss-100 text-moss-600 font-semibold text-sm">
                    {form.humidity <= 3 ? '极干' : form.humidity <= 6 ? '适中' : '极湿'}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={form.humidity}
                  onChange={(e) => update('humidity', Number(e.target.value))}
                  className="scent-slider"
                  style={{ background: 'linear-gradient(90deg, #E0D1B3 0%, #7DA08C 100%)' }}
                />
                <div className="scent-slider-ticks">
                  {humidityTicks.map((v) => (
                    <span key={v} data-value={v} />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">季节</label>
                <div className="grid grid-cols-4 gap-2">
                  {SEASONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => update('season', s.value as Season)}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center gap-0.5 ${
                        form.season === s.value
                          ? 'bg-ochre-500 text-paper-50 shadow-paper scale-[1.02]'
                          : 'bg-paper-100 text-ink-700 hover:bg-paper-200 border border-paper-200'
                      }`}
                    >
                      <span className="text-lg leading-none">{s.emoji}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">颜色联想</label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-paper-100 border border-paper-200">
                  <input
                    type="color"
                    value={form.color_association}
                    onChange={(e) => update('color_association', e.target.value)}
                    className="scent-color shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-ink-800 font-semibold">{form.color_association.toUpperCase()}</div>
                    <div className="text-xs text-ink-700/60 mt-0.5">想到这种味道时，脑中浮现的颜色</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">气味类型</label>
              <div className="flex flex-wrap gap-2">
                {SMELL_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update('smell_type', t.value as SmellType)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 inline-flex items-center gap-1.5 ${
                      form.smell_type === t.value
                        ? 'text-paper-50 shadow-paper scale-[1.03]'
                        : 'bg-paper-100 text-ink-700 hover:bg-paper-200 border border-paper-200'
                    }`}
                    style={form.smell_type === t.value ? { backgroundColor: t.color } : {}}
                  >
                    <span>{t.emoji}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-paper-200">
              <span className="w-1.5 h-6 bg-lavender-500 rounded-full" />
              <h3 className="font-hand text-xl text-lavender-600">情感记忆</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">关联记忆</label>
              <textarea
                value={form.memory_text}
                onChange={(e) => update('memory_text', e.target.value)}
                rows={4}
                placeholder="这种味道让你想起了什么人、什么事？尽情写下来吧..."
                className="scent-textarea font-serif"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">唤起的情绪</label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOTIONS.map((e) => (
                    <button
                      key={e.value}
                      type="button"
                      onClick={() => update('emotion', e.value as Emotion)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 inline-flex items-center gap-1 ${
                        form.emotion === e.value
                          ? `${e.bg} ${e.text} ring-2 ring-offset-1 ring-offset-paper-50 ring-ochre-300 scale-[1.03]`
                          : 'bg-paper-100 text-ink-700/70 hover:bg-paper-200 border border-paper-200'
                      }`}
                    >
                      <span>{e.emoji}</span>
                      <span>{e.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">还想再闻到吗？</label>
                <div
                  className="flex items-center gap-4 p-3 rounded-xl bg-paper-100 border border-paper-200 cursor-pointer select-none"
                  onClick={() => update('want_again', !form.want_again)}
                >
                  <div className={`toggle-switch ${form.want_again ? 'active' : ''}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-ink-800">
                      {form.want_again ? '🌿 希望有机会再次闻到' : '😮‍💨 就让它留在记忆里吧'}
                    </div>
                    <div className="text-[11px] text-ink-700/55 mt-0.5">
                      {form.want_again ? '标记的气味会显示在卡片上' : '偶尔，不完美的回忆更珍贵'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-paper-200">
              <span className="w-1.5 h-6 bg-brick-400 rounded-full" />
              <h3 className="font-hand text-xl text-brick-500">回访计划</h3>
              <span className="text-[11px] text-ink-700/50 ml-auto">标签、下次回访日期与备注</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-ink-700 inline-flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> 标签
                </label>
                <span className={`text-[11px] ${form.tags.length >= MAX_TAGS ? 'text-brick-500 font-semibold' : 'text-ink-700/50'}`}>
                  {form.tags.length} / {MAX_TAGS}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-paper-50 border border-paper-300 focus-within:ring-2 focus-within:ring-ochre-400 focus-within:border-transparent transition-all duration-200">
                {form.tags.map((tag) => (
                  <span key={tag} className="scent-tag bg-lavender-300/40 text-lavender-600">
                    # {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 rounded-full hover:text-brick-500 transition-colors"
                      aria-label={`移除标签 ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => addTag(tagInput)}
                  maxLength={20}
                  disabled={form.tags.length >= MAX_TAGS}
                  placeholder={
                    form.tags.length >= MAX_TAGS
                      ? '最多 5 个标签'
                      : form.tags.length === 0
                        ? '回车添加标签，如：樟木、雨季…'
                        : '继续添加…'
                  }
                  className="flex-1 min-w-[140px] bg-transparent px-2 py-1 text-sm text-ink-800 placeholder-ink-700/40 focus:outline-none disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-ink-700/50 mt-1">回车或逗号添加，最多 {MAX_TAGS} 个；工作台可按标签筛选</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5 inline-flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" /> 下次回访日期
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={form.revisit_date ?? ''}
                    onChange={(e) => update('revisit_date', e.target.value || null)}
                    className="scent-input flex-1"
                  />
                  {form.revisit_date && (
                    <button
                      type="button"
                      onClick={() => update('revisit_date', null)}
                      className="shrink-0 px-3 py-2.5 rounded-xl text-xs text-brick-500 bg-brick-400/10 hover:bg-brick-400/20 transition-colors"
                    >
                      清除
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-ink-700/50 mt-1">
                  {form.revisit_date ? '到期的气味会出现在主页回访工作台' : '留空表示暂不安排回访'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">回访备注</label>
                <input
                  type="text"
                  value={form.revisit_note}
                  onChange={(e) => update('revisit_note', e.target.value)}
                  placeholder="例如：问问外婆毛衣的晒法"
                  maxLength={100}
                  className="scent-input"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-paper-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button type="submit" className="btn-primary">
              {editingData ? '保存修改' : '封存这段记忆'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
