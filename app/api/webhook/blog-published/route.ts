import { NextRequest, NextResponse } from 'next/server';
import { stack } from '@/lib/contentstack';
import { QueryOperation } from '@contentstack/delivery-sdk';

// Email service - using SendGrid as example
// You'll need to install: npm install @sendgrid/mail
// and add SENDGRID_API_KEY to your .env file

interface WebhookPayload {
  event: string;
  triggered_at: string;
  data: {
    uid: string;
    title: string;
    content_type: string;
    action: string;
    locale: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (recommended for security)
    const signature = request.headers.get('x-cs-signature');
    // You can implement signature verification here for security
    
    const payload: WebhookPayload = await request.json();
    
    // Check if this is a blog publish event
    if (
      payload.event !== 'entry.publish' || 
      payload.data.content_type !== 'blog' ||
      payload.data.action !== 'publish'
    ) {
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    // Get the published blog details
    const blogUid = payload.data.uid;
    const blog = await stack
      .contentType('blog')
      .entry(blogUid)
      .fetch();

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Get all newsletter subscribers
    const subscribers = await stack
      .contentType('newsletter_subscriber')
      .entry()
      .query()
      .where('status', QueryOperation.EQUALS, 'active')
      .find();

    if (!subscribers.entries || subscribers.entries.length === 0) {
      return NextResponse.json({ message: 'No subscribers found' }, { status: 200 });
    }

    // Send emails to all subscribers
    const emailPromises = subscribers.entries.map((subscriber: any) =>
      sendNewBlogEmail(subscriber.email, blog)
    );

    await Promise.allSettled(emailPromises);

    return NextResponse.json({ 
      message: `Notifications sent to ${subscribers.entries.length} subscribers` 
    }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function sendNewBlogEmail(subscriberEmail: string, blog: any) {
  try {
    // Using SendGrid - you can replace with your preferred email service
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const blogUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/blog/${blog.url?.startsWith('/') ? blog.url.slice(1) : blog.url}`;
    
    const msg = {
      to: subscriberEmail,
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      subject: `New Story Published: ${blog.title}`,
      html: generateEmailTemplate(blog, blogUrl, subscriberEmail),
    };

    await sgMail.send(msg);
    console.log(`Email sent to ${subscriberEmail}`);
  } catch (error) {
    console.error(`Failed to send email to ${subscriberEmail}:`, error);
  }
}

function generateEmailTemplate(blog: any, blogUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Story Published</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
        <h1 style="color: #2563eb; margin-bottom: 20px;">📖 New Story Published!</h1>
        
        ${blog.banner_image ? `
          <img src="${blog.banner_image.url}" alt="${blog.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 20px;">
        ` : ''}
        
        <h2 style="color: #1f2937; margin-bottom: 15px;">${blog.title}</h2>
        
        ${blog.summary ? `
          <p style="color: #6b7280; font-size: 16px; margin-bottom: 20px;">${blog.summary}</p>
        ` : ''}
        
        <div style="margin-bottom: 25px;">
          ${blog.author?.[0]?.title ? `
            <p style="margin: 5px 0; color: #6b7280;">
              <strong>Author:</strong> ${blog.author[0].title}
            </p>
          ` : ''}
          ${blog.reading_time ? `
            <p style="margin: 5px 0; color: #6b7280;">
              <strong>Reading Time:</strong> ${blog.reading_time} minutes
            </p>
          ` : ''}
          ${blog.categories_tags && blog.categories_tags.length > 0 ? `
            <p style="margin: 5px 0; color: #6b7280;">
              <strong>Tags:</strong> ${blog.categories_tags.join(', ')}
            </p>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${blogUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Read Full Story
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <div style="text-align: center; color: #9ca3af; font-size: 14px;">
          <p>You're receiving this because you subscribed to our newsletter.</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/unsubscribe?email=${encodeURIComponent(subscriberEmail)}" style="color: #6b7280; text-decoration: underline;">
              Unsubscribe
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}