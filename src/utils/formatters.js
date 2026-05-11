// Formatters
export const fmt$ = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export const fmtNum = (n) =>
  new Intl.NumberFormat("en-US").format(n);

export const dayStr = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).toUpperCase();

export const timeStr = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

export const wakeHrs = (settings = { wakeTime: "08:00", sleepTime: "00:00" }) => {
  const now = new Date();
  const [wakeH, wakeM] = settings.wakeTime.split(":").map(Number);
  let [sleepH, sleepM] = settings.sleepTime.split(":").map(Number);
  
  const wake = new Date();
  wake.setHours(wakeH, wakeM, 0, 0);
  
  const sleep = new Date();
  if (sleepH === 0 && sleepM === 0) sleepH = 24; // Handle 12am
  sleep.setHours(sleepH, sleepM, 0, 0);
  
  // If sleep time is before wake time, assume it's the next day
  if (sleep <= wake) {
    sleep.setDate(sleep.getDate() + 1);
  }

  const total = (sleep - wake) / 36e5;
  const elapsed = Math.max(0, (now - wake) / 36e5);
  const pct = Math.min(100, Math.round((elapsed / total) * 100));
  const left = Math.max(0, total - elapsed);
  const h = Math.floor(left);
  const m = Math.round((left - h) * 60);
  return { pct, leftStr: `${h}h ${m}m awake time left` };
};

export const partOfDay = (pct) => {
  if (pct < 25) return { label: "Morning", emoji: "🌅", cta: "Lock in early." };
  if (pct < 50) return { label: "Midday", emoji: "⚡", cta: "Keep moving." };
  if (pct < 75) return { label: "Afternoon", emoji: "🔥", cta: "Push it." };
  return { label: "Evening", emoji: "🌙", cta: "Finish strong." };
};

export const getTodayDay = () => {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
};

export const calculateSleepHours = (bedtime, wakeTime) => {
  if (!bedtime || !wakeTime) return 0;

  const [bedH, bedM] = bedtime.split(":").map(Number);
  const [wakeH, wakeM] = wakeTime.split(":").map(Number);

  const bedDate = new Date();
  bedDate.setHours(bedH, bedM, 0, 0);

  const wakeDate = new Date();
  wakeDate.setHours(wakeH, wakeM, 0, 0);

  // If wake time is before bedtime, assume wake time is next day
  if (wakeDate <= bedDate) {
    wakeDate.setDate(wakeDate.getDate() + 1);
  }

  const diffMs = wakeDate - bedDate;
  const diffHrs = diffMs / (1000 * 60 * 60);

  return Math.round(diffHrs * 10) / 10; // Round to 1 decimal
};
