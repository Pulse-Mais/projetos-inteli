import nodemailer from 'nodemailer';

// Configuração via variáveis de ambiente.
// Se SMTP_HOST não estiver definido, os e-mails são apenas logados (modo dev).
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT ?? '587');
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM ?? smtpUser ?? 'noreply@pulsemais.com.br';

const configured = !!(smtpHost && smtpUser && smtpPass);

const transporter = configured
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    })
  : null;

/**
 * Envia um e-mail para um ou mais destinatários.
 * Se o SMTP não estiver configurado (desenvolvimento), apenas loga no console.
 */
export async function enviarEmail(
  para: string | string[],
  assunto: string,
  texto: string,
): Promise<void> {
  const destinos = Array.isArray(para) ? para.join(', ') : para;

  if (!transporter) {
    console.warn('[emailService] SMTP não configurado — e-mail NÃO enviado.');
    console.info('[emailService] Para:', destinos);
    console.info('[emailService] Assunto:', assunto);
    console.info('[emailService] Corpo:', texto);
    return;
  }

  await transporter.sendMail({
    from: smtpFrom,
    to: destinos,
    subject: assunto,
    text: texto,
  });
}
