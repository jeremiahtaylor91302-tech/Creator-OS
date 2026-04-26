/** Initials for avatar chip: two words → two letters; one word → first two graphemes (or doubled single letter). */
export function initialsFromDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "CR";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0];
    const b = parts[1][0];
    if (a && b) return (a + b).toUpperCase();
  }
  const compact = trimmed.replace(/\s+/g, "");
  if (compact.length >= 2) return compact.slice(0, 2).toUpperCase();
  if (compact.length === 1) return (compact[0]! + compact[0]!).toUpperCase();
  return "CR";
}

export function resolveSidebarUser(params: {
  email: string | undefined;
  profileFullName: string | null | undefined;
  metadataFullName: unknown;
}): { displayName: string; initials: string } {
  const fromProfile = params.profileFullName?.trim();
  const fromMeta =
    typeof params.metadataFullName === "string" ? params.metadataFullName.trim() : "";
  const displayName =
    fromProfile ||
    fromMeta ||
    (params.email?.includes("@") ? params.email.split("@")[0] : params.email)?.trim() ||
    "Creator";
  return {
    displayName,
    initials: initialsFromDisplayName(displayName),
  };
}
