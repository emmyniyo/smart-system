import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    
    // GET /user-management/profile - Get current user profile and role
    if (req.method === 'GET' && pathParts[2] === 'profile') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
        authHeader.replace('Bearer ', '')
      )

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get user role
      const { data: roleData, error: roleError } = await supabaseClient
        .from('user_roles')
        .select('role, permissions, created_at, updated_at')
        .eq('user_id', user.id)
        .single()

      const userProfile = {
        id: user.id,
        email: user.email,
        role: roleData?.role || 'guest',
        permissions: roleData?.permissions || {},
        created_at: user.created_at,
        role_assigned_at: roleData?.created_at,
        role_updated_at: roleData?.updated_at
      }

      return new Response(
        JSON.stringify(userProfile),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /user-management/users - Get all users (admin only)
    if (req.method === 'GET' && pathParts[2] === 'users') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if user has permission to manage users
      const { data: hasPermission, error: permError } = await supabaseClient
        .rpc('check_user_permission', {
          resource_name: 'users',
          action_name: 'read'
        })

      if (permError || !hasPermission) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get all users with their roles
      const { data: users, error } = await supabaseClient
        .from('user_roles')
        .select(`
          user_id,
          role,
          permissions,
          created_at,
          updated_at,
          auth.users!inner(email, created_at)
        `)

      if (error) throw error

      const formattedUsers = users.map(user => ({
        id: user.user_id,
        email: user.auth?.users?.email,
        role: user.role,
        permissions: user.permissions,
        created_at: user.auth?.users?.created_at,
        role_assigned_at: user.created_at,
        role_updated_at: user.updated_at
      }))

      return new Response(
        JSON.stringify(formattedUsers),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /user-management/assign-role - Assign role to user (admin only)
    if (req.method === 'POST' && pathParts[2] === 'assign-role') {
      const body = await req.json()
      const { user_id, role } = body

      if (!user_id || !role) {
        return new Response(
          JSON.stringify({ error: 'user_id and role are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Use the database function to assign role (includes permission check)
      const { data, error } = await supabaseClient
        .rpc('assign_user_role', {
          target_user_id: user_id,
          new_role: role
        })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Log the role assignment
      await supabaseClient
        .from('access_logs')
        .insert({
          id: `role-assign-${Date.now()}-${user_id}`,
          user_id: 'system',
          user_name: 'System',
          action: 'role_assigned',
          location: 'Admin Panel',
          timestamp: new Date().toISOString(),
          success: true,
          details: { target_user_id: user_id, new_role: role }
        })

      return new Response(
        JSON.stringify({ success: true, message: 'Role assigned successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /user-management/permissions - Get role permissions
    if (req.method === 'GET' && pathParts[2] === 'permissions') {
      const role = url.searchParams.get('role')
      
      let query = supabaseClient.from('role_permissions').select('*')
      
      if (role) {
        query = query.eq('role', role)
      }

      const { data: permissions, error } = await query

      if (error) throw error

      return new Response(
        JSON.stringify(permissions),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /user-management/my-permissions - Get current user's permissions
    if (req.method === 'GET' && pathParts[2] === 'my-permissions') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
        authHeader.replace('Bearer ', '')
      )

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get user's role
      const { data: userRole, error: roleError } = await supabaseClient
        .rpc('get_user_role', { user_uuid: user.id })

      if (roleError) throw roleError

      // Get permissions for this role
      const { data: permissions, error: permError } = await supabaseClient
        .from('role_permissions')
        .select('*')
        .eq('role', userRole)

      if (permError) throw permError

      return new Response(
        JSON.stringify({
          role: userRole,
          permissions: permissions
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})