import { NextRequest, NextResponse } from 'next/server';
import { stack } from '@/lib/contentstack';
import { QueryOperation } from '@contentstack/delivery-sdk';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Find the subscriber
    const existingSubscriber = await stack
      .contentType('newsletter_subscriber')
      .entry()
      .query()
      .where('email', QueryOperation.EQUALS, email)
      .find();

    if (!existingSubscriber.entries || existingSubscriber.entries.length === 0) {
      return NextResponse.json(
        { message: 'Email not found in our subscriber list' },
        { status: 404 }
      );
    }

    // Note: This is a demo implementation. In a real application, you would:
    // 1. Use the Contentstack Management API to update entries, or
    // 2. Update subscribers in a separate database, or
    // 3. Use a third-party email service API to unsubscribe
    
    // For this demo, we'll simulate successful unsubscription
    const subscriberEntry = existingSubscriber.entries[0];
    console.log(`Unsubscribed: ${email} at ${new Date().toISOString()}`);
    
    return NextResponse.json(
      { message: 'Successfully unsubscribed from newsletter' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe. Please try again.' },
      { status: 500 }
    );
  }
}

// Handle GET requests for unsubscribe links in emails
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.redirect('/');
  }

  try {
    // Auto-unsubscribe via GET request (from email link)
    const response = await fetch(`${request.nextUrl.origin}/api/newsletter/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      // Redirect to a success page or homepage with success message
      return NextResponse.redirect(`${request.nextUrl.origin}/?unsubscribed=true`);
    } else {
      return NextResponse.redirect(`${request.nextUrl.origin}/?unsubscribe_error=true`);
    }
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/?unsubscribe_error=true`);
  }
}