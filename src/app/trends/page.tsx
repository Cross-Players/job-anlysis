'use client';
// Xu hướng theo tuần và dự báo cần lịch sử thật (spec mục 8: tối thiểu MIN_TREND_WEEKS tuần).
// Đến khi đủ, trang này chỉ báo khi nào có; tab đã ẩn khỏi thanh điều hướng.
import Link from 'next/link';
import '@/styles/overview.css';
import { getSnapshot } from '@/api';
import { useApi } from '@/api/useApi';
import { MIN_TREND_WEEKS } from '@/lib/constants';
import { trendReadiness, viDate } from '@/lib/market';

export default function TrendsPage() {
  const snap = useApi(getSnapshot, []);
  const r = snap.data ? trendReadiness(snap.data) : null;
  return (
    <div className="ov">
      <div className="wrap">
        <header><div><h1>Xu hướng & dự báo</h1><p className="sub">Nhóm nghề, kỹ năng đang lên theo tuần</p></div></header>
        <div className="card">
          <p style={{ marginTop: 0 }}>
            Xu hướng và dự báo chỉ hiện khi đã thu thập đều ít nhất <b>{MIN_TREND_WEEKS} tuần</b> dữ liệu thật,
            để biểu đồ phản ánh thị trường chứ không phải số lần cào.
          </p>
          {r?.since && <p>Bắt đầu thu thập: <b>{viDate(r.since)}</b> · đã có {r.weeks} tuần · dự kiến có xu hướng từ <b>{viDate(r.readyOn)}</b>.</p>}
          {snap.error && <p className="mini">Không tải được dữ liệu: {snap.error}</p>}
          <p className="mini" style={{ marginBottom: 0 }}>Trong lúc chờ, xem <Link href="/overview">Tổng quan</Link> tin đang mở.</p>
        </div>
      </div>
    </div>
  );
}
