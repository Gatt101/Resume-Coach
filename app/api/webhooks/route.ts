import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import { CreateUser, UpdateUser, DeleteUser } from '@/lib/actions/user.action'

// Types for webhook data - matching Clerk's actual webhook structure
interface ClerkWebhookData {
  id: string
  username?: string | null
  email_addresses?: Array<{ email_address: string }>
  phone_numbers?: Array<{ phone_number: string }>
  first_name?: string | null
  last_name?: string | null
  image_url?: string | null
  [key: string]: any
}

function extractUserData(clerkData: ClerkWebhookData) {
  return {
    clerkId: clerkData.id,
    username: clerkData.username ?? '',
    email: clerkData.email_addresses?.[0]?.email_address ?? '',
    phoneNumber: clerkData.phone_numbers?.[0]?.phone_number ?? '',
    firstName: clerkData.first_name ?? '',
    lastName: clerkData.last_name ?? '',
    imageUrl: clerkData.image_url ?? '',
    clerkRaw: clerkData,
  }
}

export async function POST(req: NextRequest) {
  console.log('=== WEBHOOK START ===')
  
  try {
    // Verify webhook signature
    const evt = await verifyWebhook(req)
    const { data: clerkData, type: eventType } = evt
    
    console.log(`Received webhook: ${eventType} for user ${clerkData.id}`)
    
    // Validate required data
    if (!clerkData.id) {
      console.error('Missing user ID in webhook data')
      return new Response(JSON.stringify({ 
        error: 'Invalid webhook data: missing user ID' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Handle different event types
    switch (eventType) {
      case 'user.created': {
        console.log('Processing user creation')
        try {
          const userData = extractUserData(clerkData)
          const newUser = await CreateUser(userData)
          console.log('User created successfully:', newUser._id)
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'User created successfully',
            userId: newUser._id 
          }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        } catch (error) {
          console.error('Error creating user:', error)
          // Return 200 to prevent Clerk from retrying for duplicate users
          if (error instanceof Error && error.message.includes('already exists')) {
            return new Response(JSON.stringify({ 
              success: true, 
              message: 'User already exists' 
            }), { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }
          throw error
        }
      }

      case 'user.updated': {
        console.log('Processing user update')
        try {
          const userData = extractUserData(clerkData)
          const { clerkId, ...updateData } = userData
          const updatedUser = await UpdateUser(clerkId, updateData)
          console.log('User updated successfully:', updatedUser._id)
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'User updated successfully',
            userId: updatedUser._id 
          }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        } catch (error) {
          console.error('Error updating user:', error)
          throw error
        }
      }

      case 'user.deleted': {
        console.log('Processing user deletion')
        try {
          const deletedUser = await DeleteUser(clerkData.id)
          console.log('User deleted successfully:', deletedUser._id)
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'User deleted successfully',
            userId: deletedUser._id 
          }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          })
        } catch (error) {
          console.error('Error deleting user:', error)
          throw error
        }
      }

      default: {
        console.log(`Unhandled webhook event type: ${eventType}`)
        return new Response(JSON.stringify({ 
          success: true, 
          message: `Event type ${eventType} received but not processed` 
        }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Check if it's a verification error
    if (error instanceof Error) {
      if (error.message.includes('verify') || error.message.includes('signature')) {
        return new Response(JSON.stringify({ 
          error: 'Webhook verification failed',
          message: error.message 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
    
    // Database or other processing errors
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'Failed to process webhook'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}