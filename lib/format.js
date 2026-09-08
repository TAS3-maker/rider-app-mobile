// Date/time + status formatting helpers (shared across ride screens).

export function formatTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function shortDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

// Returns { text, urgent } for a booking deadline countdown.
export function countdown(deadline) {
  if (!deadline) return { text: '', urgent: false, passed: false };
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return { text: 'Deadline passed', urgent: true, passed: true };
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const days = Math.floor(h / 24);
  let text;
  if (days >= 1) text = `${days}d ${h % 24}h left`;
  else text = `${h}h ${m}m left`;
  return { text, urgent: h < 2, passed: false };
}

// Status → label + NativeWind color classes. open=teal, nearly=yellow, full=red.
export function statusMeta(status, memberCount, capacity) {
  const count = memberCount != null && capacity != null ? ` · ${memberCount}/${capacity}` : '';
  switch (status) {
    case 'open':
      return { label: `Open${count}`, bg: 'bg-primary-light', text: 'text-primary-dark' };
    case 'nearly_full':
      return { label: `Nearly Full${count}`, bg: 'bg-maize-light', text: 'text-[#B8860B]' };
    case 'full':
      return { label: `Full${count}`, bg: 'bg-accent-light', text: 'text-accent' };
    case 'confirmed':
    case 'in_progress':
      return { label: 'Booked', bg: 'bg-primary-light', text: 'text-primary-dark' };
    case 'completed':
      return { label: 'Completed', bg: 'bg-primary-light', text: 'text-primary-dark' };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-accent-light', text: 'text-accent' };
    default:
      return { label: status || '', bg: 'bg-primary-light', text: 'text-primary-dark' };
  }
}

export const directionLabel = (direction, airportCode = 'Airport') =>
  direction === 'airport_to_university' ? `${airportCode} → Campus` : `Campus → ${airportCode}`;
