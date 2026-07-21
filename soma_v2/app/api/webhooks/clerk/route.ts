import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  // Get the webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('⚠️ Missing CLERK_WEBHOOK_SECRET - profiles may not be created automatically')
    console.error('⚠️ Add CLERK_WEBHOOK_SECRET to .env file from Clerk Dashboard')
    
    // Still try to process the webhook body for logging purposes
    try {
      const payload = await req.json()
      console.log('📨 Webhook payload (unverified):', JSON.stringify(payload, null, 2))
    } catch (e) {
      console.error('Failed to parse webhook body:', e)
    }
    
    return new Response('Webhook secret not configured', { status: 500 })
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }

  // Get the event type
  const eventType = evt.type
  console.log(`📨 Clerk webhook received: ${eventType}`)

  const supabase = createServiceClient()

  try {
    switch (eventType) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data
        const primaryEmail = email_addresses?.[0]?.email_address

        if (!primaryEmail) {
          console.error('No email address found for user:', id)
          return new Response('No email address', { status: 400 })
        }

        // Create profile in Supabase
        const { error } = await supabase.from('profiles').insert({
          clerk_id: id,
          email: primaryEmail,
          full_name: [first_name, last_name].filter(Boolean).join(' ') || null,
          avatar_url: image_url || null,
          auth_provider: 'clerk',
          role: 'user',
          onboarding_status: 'never_started',
          onboarding_step: 0,
        })

        if (error) {
          // Check if profile already exists (duplicate webhook)
          if (error.code === '23505') {
            console.log('Profile already exists for clerk_id:', id)
          } else {
            console.error('Error creating profile:', error)
            return new Response('Error creating profile', { status: 500 })
          }
        } else {
          console.log('✅ Created profile for Clerk user:', id, primaryEmail)
        }
        break
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data
        const primaryEmail = email_addresses?.[0]?.email_address

        // Update profile in Supabase
        const { error } = await supabase
          .from('profiles')
          .update({
            email: primaryEmail,
            full_name: [first_name, last_name].filter(Boolean).join(' ') || null,
            avatar_url: image_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_id', id)

        if (error) {
          console.error('Error updating profile:', error)
          return new Response('Error updating profile', { status: 500 })
        }
        console.log('✅ Updated profile for Clerk user:', id)
        break
      }

      case 'user.deleted': {
        const { id } = evt.data

        if (!id) {
          return new Response('No user ID', { status: 400 })
        }

        // Soft delete or handle user deletion
        // For now, we'll just log it - you may want to implement proper cleanup
        console.log('🗑️ Clerk user deleted:', id)
        
        // Optional: Delete profile and related data
        // const { error } = await supabase
        //   .from('profiles')
        //   .delete()
        //   .eq('clerk_id', id)
        
        break
      }

      case 'session.created': {
        // Optional: Track session creation
        console.log('🔐 Session created for user:', evt.data.user_id)
        break
      }

      case 'session.ended': {
        // Optional: Track session end
        console.log('🔓 Session ended for user:', evt.data.user_id)
        break
      }

      default:
        console.log(`Unhandled webhook event: ${eventType}`)
    }

    return new Response('Webhook processed', { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('Error processing webhook', { status: 500 })
  }
}
