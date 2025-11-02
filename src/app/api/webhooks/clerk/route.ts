// Story 3.1: User Authentication - Clerk Webhook Handler

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createTenantForUser } from "@/lib/auth/tenant-manager";

/**
 * POST handler for Clerk webhooks
 * Handles user.created events to automatically create tenants
 */
export async function POST(req: Request) {
  // Get the webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing svix headers");
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the webhook signature
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  // Handle the webhook
  const eventType = evt.type;

  // Handle user.created event
  if (eventType === "user.created") {
    const { id, email_addresses } = evt.data;

    // Get primary email
    const primaryEmail = email_addresses.find(
      (email) => email.id === evt.data.primary_email_address_id
    );

    if (!primaryEmail) {
      console.error("No primary email found for user:", id);
      return NextResponse.json(
        { error: "No primary email found" },
        { status: 400 }
      );
    }

    try {
      // Create tenant for the new user
      const tenant = await createTenantForUser(id, primaryEmail.email_address);

      console.log(`Successfully created tenant ${tenant.id} for user ${id}`);

      return NextResponse.json({
        success: true,
        message: "User created and assigned to tenant",
        tenantId: tenant.id,
        userId: id,
      });
    } catch (error) {
      console.error("Error creating tenant for user:", error);
      return NextResponse.json(
        { error: "Failed to create tenant" },
        { status: 500 }
      );
    }
  }

  // Handle other events (if needed in the future)
  console.log(`Received webhook event: ${eventType}`);

  return NextResponse.json({
    success: true,
    message: "Webhook received",
  });
}
