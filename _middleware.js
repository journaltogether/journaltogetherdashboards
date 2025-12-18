// This file handles API routes directly in Cloudflare Pages
// Place in: /functions/_middleware.js

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Only handle API routes
  if (!url.pathname.startsWith('/api/')) {
    return context.next();
  }

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // API: Look up token by pseudonym
  if (url.pathname === "/api/lookup") {
    const pseudonym = url.searchParams.get("pseudonym")?.toLowerCase().trim();
    
    if (!pseudonym) {
      return new Response(
        JSON.stringify({ error: "Missing pseudonym" }), 
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = await env.TOKENS.get(pseudonym);
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Pseudonym not found. Check spelling or contact facilitator." }), 
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ 
        token,
        dashboardUrl: `/dashboard.html?token=${token}`
      }), 
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // API: Get dashboard data
  if (url.pathname === "/api/dashboard") {
    const token = url.searchParams.get("token");
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing token" }), 
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const dashboardKey = `dashboard-${token}`;
    const dashboard = await env.DASHBOARDS.get(dashboardKey, "json");
    
    if (!dashboard) {
      return new Response(
        JSON.stringify({ error: "Dashboard not found. It may have been removed after the retention period." }), 
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify(dashboard), 
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  return new Response("Not found", { status: 404 });
}
