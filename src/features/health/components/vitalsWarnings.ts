export function isTempWarning(temp?: number): boolean {
  if (temp === undefined || temp === null) return false;
  return temp < 37.2 || temp > 38.6;
}

export function isHeartRateWarning(hr?: number): boolean {
  if (hr === undefined || hr === null) return false;
  return hr < 28 || hr > 44;
}

export function isRespiratoryWarning(rr?: number): boolean {
  if (rr === undefined || rr === null) return false;
  return rr < 8 || rr > 16;
}
