// Returns a PNG avatar URL — use PNG so the core RN Image renders it without extra deps
export function dicebearUrl(seed: string) {
  return `https://api.dicebear.com/9.x/glass/png?seed=${encodeURIComponent(seed)}`
}
