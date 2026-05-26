const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const smtpFrom = process.env.SMTP_FROM || 'checkin@viladefenals.com';

console.log("Loading SMTP configuration...");
console.log(`Host: ${smtpHost}`);
console.log(`Port: ${smtpPort}`);
console.log(`User: ${smtpUser}`);

if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
  console.error("Missing SMTP credentials in .env.local");
  process.exit(1);
}

async function run() {
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort, 10),
      secure: parseInt(smtpPort, 10) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    console.log("Sending test email to: " + smtpUser);

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: smtpUser,
      subject: "[Vila de Fenals] Test de Conexión SMTP",
      text: "¡Hola! Si has recibido este correo, significa que la configuración SMTP de Strato en tu .env.local es 100% correcta y funciona perfectamente.",
    });

    console.log("Email sent successfully! Message ID:", info.messageId);
  } catch (error) {
    console.error("SMTP Test Error:", error);
  }
}

run();
