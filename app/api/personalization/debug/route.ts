import { NextResponse } from 'next/server';

/**
 * Debug route to check personalization configuration
 */
export async function GET() {
  const personalizationProjectUid = process.env.NEXT_PUBLIC_CONTENTSTACK_PERSONALIZE_PROJECT_UID;
  const personalizationEdgeApiUrl = process.env.NEXT_PUBLIC_CONTENTSTACK_PERSONALIZE_EDGE_API_URL;
  
  const config = {
    personalizationConfigured: !!(personalizationProjectUid && personalizationEdgeApiUrl),
    projectUid: personalizationProjectUid ? '✅ Set' : '❌ Missing',
    edgeApiUrl: personalizationEdgeApiUrl ? '✅ Set' : '❌ Missing',
    eventsEndpoint: personalizationEdgeApiUrl ? `${personalizationEdgeApiUrl}/events` : 'Not available',
    manifestEndpoint: personalizationEdgeApiUrl ? `${personalizationEdgeApiUrl}/manifest` : 'Not available',
  };

  console.log('🔍 Personalization Debug:', config);

  return NextResponse.json({
    status: 'Personalization Debug Info',
    config,
    troubleshooting: {
      'If personalizationConfigured is false': 'Check your .env.local file for NEXT_PUBLIC_CONTENTSTACK_PERSONALIZE_* variables',
      'If events fail': 'Check that the Contentstack Personalize project is properly configured',
      'CORS issues': 'Should be resolved by using this server-side API route',
    }
  });
}
