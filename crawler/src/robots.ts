// Đọc robots.txt tối giản: chỉ nhóm "User-agent: *", luật Disallow/Allow dạng tiền tố
// (có hỗ trợ * và $). Luật dài hơn thắng, Allow thắng khi dài bằng nhau, giống Google.

interface Rule {
  allow: boolean;
  pattern: RegExp;
  length: number;
}

function toRegExp(path: string): RegExp {
  const anchored = path.endsWith('$');
  const body = (anchored ? path.slice(0, -1) : path)
    .replace(/[.+?^{}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp('^' + body + (anchored ? '$' : ''));
}

export function parseRobots(text: string): Rule[] {
  const rules: Rule[] = [];
  let inStarGroup = false;
  let lastWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, '').trim();
    const match = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();

    if (key === 'user-agent') {
      // Nhiều dòng User-agent liền nhau thuộc cùng một nhóm
      inStarGroup = (lastWasAgent && inStarGroup) || value === '*';
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!inStarGroup || (key !== 'allow' && key !== 'disallow') || value === '') continue;
    rules.push({ allow: key === 'allow', pattern: toRegExp(value), length: value.length });
  }
  return rules;
}

export function isAllowed(rules: Rule[], url: string): boolean {
  const { pathname, search } = new URL(url);
  const path = pathname + search;
  let best: Rule | null = null;
  for (const rule of rules) {
    if (!rule.pattern.test(path)) continue;
    if (!best || rule.length > best.length || (rule.length === best.length && rule.allow)) best = rule;
  }
  return best ? best.allow : true;
}
