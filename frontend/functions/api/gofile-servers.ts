export async function onRequestGet(context: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const url = new URL(context.request.url);
    const backendUrlParam = url.searchParams.get('backendUrl');
    let backendUrl = backendUrlParam || context.env?.BACKEND_URL;

    if (backendUrl) {
      try {
        const cleanUrl = backendUrl.replace(/\/$/, '');
        const res = await fetch(`${cleanUrl}/api/gofile-servers`);
        if (res.ok) {
          const data = await res.text();
          return new Response(data, {
            status: 200,
            headers: corsHeaders
          });
        }
      } catch {
        // Fallback to direct GoFile servers API
      }
    }

    const gfRes = await fetch('https://api.gofile.io/servers');
    if (gfRes.ok) {
      const gfData: any = await gfRes.json();
      if (gfData.status === 'ok') {
        const servers = (gfData.data?.servers || []).map((s: any) => ({
          name: s.name,
          zone: s.zone || 'global'
        }));
        const bestServer = servers[0]?.name || 'store-eu-par-6';
        return new Response(
          JSON.stringify({
            status: 'ok',
            bestServer,
            servers
          }),
          { status: 200, headers: corsHeaders }
        );
      }
    }

    // Default fallback
    return new Response(
      JSON.stringify({
        status: 'ok',
        bestServer: 'store-eu-par-6',
        servers: [
          { name: 'store-eu-par-6', zone: 'eu' },
          { name: 'store-eu-par-11', zone: 'eu' },
          { name: 'store-na-phx-4', zone: 'na' },
          { name: 'store-na-phx-3', zone: 'na' }
        ]
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ status: 'error', detail: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
