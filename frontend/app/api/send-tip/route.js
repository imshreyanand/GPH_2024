import nodemailer from 'nodemailer';

export async function POST(req) {
  const { code, tip } = await req.json();

  // Send the tip via email
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or any email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'police-station@example.com', // police email address
    subject: 'Anonymous Tip Submission',
    text: `Code: ${code}\nTip: ${tip}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return new Response(JSON.stringify({ message: 'Tip sent successfully' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Failed to send tip' }), { status: 500 });
  }
}
