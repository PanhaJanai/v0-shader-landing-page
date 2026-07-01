import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Import the singleton we created
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Store in the database
    const newMessage = await prisma.landingPageMessage.create({
      data: {
        name,
        email,
        message,
      },
    });

    // 2. Send email notifications via Resend
    if (resend) {
      const senderEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";
      const ownerEmail = process.env.NOTIFICATION_EMAIL || "your-email@example.com";

      // Send thank you note to client
      // Note: Resend's free onboarding domain (onboarding@resend.dev) only allows sending to your own verified email.
      // Once a custom domain is verified in Resend, you can send to any client email.
      try {
        const clientRes = await resend.emails.send({
          from: senderEmail,
          to: email,
          subject: "Thank you for reaching out!",
          html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <h2>Hi ${name},</h2>
              <p>Thank you for reaching out! We have received your message and will get back to you as soon as possible.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p><strong>Your message:</strong></p>
              <blockquote style="border-left: 3px solid #ccc; padding-left: 10px; margin-left: 0; color: #666;">
                ${message}
              </blockquote>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p>Best regards,<br/>Panha</p>
            </div>
          `,
        });
        console.log("Resend Client Email Result:", clientRes);
      } catch (clientEmailError) {
        console.error("Resend Client Email Error:", clientEmailError);
      }

      // Send notification to site owner
      try {
        const ownerRes = await resend.emails.send({
          from: senderEmail,
          to: ownerEmail,
          subject: `New Contact Submission from ${name}`,
          html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <h2>New Contact Submission</h2>
              <p>You received a new submission from your landing page contact form:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 120px;">Name</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Message</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${message}</td>
                </tr>
              </table>
            </div>
          `,
        });
        console.log("Resend Owner Email Result:", ownerRes);
      } catch (ownerEmailError) {
        console.error("Resend Owner Email Error:", ownerEmailError);
      }
    } else {
      console.warn("Resend API key is missing. Skipping email notifications.");
    }

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("Prisma Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {

    // 2. REAL Database Logic: Fetch all records
    const contacts = await prisma.landingPageMessage.findMany({
      orderBy: { createdAt: 'desc' } // Newest first
    });
    
    return NextResponse.json(contacts, { status: 200 });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts." },
      { status: 500 }
    );
  }

  
}