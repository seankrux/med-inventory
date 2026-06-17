import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

/** Resolve the caller and confirm they are an admin. */
async function requireAdmin() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in', status: 401 as const, user: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Admins only', status: 403 as const, user: null }
  }
  return { error: null, status: 200 as const, user }
}

// POST /api/admin/users — create a user manually
export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status })

  let body: { email?: string; password?: string; display_name?: string; role?: UserRole }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''
  const display_name = body.display_name?.trim() || email?.split('@')[0] || ''
  const role: UserRole = body.role === 'admin' ? 'admin' : 'staff'

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name },
  })

  if (createErr || !created.user) {
    return NextResponse.json(
      { error: createErr?.message ?? 'Failed to create user' },
      { status: 400 },
    )
  }

  // The handle_new_user trigger seeds the profile (defaults to staff, unless
  // this is the very first user). Align role + display_name with the request.
  const { error: profileErr } = await admin
    .from('profiles')
    .update({ role, display_name })
    .eq('id', created.user.id)

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 400 })
  }

  return NextResponse.json({
    id: created.user.id,
    email,
    display_name,
    role,
  })
}

// DELETE /api/admin/users?id=<uuid> — remove a user
export async function DELETE(req: Request) {
  const gate = await requireAdmin()
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 })
  if (id === gate.user!.id) {
    return NextResponse.json({ error: "You can't delete your own account" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
