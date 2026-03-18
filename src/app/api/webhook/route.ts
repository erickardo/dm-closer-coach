import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') as string

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const email = session.metadata?.email || session.customer_details?.email

    if (email) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: profile } = await supabaseAdmin
        .from('Creditos')
        .select('credits_left')
        .eq('email', email)
        .single()
        
      const currentCredits = profile?.credits_left || 0
      
      // Let's add 50 credits per package.
      await supabaseAdmin
        .from('Creditos')
        .update({ credits_left: currentCredits + 50 })
        .eq('email', email)
    }
  }

  return NextResponse.json({ received: true })
}
