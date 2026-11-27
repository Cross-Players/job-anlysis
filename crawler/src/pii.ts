// Xóa email và số điện thoại trước khi lưu. Không lưu thông tin cá nhân của người tuyển dụng.

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,}/gi;
// Số Việt Nam: bắt đầu bằng 0 hoặc +84/84, 9–10 chữ số sau đó, cho phép cách bằng dấu cách, chấm, gạch
const PHONE = /(?<![\d.])(?:\+?84|0)(?:[\s.-]?\d){8,10}(?![\d])/g;

export function stripPii(text: string): string {
  return text.replace(EMAIL, '[email]').replace(PHONE, '[sđt]');
}

/** Áp stripPii cho mọi chuỗi trong một object JSON lồng nhau */
export function stripPiiDeep<T>(value: T): T {
  if (typeof value === 'string') return stripPii(value) as T;
  if (Array.isArray(value)) return value.map((v) => stripPiiDeep(v)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = stripPiiDeep(v);
    return out as T;
  }
  return value;
}
