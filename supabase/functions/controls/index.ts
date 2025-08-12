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
    
    // GET /controls - Get all room controls
    if (req.method === 'GET' && pathParts.length === 2) {
      const { data: controls, error } = await supabaseClient
        .from('controls')
        .select('*')
        .order('location', { ascending: true })

      if (error) throw error

      return new Response(
        JSON.stringify(controls),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // PUT /controls/{id} - Update control status
    if (req.method === 'PUT' && pathParts.length === 3) {
      const controlId = pathParts[2]
      const body = await req.json()
      const { status, value } = body

      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      }
      
      if (value !== undefined) {
        updateData.value = value
      }

      const { data: control, error } = await supabaseClient
        .from('controls')
        .update(updateData)
        .eq('id', controlId)
        .select()
        .single()

      if (error) throw error

      // Log the control action
      await supabaseClient
        .from('access_logs')
        .insert({
          id: `control-${Date.now()}-${controlId}`,
          user_id: 'system',
          user_name: 'System',
          action: `control_${status ? 'on' : 'off'}`,
          location: control.location,
          timestamp: new Date().toISOString(),
          success: true,
          details: { controlId, previousStatus: !status, newStatus: status, value }
        })

      return new Response(
        JSON.stringify({ success: true, control }),
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