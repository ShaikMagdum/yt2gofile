export async function onRequestPost(context: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    const rawBody = await context.request.text();
    const body: any = JSON.parse(rawBody || '{}');
    let backendUrl = body?.backendUrl?.trim() || context.env?.BACKEND_URL;

    if (backendUrl) {
      const cleanUrl = backendUrl.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: body.url,
          quality: body.quality || '1080',
          gofileToken: body.gofileToken || null,
          gofileFolderId: body.gofileFolderId || null,
          gofileServer: body.gofileServer || 'auto'
        })
      });

      const data = await res.text();
      return new Response(data, {
        status: res.status,
        headers: corsHeaders
      });
    }

    return new Response(
      JSON.stringify({
        status: 'error',
        detail: 'Cloud backend is initializing or disconnected. Please verify the backend URL in Settings.'
      }),
      { status: 503, headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        status: 'error',
        detail: err.message || 'Error processing download request'
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
