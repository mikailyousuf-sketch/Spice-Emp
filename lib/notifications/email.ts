import "server-only";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendTransactionalEmail(payload: EmailPayload) {
  const user = process.env.GMAIL_SMTP_USER || "theglidedpantry.co.za@gmail.com";
  const appPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

  if (!appPassword) {
    console.warn("[email] Gmail SMTP skipped: GMAIL_APP_PASSWORD is not configured");
    return { sent: false, reason: "not_configured" as const };
  }

  const { connect } = await import("node:tls");

  await new Promise<void>((resolve, reject) => {
    const socket = connect(
      {
        host: "smtp.gmail.com",
        port: 465,
        servername: "smtp.gmail.com",
        rejectUnauthorized: true,
      },
      () => {
        let buffer = "";
        const queue: Array<{
          expect: number[];
          resolve: (value: string) => void;
          reject: (error: Error) => void;
        }> = [];

        function flush() {
          const lines = buffer.split("\r\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!/^\d{3}[ -]/.test(line)) continue;
            const pending = queue[0];
            if (!pending) continue;
            if (line[3] === "-") continue;

            queue.shift();
            const code = Number(line.slice(0, 3));
            if (pending.expect.includes(code)) pending.resolve(line);
            else pending.reject(new Error(`SMTP error: ${line}`));
          }
        }

        socket.on("data", (chunk) => {
          buffer += chunk.toString("utf8");
          flush();
        });

        socket.once("error", reject);

        function waitFor(expect: number[]) {
          return new Promise<string>((resolveStep, rejectStep) => {
            queue.push({ expect, resolve: resolveStep, reject: rejectStep });
          });
        }

        async function command(value: string, expect: number[]) {
          const pending = waitFor(expect);
          socket.write(value + "\r\n");
          return pending;
        }

        void (async () => {
          try {
            await waitFor([220]);
            await command("EHLO theglidedpantry.co.za", [250]);
            await command("AUTH LOGIN", [334]);
            await command(Buffer.from(user).toString("base64"), [334]);
            await command(Buffer.from(appPassword).toString("base64"), [235]);
            await command(`MAIL FROM:<${user}>`, [250]);
            await command(`RCPT TO:<${payload.to}>`, [250, 251]);
            await command("DATA", [354]);

            const html = payload.html.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
            const message = [
              `From: The Glided Pantry <${user}>`,
              `To: <${payload.to}>`,
              `Subject: ${payload.subject}`,
              "MIME-Version: 1.0",
              'Content-Type: text/html; charset="UTF-8"',
              "Content-Transfer-Encoding: 8bit",
              "",
              html,
              ".",
            ].join("\r\n");

            const accepted = waitFor([250]);
            socket.write(message + "\r\n");
            await accepted;
            await command("QUIT", [221]);
            socket.end();
            resolve();
          } catch (error) {
            socket.destroy();
            reject(error);
          }
        })();
      },
    );
  });

  return { sent: true as const };
}

function shell(title: string, body: string) {
  return `
    <div style="margin:0;padding:32px 16px;background:#f4efe7;font-family:Arial,sans-serif;color:#171513">
      <div style="max-width:640px;margin:0 auto;background:#fffdf9;border:1px solid #e1d9cf;border-radius:20px;overflow:hidden">
        <div style="padding:28px 32px;border-bottom:1px solid #eee6dc">
          <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#9b6518">The Glided Pantry</div>
          <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:32px;font-weight:500">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:28px 32px;line-height:1.65">${body}</div>
      </div>
    </div>
  `;
}

export async function sendOrderConfirmationEmail(order: {
  email: string;
  order_number: string;
  total_cents: number;
  shipping_method_snapshot: string | null;
  order_access_token: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
  const confirmationUrl = siteUrl
    ? `${siteUrl}/order-confirmation/${order.order_access_token}`
    : "";

  const html = shell(
    `Order ${order.order_number} confirmed`,
    `
      <p style="margin-top:0">Thanks for your order. Your payment has been confirmed and your pantry order is now in our system.</p>
      <div style="margin:24px 0;padding:18px;border-radius:14px;background:#f7f2ea">
        <p style="margin:0 0 8px"><strong>Order:</strong> ${escapeHtml(order.order_number)}</p>
        <p style="margin:0 0 8px"><strong>Total paid:</strong> R${(Number(order.total_cents) / 100).toFixed(2)}</p>
        <p style="margin:0"><strong>Delivery:</strong> ${escapeHtml(order.shipping_method_snapshot || "Selected delivery method")}</p>
      </div>
      <p>We’ll keep the order status updated as it moves through fulfilment.</p>
      ${confirmationUrl ? `<p style="margin-top:26px"><a href="${confirmationUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#171513;color:#fff;text-decoration:none">View order confirmation</a></p>` : ""}
    `,
  );

  return sendTransactionalEmail({
    to: order.email,
    subject: `Order confirmed · ${order.order_number}`,
    html,
  });
}

export async function sendOrderStatusEmail(order: {
  email: string;
  order_number: string;
  status: string;
  fulfilment_status: string;
  tracking_reference: string | null;
}) {
  const statusLabel =
    order.status === "shipped"
      ? "Your order is on the way"
      : order.status === "completed"
        ? "Your order is complete"
        : order.status === "processing"
          ? "We’re preparing your order"
          : `Order update: ${order.status}`;

  const html = shell(
    statusLabel,
    `
      <p style="margin-top:0">There’s an update on order <strong>${escapeHtml(order.order_number)}</strong>.</p>
      <div style="margin:24px 0;padding:18px;border-radius:14px;background:#f7f2ea">
        <p style="margin:0 0 8px"><strong>Order status:</strong> ${escapeHtml(order.status)}</p>
        <p style="margin:0 0 8px"><strong>Fulfilment:</strong> ${escapeHtml(order.fulfilment_status)}</p>
        ${order.tracking_reference ? `<p style="margin:0"><strong>Tracking / reference:</strong> ${escapeHtml(order.tracking_reference)}</p>` : ""}
      </div>
      <p>If you need help with this order, reply to your usual support channel and include the order number above.</p>
    `,
  );

  return sendTransactionalEmail({
    to: order.email,
    subject: `${statusLabel} · ${order.order_number}`,
    html,
  });
}

export async function sendWholesaleAcknowledgementEmail(enquiry: {
  email: string;
  contact_name: string;
  company_name: string;
}) {
  const html = shell(
    "Wholesale enquiry received",
    `
      <p style="margin-top:0">Hi ${escapeHtml(enquiry.contact_name)},</p>
      <p>We’ve received the wholesale enquiry for <strong>${escapeHtml(enquiry.company_name)}</strong>.</p>
      <p>Our team will review the requested products, quantities and business details before moving it into the quotation process.</p>
      <div style="margin:24px 0;padding:18px;border-radius:14px;background:#f7f2ea">
        <p style="margin:0"><strong>Current status:</strong> New · awaiting review</p>
      </div>
      <p>You don’t need to submit another enquiry while this one is being reviewed.</p>
    `,
  );

  return sendTransactionalEmail({
    to: enquiry.email,
    subject: "Wholesale enquiry received · The Glided Pantry",
    html,
  });
}
