'use client';
// Hook gọi một hàm API và theo dõi trạng thái: đang tải / có dữ liệu / lỗi.
// Khi `deps` đổi (ví dụ đổi bộ lọc) thì gọi lại. Biến `daHuy` bỏ qua kết quả của lần gọi cũ,
// để lần gọi chậm hơn không ghi đè dữ liệu mới hơn.
import { useEffect, useState } from 'react';

export function useApi<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let daHuy = false;
    setLoading(true);
    setError(null);

    load()
      .then((result) => {
        if (!daHuy) setData(result);
      })
      .catch((err: unknown) => {
        if (!daHuy) setError(err instanceof Error ? err.message : 'Không tải được dữ liệu');
      })
      .finally(() => {
        if (!daHuy) setLoading(false);
      });

    return () => {
      daHuy = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
