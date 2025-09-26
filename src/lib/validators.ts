export function isEmail(v: string) {
  return /.+@.+\..+/.test(v.trim());
}

export function minLen(v: string, n: number) {
  return v.trim().length >= n;
}

export function nonEmpty(v: string) {
  return v.trim().length > 0;
}

