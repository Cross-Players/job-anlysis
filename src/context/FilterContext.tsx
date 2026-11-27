'use client';
// Bộ lọc dùng chung giữa mọi trang: ngành, thành phố, cấp bậc, hình thức, nhóm nghề, kỹ năng.
// Đặt trong Context để chuyển trang (Tổng quan → Công ty) vẫn giữ nguyên bộ lọc.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CityFilter, Filters, Level, SectorFilter, WorkMode } from '@/lib/types';

interface FilterState {
  sector: SectorFilter; setSector: (v: SectorFilter) => void;
  city: CityFilter; setCity: (v: CityFilter) => void; // 'all' = cả 3 thành phố
  level: Level | 'all'; setLevel: (v: Level | 'all') => void;
  mode: WorkMode | 'all'; setMode: (v: WorkMode | 'all') => void;
  group: string | null; setGroup: (v: string | null) => void; // nhóm nghề đang chọn ở Tổng quan
  skill: string; setSkill: (v: string) => void; // lọc công ty theo kỹ năng, '' = không lọc
  filters: Filters; // gộp sẵn ngành + thành phố + cấp bậc + hình thức để truyền vào API
}
const Ctx = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [sector, setSector] = useState<SectorFilter>('all');
  const [city, setCity] = useState<CityFilter>('all');
  const [level, setLevel] = useState<Level | 'all'>('all');
  const [mode, setMode] = useState<WorkMode | 'all'>('all');
  const [group, setGroup] = useState<string | null>(null);
  const [skill, setSkill] = useState('');

  // useMemo: chỉ tạo object mới khi bộ lọc đổi, để các trang không tính lại vô ích
  const filters = useMemo<Filters>(() => ({ sector, city, level, mode }), [sector, city, level, mode]);

  const value: FilterState = { sector, setSector, city, setCity, level, setLevel, mode, setMode, group, setGroup, skill, setSkill, filters };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFilters() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFilters phải nằm trong FilterProvider');
  return v;
}
