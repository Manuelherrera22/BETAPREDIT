/**
 * Notifications Edge Function
 * Handles notifications management using Supabase
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_PROJECT_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Supabase configuration missing' } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'No authorization header' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: { message: 'Invalid token' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const functionIndex = pathParts.indexOf('notifications');
    const action = pathParts[functionIndex + 1]; // 'unread-count', 'read-all', notificationId, etc.
    const subAction = pathParts[functionIndex + 2]; // 'read', 'click', etc.

    // GET /notifications - Get user notifications
    if (req.method === 'GET' && !action) {
      const read = url.searchParams.get('read');
      const type = url.searchParams.get('type');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = supabase
        .from('Notification')
        .select('*')
        .eq('userId', userId)
        .or(`expiresAt.is.null,expiresAt.gt.${new Date().toISOString()}`)
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1);

      if (read === 'true') {
        query = query.eq('read', true);
      } else if (read === 'false') {
        query = query.eq('read', false);
      }

      if (type) {
        query = query.eq('type', type);
      }

      const { data: notifications, error: queryError } = await query;

      if (queryError) {
        console.error('Error fetching notifications:', queryError);
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Failed to fetch notifications' } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: notifications || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /notifications/unread-count - Get unread count
    if (req.method === 'GET' && action === 'unread-count') {
      const { count, error: countError } = await supabase
        .from('Notification')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId)
        .eq('read', false)
        .or(`expiresAt.is.null,expiresAt.gt.${new Date().toISOString()}`);

      if (countError) {
        console.error('Error fetching unread count:', countError);
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Failed to fetch unread count' } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: { count: count || 0 } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /notifications/:notificationId/read - Mark as read
    if (req.method === 'POST' && subAction === 'read') {
      const notificationId = action;

      if (!notificationId) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Notification ID required' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify notification exists and belongs to user
      const { data: notification, error: notificationError } = await supabase
        .from('Notification')
        .select('id')
        .eq('id', notificationId)
        .eq('userId', userId)
        .single();

      if (notificationError || !notification) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Notification not found' } }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update notification
      const { data: updatedNotification, error: updateError } = await supabase
        .from('Notification')
        .update({ read: true, readAt: new Date().toISOString() })
        .eq('id', notificationId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating notification:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Failed to update notification' } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: updatedNotification }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /notifications/:notificationId/click - Mark as clicked
    if (req.method === 'POST' && subAction === 'click') {
      const notificationId = action;

      if (!notificationId) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Notification ID required' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify notification exists and belongs to user
      const { data: notification, error: notificationError } = await supabase
        .from('Notification')
        .select('id')
        .eq('id', notificationId)
        .eq('userId', userId)
        .single();

      if (notificationError || !notification) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Notification not found' } }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update notification
      const { data: updatedNotification, error: updateError } = await supabase
        .from('Notification')
        .update({ clicked: true, clickedAt: new Date().toISOString() })
        .eq('id', notificationId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating notification:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Failed to update notification' } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: updatedNotification }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /notifications/read-all - Mark all as read
    if (req.method === 'POST' && action === 'read-all') {
      const { data, error: updateError } = await supabase
        .from('Notification')
        .update({ read: true, readAt: new Date().toISOString() })
        .eq('userId', userId)
        .eq('read', false)
        .select();

      if (updateError) {
        console.error('Error updating notifications:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Failed to update notifications' } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: { count: data?.length || 0 } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /notifications/:notificationId - Delete notification
    if (req.method === 'DELETE' && action && !subAction) {
      const notificationId = action;

      if (!notificationId) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Notification ID required' } }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify notification exists and belongs to user
      const { data: notification, error: notificationError } = await supabase
        .from('Notification')
        .select('id')
        .eq('id', notificationId)
        .eq('userId', userId)
        .single();

      if (notificationError || !notification) {
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Notification not found' } }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete notification
      const { error: deleteError } = await supabase
        .from('Notification')
        .delete()
        .eq('id', notificationId);

      if (deleteError) {
        console.error('Error deleting notification:', deleteError);
        return new Response(
          JSON.stringify({ success: false, error: { message: 'Failed to delete notification' } }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Notification deleted successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: { message: 'Method not allowed' } }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in notifications function:', error);
    return new Response(
      JSON.stringify({ success: false, error: { message: error.message || 'Internal server error' } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
