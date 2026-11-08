export async function onRequestGet(context: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { taskId } = context.params;
    const url = new URL(context.request.url);
    const backendUrlParam = url.searchParams.get('backendUrl');
    let backendUrl = backendUrlParam || context.env?.BACKEND_URL;

    if (backendUrl) {
      const cleanUrl = backendUrl.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/api/status/${taskId}`);
      const data = await res.text();
      return new Response(data, {
        status: res.status,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({ status: 'error', detail: 'Backend URL not configured' }), {
      status: 404,
      headers: corsHeaders
    });
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
