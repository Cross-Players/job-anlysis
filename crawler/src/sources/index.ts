// Danh sách nguồn. Bật/tắt bằng biến môi trường CRAWL_SOURCES (mặc định: vieclam24h).
// Nguồn chặn cào từ máy chủ (TopCV, TopDev) không có ở đây: để cho extension sau này.
// ITviec: TẮT. Điều khoản 2.2 cấm thu thập khi chưa có văn bản đồng ý, và từ 2026-11-22 trả 403
// cho bot từ IP VPS. Chỉ bật lại (CRAWL_SOURCES=vieclam24h,itviec) khi ITviec đồng ý bằng văn bản.
import { itviec } from './itviec.ts';
import { vieclam24h } from './vieclam24h.ts';
import type { SourceAdapter } from './types.ts';

export const SOURCES: Record<string, SourceAdapter> = { vieclam24h, itviec };
