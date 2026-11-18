'use client';
import { IND } from '@/data/overview';
import { COMPANIES } from '@/data/companies';
import { useFilters } from '@/context/FilterContext';
import { CitySelect } from '@/components/ui/CitySelect';
import { FilterSelects, useLevelModeChips } from '@/components/ui/FilterSelects';
import { cityLabel } from '@/lib/cities';

export interface CompanyFilterState { q: string; model: string; dom: string }
interface Props { value: CompanyFilterState; onChange: (v: CompanyFilterState) => void; count: number }

const MODELS = ['Outsource', 'Product', 'Startup', 'In-house'];
const DOMAINS = [...new Set(COMPANIES.map((c) => c.dom))];

/** Thanh lọc và các chip bộ lọc dùng chung (ngành, kỹ năng, thành phố) */
export function CompanyFilters({ value, onChange, count }: Props) {
  const { ind, setInd, skill, setSkill, city, setCity } = useFilters();
  const levelModeChips = useLevelModeChips();
  const chips: { label: string; clear: () => void }[] = [];
  if (ind !== 'all') chips.push({ label: `Ngành: ${IND[ind].name}`, clear: () => setInd('all') });
  if (city !== 'all') chips.push({ label: `Thành phố: ${cityLabel(city)}`, clear: () => setCity('all') });
  for (const chip of levelModeChips) chips.push(chip);
  if (skill) chips.push({ label: `Kỹ năng: ${skill}`, clear: () => setSkill('') });
  return (
    <>
      {chips.length > 0 && (
        <div className="bar">
          <span className="mini">Đang lọc</span>
          {chips.map((c) => <span key={c.label} className="chip">{c.label}<button aria-label="Bỏ lọc" onClick={c.clear}>✕</button></span>)}
        </div>
      )}
      <div className="bar">
        <input className="inp" placeholder="Tìm công ty" value={value.q} onChange={(e) => onChange({ ...value, q: e.target.value })} />
        <select className="sel" value={value.model} onChange={(e) => onChange({ ...value, model: e.target.value })}>
          <option value="">Mọi loại hình</option>{MODELS.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select className="sel" value={value.dom} onChange={(e) => onChange({ ...value, dom: e.target.value })}>
          <option value="">Mọi lĩnh vực</option>{DOMAINS.map((m) => <option key={m}>{m}</option>)}
        </select>
        <CitySelect />
        <FilterSelects />
        <span className="mini" style={{ marginLeft: 'auto' }}>{count} công ty</span>
      </div>
    </>
  );
}
