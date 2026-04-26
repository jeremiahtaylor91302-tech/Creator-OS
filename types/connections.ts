import type { Platform } from "@/lib/platforms";

export type PlatformConnection = {
  id: string;
  user_id: string;
  platform: Platform;
  external_account_id: string | null;
  external_username: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  status: "pending" | "connected" | "failed";
  last_error: string | null;
  metadata: Record<string, unknown> | null;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
};
