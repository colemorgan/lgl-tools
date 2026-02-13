import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/lib/supabase/server';
import { checkToolAccess } from '@/lib/tool-access';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const profile = await getProfile();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 401 });
    }

    const access = await checkToolAccess(slug, profile, user.id);
    return NextResponse.json(access);
  } catch (error) {
    console.error('Tool access check error:', error);
    return NextResponse.json({ error: 'Failed to check access' }, { status: 500 });
  }
}
