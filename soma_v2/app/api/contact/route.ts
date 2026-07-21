import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { firstName, lastName, email, phone, company, role, message } = body

    if (!firstName || !email || !company || !message) {
      return NextResponse.json(
        { error: 'First name, email, company, and message are required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const fullName = [firstName, lastName].filter(Boolean).join(' ')

    // Send notification to team
    await resend.emails.send({
      from: 'Soma AI <hello@withsoma.ai>',
      to: ['withsoma.ai@gmail.com'],
      subject: `New Contact Form: ${fullName} from ${company}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">New Contact Form Submission</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Company:</strong> ${company}</p>
            <p><strong>Role:</strong> ${role || 'Not provided'}</p>
          </div>
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Message</h3>
            <div style="background-color: white; padding: 15px; border-left: 4px solid #000; border-radius: 4px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <p style="color: #666; font-size: 14px;">Submitted at: ${new Date().toISOString()}</p>
        </div>
      `,
    })

    // Send confirmation to submitter
    await resend.emails.send({
      from: 'Soma AI <hello@withsoma.ai>',
      to: [email],
      subject: 'We received your message — Soma AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #000;">Thanks for reaching out, ${firstName}!</h2>
          <p>We received your message and will get back to you within 2 business hours.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #000;">What happens next?</h3>
            <ul style="color: #374151;">
              <li>Our team reviews your message</li>
              <li>We'll respond within 2 hours during business hours</li>
              <li>If relevant, we'll schedule a strategy call</li>
            </ul>
          </div>
          <p>In the meantime, you can <a href="https://withsoma.ai/free-audit" style="color: #000; font-weight: bold;">run a free AI visibility audit</a> to see where your brand stands.</p>
          <p>Best,<br><strong>The Soma AI Team</strong></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            Soma AI — Generative Engine Optimization Platform<br>
            <a href="https://withsoma.ai" style="color: #6b7280;">withsoma.ai</a>
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    )
  }
}
