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

    // Check if email already exists
    const existingSubscriber = await stack
      .contentType('newsletter_subscriber')
      .entry()
      .query()
      .where('email', QueryOperation.EQUALS, email)
      .find();

    if (existingSubscriber.entries && existingSubscriber.entries.length > 0) {
      return NextResponse.json(
        { message: 'Email already subscribed' },
        { status: 200 }
      );
    }

    // Note: This is a demo implementation. In a real application, you would:
    // 1. Use the Contentstack Management API to create entries, or
    // 2. Store subscribers in a separate database, or
    // 3. Use a third-party email service like Mailchimp, ConvertKit, etc.
    
    // For this demo, we'll simulate successful subscription
    console.log(`New subscriber: ${email} at ${new Date().toISOString()}`);
    
    return NextResponse.json(
      { message: 'Successfully subscribed to newsletter!' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}