export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function formatPrice(value) {
  if (value == null || Number.isNaN(value)) return '--';
  return `$${value.toFixed(2)}`;
}

export function formatChange(current, previous) {
  if (current == null || previous == null) return '--';
  const diff = current - previous;
  const pct = previous ? (diff / previous) * 100 : 0;
  return `${diff >= 0 ? '+' : ''}${diff.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`;
}

export function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export function loadJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

export function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // ignore
  }
}

export function parseCsv(text) {
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map((row) => row.split(/,|;|\t/).map((cell) => cell.trim()));
  if (!rows.length) return [];
  const headers = rows[0].map((cell) => cell.toLowerCase());
  const records = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (row.length < 5) continue;
    const record = {};
    headers.forEach((field, index) => {
      record[field] = row[index];
    });
    const time = record.time || record.date || record.datetime || record.timestamp;
    const open = parseFloat(record.open);
    const high = parseFloat(record.high);
    const low = parseFloat(record.low);
    const close = parseFloat(record.close);
    const volume = parseFloat(record.volume || record.v || '0');
    if (!time || Number.isNaN(open) || Number.isNaN(high) || Number.isNaN(low) || Number.isNaN(close)) continue;
    const timestamp = Number(time) ? Number(time) : Date.parse(time);
    if (Number.isNaN(timestamp)) continue;
    records.push({ time: timestamp / 1000, open, high, low, close, volume });
  }
  return records.sort((a, b) => a.time - b.time);
}

export const timeframeToYahooInterval = {
  '1M': '1m',
  '5M': '5m',
  '15M': '15m',
  '1H': '60m',
  '1D': '1d',
  '1W': '1wk',
};

export function timeframeOptions() {
  return ['1M', '5M', '15M', '1H', '1D', '1W'];
}

export function buildPatternId(pattern) {
  return `${pattern.name}-${pattern.startIndex}-${pattern.endIndex}`;
}
