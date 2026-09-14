/** Tiny helpers. Views build HTML strings; the app delegates all events. */

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Safe HTML. Values interpolated into html`` are escaped unless they are
 * already safe, so a nested html`` composes instead of being shown as text.
 */
class Safe extends String {}

export function raw(value) {
  return value instanceof Safe ? value : new Safe(value ?? '');
}

function renderValue(value) {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof Safe) return String(value);
  if (Array.isArray(value)) return value.map(renderValue).join('');
  return esc(value);
}

/** Tagged template for building markup. Returns safe HTML. */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += renderValue(values[i]) + strings[i + 1];
  return new Safe(out);
}

export function when(condition, value) {
  if (!condition) return raw('');
  return raw(typeof value === 'function' ? value() : value);
}

export function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Vandaag ${time}`;
  const yesterday = new Date(today.getTime() - 86400000);
  if (d.toDateString() === yesterday.toDateString()) return `Gisteren ${time}`;
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' }) + ' ' + time;
}

export function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

export function percent(fraction) {
  return `${Math.round((fraction || 0) * 100)}%`;
}
