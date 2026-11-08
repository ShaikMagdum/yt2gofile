export async function onRequestPost(context: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const rawBody = await context.request.text();
    const body: any = JSON.parse(rawBody || '{}');
    const url = body?.url?.trim();
    let backendUrl = body?.backendUrl?.trim() || context.env?.BACKEND_URL;

    if (!url) {
      return new Response(JSON.stringify({ detail: 'YouTube URL is required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Try backend first if available
    if (backendUrl) {
      try {
        const cleanUrl = backendUrl.replace(/\/$/, '');
        const backendRes = await fetch(`${cleanUrl}/api/info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        if (backendRes.ok) {
          const backendData = await backendRes.text();
          return new Response(backendData, {
            status: backendRes.status,
            headers: corsHeaders
          });
        }
      } catch {
        // Fallback to oEmbed metadata
      }
    }

    // Extract video ID from YouTube URL
    const idMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    const videoId = idMatch ? idMatch[1] : '';

    // Fetch official YouTube oEmbed metadata
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ detail: 'Could not fetch metadata for this YouTube URL. Please verify the link.' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const data: any = await res.json();
    const title = data.title || 'YouTube Video';
    const uploader = data.author_name || 'YouTube Creator';
    const channelUrl = data.author_url || '';
    const thumbnail = videoId
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : data.thumbnail_url || '';

    // Complete resolution ladder preserving all qualities
    const qualities = [
      { id: '2160', label: '2160p (4K UHD)', height: 2160, type: 'video' },
      { id: '1440', label: '1440p (2K QHD)', height: 1440, type: 'video' },
      { id: '1080', label: '1080p (1080p Full HD)', height: 1080, type: 'video' },
      { id: '720', label: '720p (720p HD)', height: 720, type: 'video' },
      { id: '480', label: '480p', height: 480, type: 'video' },
      { id: '360', label: '360p', height: 360, type: 'video' },
      { id: 'mp3', label: 'MP3 Audio (High Quality 320kbps)', height: 0, type: 'audio' }
    ];

    return new Response(
      JSON.stringify({
        status: 'success',
        data: {
          id: videoId || url,
          title,
          thumbnail,
          duration: 0,
          uploader,
          channelUrl,
          viewCount: 0,
          webpageUrl: url,
          qualities
        }
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ detail: err.message || 'Error processing YouTube request' }), {
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
