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
    const limit = parseInt(url.searchParams.get('limit') || '50')
    
    // GET /access-logs - Get access logs
    if (req.method === 'GET') {
      const { data: logs, error } = await supabaseClient
        .from('access_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error

      return new Response(
        JSON.stringify(logs),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // POST /access-logs - Create new access log
    if (req.method === 'POST') {
      const body = await req.json()
      const { user_id, user_name, action, location, success, details } = body

      const { data: log, error } = await supabaseClient
        .from('access_logs')
        .insert({
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          user_id,
          user_name,
          action,
          location,
          timestamp: new Date().toISOString(),
          success,
          details: details || null
        })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, log }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
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