import { useState, useMemo } from 'react';
import { Search, Plus, Check } from 'lucide-react';
import { useRepertoire } from '../hooks/useRepertoire';
import type { Ensemble } from '../types';

interface Props {
  /** Filter piece suggestions to these ensembles; empty array = show all. */
  ensembleIds: string[];
  ensembles: Ensemble[];
  value: string[];
  onChange: (ids: string[]) => void;
}

export function PiecePicker({ ensembleIds, ensembles, value, onChange }: Props) {
  const { pieces, addPiece } = useRepertoire();
  const [search, setSearch] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [qaTitle, setQaTitle] = useState('');
  const [qaComposer, setQaComposer] = useState('');
  const [qaSaving, setQaSaving] = useState(false);

  const ensembleMap = useMemo(
    () => Object.fromEntries(ensembles.map(e => [e.id, e])),
    [ensembles],
  );

  const pool = ensembleIds.length
    ? pieces.filter(p => ensembleIds.includes(p.ensembleId))
    : pieces;

  const filtered = search
    ? pool.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.composer ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : pool;

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  }

  async function handleQuickAdd() {
    if (!qaTitle.trim()) return;
    const ensId = ensembleIds[0] ?? ensembles[0]?.id ?? '';
    if (!ensId) return;
    setQaSaving(true);
    const nextOrder = pieces.filter(p => p.ensembleId === ensId).reduce((m, p) => Math.max(m, p.order ?? 0), 0) + 1;
    const newId = await addPiece({
      ensembleId: ensId,
      title: qaTitle.trim(),
      composer: qaComposer.trim() || undefined,
      order: nextOrder,
    });
    if (newId) onChange([...value, newId]);
    setQaTitle('');
    setQaComposer('');
    setShowQuickAdd(false);
    setQaSaving(false);
  }

  return (
    <div className="dir-piece-picker">
      <div className="dir-piece-search-row">
        <div className="dir-piece-search">
          <Search size={13} className="dir-piece-search-icon" />
          <input
            className="dir-piece-search-input"
            placeholder="Search pieces…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          className="dir-piece-add-btn"
          onClick={() => setShowQuickAdd(s => !s)}
          type="button"
          title="Quick-add a piece"
        >
          <Plus size={15} />
        </button>
      </div>

      {showQuickAdd && (
        <div className="dir-piece-quickadd">
          <input
            className="dir-input"
            placeholder="Title *"
            value={qaTitle}
            onChange={e => setQaTitle(e.target.value)}
            autoFocus
          />
          <input
            className="dir-input"
            placeholder="Composer (optional)"
            value={qaComposer}
            onChange={e => setQaComposer(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="dir-btn dir-btn-primary"
              style={{ flex: 1 }}
              onClick={handleQuickAdd}
              disabled={qaSaving || !qaTitle.trim()}
              type="button"
            >
              {qaSaving ? 'Adding…' : 'Add & select'}
            </button>
            <button
              className="dir-btn dir-btn-ghost"
              onClick={() => { setShowQuickAdd(false); setQaTitle(''); setQaComposer(''); }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="dir-piece-list">
        {filtered.length === 0 ? (
          <div className="dir-empty-inline">
            {search ? `No pieces match "${search}".` : 'No pieces yet — use + to quick-add.'}
          </div>
        ) : (
          filtered.map(p => {
            const sel = value.includes(p.id);
            return (
              <button
                key={p.id}
                className={`dir-piece-row${sel ? ' selected' : ''}`}
                onClick={() => toggle(p.id)}
                type="button"
              >
                <span className="dir-piece-check">{sel && <Check size={11} />}</span>
                <span className="dir-piece-info">
                  <span className="dir-piece-title">{p.title}</span>
                  {p.composer && <span className="dir-piece-composer">{p.composer}</span>}
                </span>
                {ensembleIds.length === 0 && (
                  <span className="dir-piece-ens">{ensembleMap[p.ensembleId]?.name ?? ''}</span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
