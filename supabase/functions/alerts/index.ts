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
    
    // GET /alerts - Get all alerts
    if (req.method === 'GET' && pathParts.length === 2) {
      const { data: alerts, error } = await supabaseClient
        .from('alerts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50)

      if (error) throw error

      return new Response(
        JSON.stringify(alerts),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // POST /alerts/{id}/acknowledge - Acknowledge an alert
    if (req.method === 'POST' && pathParts.length === 4 && pathParts[3] === 'acknowledge') {
      const alertId = pathParts[2]

      const { data: alert, error } = await supabaseClient
        .from('alerts')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .select()
        .single()

      if (error) throw error

      // Log the acknowledgment
      await supabaseClient
        .from('access_logs')
        .insert({
          id: `ack-${Date.now()}-${alertId}`,
          user_id: 'system',
          user_name: 'System',
          action: 'alert_acknowledged',
          location: alert.location,
          timestamp: new Date().toISOString(),
          success: true,
          details: { alertId, alertType: alert.type, alertMessage: alert.message }
        })

      return new Response(
        JSON.stringify({ success: true, alert }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // POST /alerts - Create new alert
    if (req.method === 'POST' && pathParts.length === 2) {
      const body = await req.json()
      const { type, message, location } = body

      const { data: alert, error } = await supabaseClient
        .from('alerts')
        .insert({
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          message,
          location,
          timestamp: new Date().toISOString(),
          acknowledged: false
        })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, alert }),
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