/** Initials from a shop/customer name for avatar display. */
export function customerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    const word = parts[0];
    return Array.from(word).slice(0, 2).join("").toUpperCase() || "?";
  }
  const first = Array.from(parts[0])[0] ?? "";
  const second = Array.from(parts[1])[0] ?? "";
  return `${first}${second}`.toUpperCase() || "?";
}
