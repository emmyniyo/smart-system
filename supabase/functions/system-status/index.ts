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
    
    // GET /system/status - Get system health status
    if (req.method === 'GET') {
      // Use the database function to get system health
      const { data: healthData, error: healthError } = await supabaseClient
        .rpc('get_system_health')

      if (healthError) throw healthError

      // Get detailed system status from system_status table
      const { data: statusData, error: statusError } = await supabaseClient
        .from('system_status')
        .select('*')

      if (statusError) throw statusError

      // Combine the data
      const systemStatus = {
        ...healthData,
        components: statusData.reduce((acc: any, item: any) => {
          acc[item.component.toLowerCase().replace(/[^a-z0-9]/g, '')] = item.status
          return acc
        }, {})
      }

      return new Response(
        JSON.stringify(systemStatus),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // POST /system/status - Update system component status
    if (req.method === 'POST') {
      const body = await req.json()
      const { component, status, details } = body

      const { data: statusUpdate, error } = await supabaseClient
        .from('system_status')
        .upsert({
          id: component.toLowerCase().replace(/[^a-z0-9]/g, ''),
          component,
          status,
          last_check: new Date().toISOString(),
          details: details || null,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, status: statusUpdate }),
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