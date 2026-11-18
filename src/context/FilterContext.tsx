'use client';
// Bộ lọc dùng chung giữa mọi trang: ngành, vai trò, kỹ năng, thành phố, thời gian, cấp bậc, hình thức.
// Đặt trong Context để chuyển trang (Tổng quan → Xu hướng → Công ty) vẫn giữ nguyên bộ lọc.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CityFilter, Filters, Level, Role, Weeks, WorkMode } from '@/lib/types';

interface FilterState {
  ind: string; setInd: (v: string) => void; // 'all' | 'it' | 'kt' | 'mk'
  role: Role; setRole: (v: Role) => void;
  skill: string; setSkill: (v: string) => void; // lọc công ty theo kỹ năng, '' = không lọc
  city: CityFilter; setCity: (v: CityFilter) => void; // 'all' = cả 3 thành phố
  weeks: Weeks; setWeeks: (v: Weeks) => void; // 4 / 12 / 24 tuần gần nhất
  level: Level | 'all'; setLevel: (v: Level | 'all') => void;
  mode: WorkMode | 'all'; setMode: (v: WorkMode | 'all') => void;
  filters: Filters; // gộp sẵn thời gian + thành phố + cấp bậc + hình thức để truyền vào API
}
const Ctx = createContext<FilterState | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [ind, setInd] = useState('all');
  const [role, setRole] = useState<Role>('seeker');
  const [skill, setSkill] = useState('');
  const [city, setCity] = useState<CityFilter>('all');
  const [weeks, setWeeks] = useState<Weeks>(12);
  const [level, setLevel] = useState<Level | 'all'>('all');
  const [mode, setMode] = useState<WorkMode | 'all'>('all');

  // useMemo: chỉ tạo object mới khi một trong 4 giá trị đổi, để các trang không tải lại vô ích
  const filters = useMemo<Filters>(() => ({ weeks, city, level, mode }), [weeks, city, level, mode]);

  const value: FilterState = {
    ind, setInd, role, setRole, skill, setSkill, city, setCity,
    weeks, setWeeks, level, setLevel, mode, setMode, filters,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFilters() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFilters phải nằm trong FilterProvider');
  return v;
}
