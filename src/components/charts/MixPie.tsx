'use client';
// Biểu đồ tròn (dạng vành khuyên) cho thẻ "Cơ cấu theo ngành" ở trang Tổng quan.
// Mỗi lát là một ngành (hoặc một nhóm nghề), độ lớn lát = số tin mới.
// Bấm vào lát để lọc cả trang, giống như bấm vào dòng trong danh sách bên dưới.
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export interface PieSlice {
  id: string;
  name: string;
  value: number; // số tin mới
  color: string; // màu cố định của nhóm, xem seriesColor()
}

interface Props {
  slices: PieSlice[];
  total: number; // tổng số tin, hiện ở giữa vành
  selectedId: string | null; // nhóm đang được chọn (null = chưa chọn)
  onPick: (id: string) => void;
}

// Bảng màu có 6 màu (khai báo --s1 ... --s6 trong globals.css).
// Màu gắn theo vị trí của nhóm trong dữ liệu gốc, KHÔNG theo thứ hạng,
// để khi số liệu đổi thứ tự thì mỗi ngành vẫn giữ nguyên màu của nó.
export function seriesColor(index: number): string {
  const slot = (index % 6) + 1;
  return `var(--s${slot})`;
}

export function MixPie({ slices, total, selectedId, onPick }: Props) {
  return (
    <div className="pie">
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="95%"
            startAngle={90}
            endAngle={-270} // vẽ theo chiều kim đồng hồ, bắt đầu từ đỉnh
            stroke="var(--card)" // viền cùng màu nền tạo khe hở 2px giữa các lát
            strokeWidth={2}
            isAnimationActive={false}
            onClick={(slice: PieSlice) => onPick(slice.id)}
          >
            {slices.map((slice) => {
              // Khi đã chọn một nhóm thì làm mờ các nhóm còn lại
              const isDimmed = selectedId !== null && selectedId !== slice.id;
              return (
                <Cell
                  key={slice.id}
                  fill={slice.color}
                  fillOpacity={isDimmed ? 0.3 : 1}
                  cursor="pointer"
                />
              );
            })}
          </Pie>
          <Tooltip
            formatter={(value: number) => {
              const percent = ((value / total) * 100).toFixed(0);
              return [`${value} tin · ${percent}%`, 'Tin mới'];
            }}
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 12 }}
            itemStyle={{ color: 'var(--ink)' }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Chữ ở giữa vành: tổng số tin */}
      <div className="pie-center">
        <b>{total.toLocaleString('vi-VN')}</b>
        <span>tin mới</span>
      </div>
    </div>
  );
}
