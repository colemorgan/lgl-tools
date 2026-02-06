import { getProfile } from '@/lib/supabase/server';
import { isAdmin } from '@/types/database';

export async function requireAdmin() {
  const profile = await getProfile();

  if (!profile || !isAdmin(profile)) {
    throw new Error('Unauthorized: Admin access required');
  }

  return profile;
}
