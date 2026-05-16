export const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Royal Brands Fashion <noreply@royalbrandsfashion.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

export const elegantTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Tenor Sans', sans-serif; background-color: #1a2a5e; color: #F5EFE0; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #213266; padding: 40px; border: 1px solid #D4AF37; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-family: 'Bodoni Moda', serif; font-size: 24px; color: #F5EFE0; letter-spacing: 4px; border: 1px solid #D4AF37; padding: 10px 20px; display: inline-block; }
        .content { line-height: 1.8; font-size: 16px; margin-bottom: 40px; }
        .button { display: inline-block; background-color: #D4AF37; color: #1a2a5e; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; font-size: 12px; }
        .footer { text-align: center; font-size: 10px; color: #F5EFE0; opacity: 0.6; margin-top: 40px; border-top: 1px solid rgba(212, 175, 55, 0.2); padding-top: 20px; }
        .footer a { color: #D4AF37; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ROYAL BRANDS FASHION</div>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            © ${new Date().getFullYear()} Royal Brands Fashion. All rights reserved.<br>
            Timeless Luxury, Reimagined.
        </div>
    </div>
</body>
</html>
`;
