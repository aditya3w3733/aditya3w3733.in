import type { APIRoute } from 'astro';

const votes = new Map<string, number>();
const ipRecords = new Map<string, Set<string>>();

export const GET: APIRoute = async ({ url, request }) => {
  const postId = url.searchParams.get('postId');
  
  if (!postId) {
    return new Response(JSON.stringify({ error: 'postId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

  const count = votes.get(postId) || 0;
  const hasUpvoted = ipRecords.get(postId)?.has(clientIP) || false;

  return new Response(JSON.stringify({ count, hasUpvoted }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ url, request }) => {
  const postId = url.searchParams.get('postId');
  
  if (!postId) {
    return new Response(JSON.stringify({ error: 'postId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

  if (!ipRecords.has(postId)) {
    ipRecords.set(postId, new Set());
  }

  const postIpRecords = ipRecords.get(postId)!;

  if (postIpRecords.has(clientIP)) {
    return new Response(JSON.stringify({ 
      error: 'Already upvoted',
      count: votes.get(postId) || 0,
      hasUpvoted: true
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const currentCount = votes.get(postId) || 0;
  const newCount = currentCount + 1;
  
  votes.set(postId, newCount);
  postIpRecords.add(clientIP);

  return new Response(JSON.stringify({ count: newCount, hasUpvoted: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
