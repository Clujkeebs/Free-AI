import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!stripeSecretKey || !priceId) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 500 }
    );
  }

  const { user } = await requireUser();
  const admin = createSupabaseAdmin();
  const stripe = new Stripe(stripeSecretKey);

  const { data: profile, error } = await admin
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let customerId = profile.stripe_customer_id as string | null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? profile.email ?? undefined,
      metadata: { supabase_user_id: user.id }
    });
    customerId = customer.id;

    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/dashboard?checkout=cancelled`,
    allow_promotion_codes: true
  });

  return NextResponse.json({ url: session.url });
}
