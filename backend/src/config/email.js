// ===========================
// backend/src/config/email.js (4/4)
// ===========================
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuração do transportador SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true para 465, false para outros ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Templates de email
const EMAIL_TEMPLATES = {
  // Confirmação de agendamento
  booking_confirmation: {
    subject: 'Agendamento Confirmado - {{company_name}}',
    template: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #070fef; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .booking-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; }
          .btn { background-color: #070fef; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Beautiful by Olivyx</h1>
            <h2>Agendamento Confirmado!</h2>
          </div>
          <div class="content">
            <p>Olá <strong>{{customer_name}}</strong>,</p>
            <p>Seu agendamento foi confirmado com sucesso em <strong>{{company_name}}</strong>!</p>
            
            <div class="booking-details">
              <h3>Detalhes do Agendamento:</h3>
              <p><strong>Serviço:</strong> {{service_name}}</p>
              <p><strong>Profissional:</strong> {{professional_name}}</p>
              <p><strong>Data:</strong> {{booking_date}}</p>
              <p><strong>Horário:</strong> {{start_time}}</p>
              <p><strong>Duração:</strong> {{duration}} minutos</p>
              <p><strong>Valor:</strong> R$ {{price}}</p>
            </div>
            
            <p><strong>Local:</strong><br>
            {{company_address}}<br>
            {{company_city}} - {{company_state}}</p>
            
            <p><strong>Contato:</strong> {{company_phone}}</p>
            
            <p>Precisa remarcar ou cancelar? Entre em contato conosco até 2 horas antes do horário agendado.</p>
            
            <p>Obrigado por escolher nossos serviços!</p>
          </div>
          <div class="footer">
            <p>Este email foi enviado automaticamente pelo sistema Beautiful SaaS by Olivyx</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  // Lembrete de agendamento
  booking_reminder: {
    subject: 'Lembrete: Agendamento amanhã - {{company_name}}',
    template: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #ffa500; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .reminder-box { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Lembrete de Agendamento</h1>
          </div>
          <div class="content">
            <p>Olá <strong>{{customer_name}}</strong>,</p>
            <p>Este é um lembrete de que você tem um agendamento <strong>amanhã</strong>!</p>
            
            <div class="reminder-box">
              <h3>Detalhes do seu agendamento:</h3>
              <p><strong>Data:</strong> {{booking_date}}</p>
              <p><strong>Horário:</strong> {{start_time}}</p>
              <p><strong>Serviço:</strong> {{service_name}}</p>
              <p><strong>Profissional:</strong> {{professional_name}}</p>
              <p><strong>Local:</strong> {{company_name}}</p>
            </div>
            
            <p>Nos vemos em breve!</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  // Cancelamento de agendamento
  booking_cancellation: {
    subject: 'Agendamento Cancelado - {{company_name}}',
    template: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Agendamento Cancelado</h1>
          </div>
          <div class="content">
            <p>Olá <strong>{{customer_name}}</strong>,</p>
            <p>Informamos que seu agendamento foi cancelado:</p>
            
            <ul>
              <li><strong>Serviço:</strong> {{service_name}}</li>
              <li><strong>Data:</strong> {{booking_date}} às {{start_time}}</li>
              <li><strong>Motivo:</strong> {{cancellation_reason}}</li>
            </ul>
            
            <p>Para reagendar, entre em contato conosco ou acesse nosso site.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  // Bem-vindo nova empresa
  company_welcome: {
    subject: 'Bem-vindo ao Beautiful SaaS!',
    template: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .steps { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bem-vindo ao Beautiful!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>{{company_name}}</strong>,</p>
            <p>Parabéns! Sua conta foi criada com sucesso no Beautiful SaaS.</p>
            
            <div class="steps">
              <h3>Próximos passos:</h3>
              <ol>
                <li>Complete o perfil da sua empresa</li>
                <li>Cadastre seus profissionais</li>
                <li>Configure seus serviços</li>
                <li>Personalize sua página de agendamento</li>
                <li>Compartilhe seu link: <strong>{{booking_url}}</strong></li>
              </ol>
            </div>
            
            <p>Sua assinatura <strong>{{plan_name}}</strong> está ativa e você tem <strong>7 dias grátis</strong> para testar todas as funcionalidades.</p>
            
            <p>Precisa de ajuda? Nossa equipe está pronta para te ajudar!</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};

// Função para substituir variáveis no template
function replaceTemplateVariables(template, variables) {
  let result = template;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, variables[key] || '');
  });
  return result;
}

// Função para enviar email
async function sendEmail(to, templateKey, variables, attachments = []) {
  try {
    const template = EMAIL_TEMPLATES[templateKey];
    if (!template) {
      throw new Error(`Template ${templateKey} não encontrado`);
    }

    const subject = replaceTemplateVariables(template.subject, variables);
    const html = replaceTemplateVariables(template.template, variables);

    const mailOptions = {
      from: `"Beautiful by Olivyx" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', result.messageId);
    return result;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
}

module.exports = {
  transporter,
  EMAIL_TEMPLATES,
  sendEmail,
  replaceTemplateVariables
};