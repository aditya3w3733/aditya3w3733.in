export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const postId = url.searchParams.get('postId');
    const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    if (!postId) {
      return new Response(JSON.stringify({ error: 'postId is required' }), {
        status: 400,
        headers
      });
    }

    if (request.method === 'GET') {
      const count = await env.UPVOTE_COUNT.get(postId) || '0';
      const hasUpvoted = await env.UPVOTE_RECORD.get(`${postId}:${clientIP}`) === 'true';
      
      return new Response(JSON.stringify({ 
        count: parseInt(count),
        hasUpvoted 
      }), { headers });
    }

    if (request.method === 'POST') {
      const recordKey = `${postId}:${clientIP}`;
      const hasUpvoted = await env.UPVOTE_RECORD.get(recordKey) === 'true';

      if (hasUpvoted) {
        return new Response(JSON.stringify({ 
          error: 'Already upvoted',
          count: parseInt(await env.UPVOTE_COUNT.get(postId) || '0'),
          hasUpvoted: true
        }), { 
          status: 400,
          headers 
        });
      }

      const currentCount = parseInt(await env.UPVOTE_COUNT.get(postId) || '0');
      const newCount = currentCount + 1;
      
      await env.UPVOTE_COUNT.put(postId, newCount.toString());
      await env.UPVOTE_RECORD.put(recordKey, 'true', { expirationTtl: 86400 * 30 });

      return new Response(JSON.stringify({ 
        count: newCount,
        hasUpvoted: true 
      }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers
    });
  }
};
