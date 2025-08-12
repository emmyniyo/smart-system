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
    
    // GET /sensors - Get all sensor data
    if (req.method === 'GET' && pathParts.length === 2) {
      const { data: sensors, error } = await supabaseClient
        .from('sensors')
        .select('*')
        .order('timestamp', { ascending: false })

      if (error) throw error

      return new Response(
        JSON.stringify(sensors),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // GET /sensors/{id}/history - Get sensor history
    if (req.method === 'GET' && pathParts.length === 4 && pathParts[3] === 'history') {
      const sensorId = pathParts[2]
      const range = url.searchParams.get('range') || '24h'
      
      // Calculate time range
      let timeAgo = new Date()
      if (range === '1h') timeAgo.setHours(timeAgo.getHours() - 1)
      else if (range === '24h') timeAgo.setHours(timeAgo.getHours() - 24)
      else if (range === '7d') timeAgo.setDate(timeAgo.getDate() - 7)
      else timeAgo.setHours(timeAgo.getHours() - 24)

      const { data: history, error } = await supabaseClient
        .from('sensors')
        .select('*')
        .eq('id', sensorId)
        .gte('timestamp', timeAgo.toISOString())
        .order('timestamp', { ascending: true })

      if (error) throw error

      return new Response(
        JSON.stringify(history),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // POST /sensors - Update sensor data
    if (req.method === 'POST') {
      const body = await req.json()
      const { id, type, value, unit, location } = body

      // Use the database function to update sensor data with automatic status calculation
      const { error } = await supabaseClient.rpc('update_sensor_data', {
        sensor_id: id,
        sensor_type: type,
        sensor_value: value,
        sensor_unit: unit,
        sensor_location: location
      })

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
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