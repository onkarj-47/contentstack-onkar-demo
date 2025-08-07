import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side API route to handle personalization event tracking
 * This avoids CORS issues by making the request from the server instead of browser
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get environment variables
    const personalizationProjectUid = process.env.NEXT_PUBLIC_CONTENTSTACK_PERSONALIZE_PROJECT_UID;
    const personalizationEdgeApiUrl = process.env.NEXT_PUBLIC_CONTENTSTACK_PERSONALIZE_EDGE_API_URL;
    
    if (!personalizationProjectUid || !personalizationEdgeApiUrl) {
      console.error('❌ Missing personalization environment variables');
      return NextResponse.json(
        { error: 'Personalization not configured' },
        { status: 500 }
      );
    }

    // Construct the events endpoint URL
    const eventsUrl = `${personalizationEdgeApiUrl}/events`;
    
    console.log('🔮 Server API: Forwarding event to:', eventsUrl);
    console.log('🔮 Server API: Event payload:', JSON.stringify(body, null, 2));

    // Forward the request to Contentstack Personalize
    const response = await fetch(eventsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Contentstack-Blog-App/1.0',
        // Add the required project UID header
        'x-project-uid': personalizationProjectUid,
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    
    console.log('🔮 Server API: Response status:', response.status);
    console.log('🔮 Server API: Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('🔮 Server API: Response text:', responseText);
    
    if (!response.ok) {
      console.error('🔮 Server API: Personalization API error:', {
        status: response.status,
        statusText: response.statusText,
        response: responseText,
        requestHeaders: {
          'Content-Type': 'application/json',
          'x-project-uid': personalizationProjectUid,
        },
        requestUrl: eventsUrl,
        requestBody: JSON.stringify(body)
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to track event',
          details: responseText,
          status: response.status 
        },
        { status: response.status }
      );
    }

    console.log('🔮 Server API: Event tracked successfully');
    
    // Try to parse response as JSON, fall back to text
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('🔮 Server API: Error tracking event:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also handle GET requests for debugging
export async function GET() {
  return NextResponse.json({
    message: 'Personalization event tracking API',
    endpoints: {
      POST: '/api/personalization/track-event'
    },
    usage: 'Send POST requests with event data to track user interactions'
  });
}
