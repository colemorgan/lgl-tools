import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { userId } = await params;
    const supabase = createAdminClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: userData } = await supabase.auth.admin.getUserById(userId);

    return NextResponse.json({
      ...profile,
      email: userData?.user?.email ?? null,
    });
  } catch (error) {
    console.error('Admin user detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { userId } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    const allowedFields = ['subscription_status', 'trial_ends_at', 'role', 'full_name'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Handle email update via Supabase Auth (not in profiles table)
    let emailUpdated = false;
    if (body.email !== undefined) {
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        email: body.email,
      });
      if (authError) {
        return NextResponse.json({ error: `Failed to update email: ${authError.message}` }, { status: 400 });
      }
      emailUpdated = true;
    }

    if (Object.keys(updates).length === 0 && !emailUpdated) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    let profileData = null;
    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      profileData = data;
    } else {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      profileData = data;
    }

    // Return with email
    const { data: userData } = await supabase.auth.admin.getUserById(userId);

    return NextResponse.json({
      ...profileData,
      email: userData?.user?.email ?? null,
    });
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
