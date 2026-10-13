// Một kiểu ngày giờ cho toàn app: "13 Oct 2026", "16:02", "13 Oct 2026, 16:02".

const pad = (n: number) => String(n).padStart(2, "0");

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: string | number | Date): string {
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

// "13 Oct" — ngày trong năm hiện tại, dùng ở chỗ hẹp.
export function formatShortDate(value: string | number | Date): string {
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function formatTime(value: string | number | Date): string {
  const d = toDate(value);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateTime(value: string | number | Date): string {
  return `${formatDate(value)}, ${formatTime(value)}`;
}

// "Saturday, 19 September 2026"
export function formatLongDate(value: string | number | Date): string {
  const d = toDate(value);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// 47000 => "00:47"
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

// Số đếm dưới 10 đệm số 0: 3 => "03"
export function padCount(n: number): string {
  return pad(n);
}

// "Trần Văn Nam" => "TVN"? Design dùng 2 chữ cuối: "Văn Nam" => "VN".
// Bỏ phần trong ngoặc và ký tự không phải chữ: "Michael Tran (Club Manager)" => "MT".
export function initials(name: string): string {
  return name
    .replace(/\(.*?\)/g, " ")
    .replace(/[^\p{L}\s]/gu, " ")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Tên gọi trong tiếng Việt là chữ cuối: "Trần Văn Nam" => "Nam".
export function givenName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
