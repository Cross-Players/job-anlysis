// Client HTTP "lịch sự": một luồng, nghỉ giữa các request, tự giới thiệu là bot.
// Gặp dấu hiệu bị chặn (403, 429, 503 hoặc trang thử thách) thì ném BlockedError để dừng hẳn nguồn đó,
// không thử lại dồn dập.

export class BlockedError extends Error {}

export class HttpError extends Error {
  status: number;
  constructor(status: number, url: string) {
    super(`HTTP ${status} ${url}`);
    this.status = status;
  }
}

export type Get = (url: string) => Promise<string>;

interface ClientOptions {
  userAgent: string;
  delayMs: number;
  jitterMs: number;
  timeoutMs?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Trang thử thách của Cloudflare. Chỉ xét tiêu đề: trang bình thường cũng có thể nạp script challenge-platform. */
export function looksLikeChallenge(html: string): boolean {
  return /<title>\s*(Just a moment|Attention Required)/i.test(html.slice(0, 4000));
}

export function createClient(opts: ClientOptions): Get {
  let lastRequestAt = 0;

  return async function get(url: string): Promise<string> {
    const wait = lastRequestAt + opts.delayMs + Math.random() * opts.jitterMs - Date.now();
    if (wait > 0) await sleep(wait);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'user-agent': opts.userAgent, 'accept-language': 'vi,en;q=0.8', accept: 'text/html,application/xml;q=0.9,*/*;q=0.8' },
        redirect: 'follow',
        signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
      });
    } finally {
      lastRequestAt = Date.now();
    }

    if (res.status === 403 || res.status === 429 || res.status === 503) {
      throw new BlockedError(`HTTP ${res.status} ${url}`);
    }
    if (!res.ok) throw new HttpError(res.status, url);

    const body = await res.text();
    if (looksLikeChallenge(body)) throw new BlockedError(`Trang thử thách ${url}`);
    return body;
  };
}
