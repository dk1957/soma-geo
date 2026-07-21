import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Basic validation
    const { name, email, company, position, phone, message } = body;
    
    if (!name || !email || !company) {
      return NextResponse.json(
        { error: 'Name, email, and company are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Send notification email to withsoma.ai@gmail.com
    await resend.emails.send({
      from: 'hello@withsoma.ai',
      to: ['withsoma.ai@gmail.com'],
      subject: `New Demo Request from ${company}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">New Demo Request</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${company}</p>
            <p><strong>Position:</strong> ${position || 'Not provided'}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: white; padding: 15px; border-left: 4px solid #4F46E5; margin-top: 10px;">
              ${message || 'No message provided'}
            </div>
          </div>
          <p style="color: #666; font-size: 14px;">Request submitted at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    // Send confirmation email to the requester
    await resend.emails.send({
      from: 'hello@withsoma.ai',
      to: [email],
      subject: 'Thank you for your demo request - Soma AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Thank you for requesting a demo!</h2>
          <p>Hi ${name},</p>
          <p>We received your demo request for <strong>${company}</strong> and will get back to you within 24 hours.</p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5;">
            <h3 style="margin-top: 0; color: #1e40af;">What happens next?</h3>
            <ul style="color: #374151;">
              <li>Our team will review your request</li>
              <li>We'll schedule a personalized demo session</li>
              <li>You'll receive a calendar invite within 24 hours</li>
              <li>We'll show you how Soma AI can boost your brand's AI visibility</li>
            </ul>
          </div>

          <p>In the meantime, feel free to explore our <a href="https://medium.com/@withsoma.ai/generative-engine-optimisation-a-new-playbook-for-african-and-middle-eastern-brand-discoverability-62df5df31e02" style="color: #4F46E5;">latest insights</a> on AI discoverability.</p>
          
          <p>Best regards,<br><strong>The Soma AI Team</strong></p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            Soma AI - Generative Engine Optimization Platform<br>
            Making brands discoverable in the age of AI
          </p>
        </div>
      `,
    });

    return NextResponse.json(
      { success: true, message: 'Demo request submitted successfully! Check your email for confirmation.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing demo request:', error);
    return NextResponse.json(
      { error: 'Failed to send demo request. Please try again.' },
      { status: 500 }
    );
  }
}
