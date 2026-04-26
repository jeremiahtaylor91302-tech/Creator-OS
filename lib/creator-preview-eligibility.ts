/**
 * Who can use "preview as new user" on the dashboard (read-only UI).
 * If `OWNER_EMAILS` is unset or empty, allow any signed-in user (solo creator setups).
 */
export function isCreatorPreviewEligible(userEmail: string | undefined): boolean {
  const raw = process.env.OWNER_EMAILS?.trim();
  if (!raw) {
    return true;
  }

  const owners = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (owners.length === 0) {
    return true;
  }

  const email = userEmail?.trim().toLowerCase();
  if (!email) {
    return false;
  }

  return owners.includes(email);
}
