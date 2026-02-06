import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('subscription_status', status);
    }

    if (search) {
      query = query.ilike('full_name', `%${search}%`);
    }

    const { data: profiles, error, count } = await query;

    if (error) {
      throw error;
    }

    // Fetch emails from auth.users for the returned profiles
    const profilesWithEmail = await Promise.all(
      (profiles ?? []).map(async (profile) => {
        const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
        return {
          ...profile,
          email: userData?.user?.email ?? null,
        };
      })
    );

    return NextResponse.json({
      users: profilesWithEmail,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
