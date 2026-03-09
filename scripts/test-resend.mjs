import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
    try {
        const result = await resend.emails.send({
            from: 'Mendonca Global Gateway <no-reply@resend.mendoncagg.com>',
            to: 'YOUR_EMAIL_HERE',
            subject: 'Test from Mendonca Global Gateway',
            html: '<p>If you see this, Resend is working from your local machine.</p>',
        });
        console.log('Resend result:', result);
    } catch (err) {
        console.error('Resend error:', err);
    }
}

main();
