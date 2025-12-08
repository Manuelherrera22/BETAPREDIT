/**
 * Email Service
 * Handles sending emails via SendGrid, Resend, or Nodemailer
 */
import { logger } from '../utils/logger';

interface EmailConfig {
  provider: 'sendgrid' | 'resend' | 'nodemailer';
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

class EmailService {
  private config: EmailConfig | null = null;
  private initialized = false;

  /**
   * Initialize email service
   */
  initialize(config: EmailConfig) {
    this.config = config;
    this.initialized = true;
    logger.info(`Email service initialized with provider: ${config.provider}`);
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.initialized || !this.config) {
      logger.warn('Email service not initialized, email not sent');
      return false;
    }

    try {
      switch (this.config.provider) {
        case 'sendgrid':
          return await this.sendViaSendGrid(options);
        case 'resend':
          return await this.sendViaResend(options);
        case 'nodemailer':
          return await this.sendViaNodemailer(options);
        default:
          logger.error(`Unknown email provider: ${this.config.provider}`);
          return false;
      }
    } catch (error: any) {
      logger.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send via SendGrid
   */
  private async sendViaSendGrid(options: EmailOptions): Promise<boolean> {
    try {
      const sendgrid = require('@sendgrid/mail');
      sendgrid.setApiKey(this.config!.apiKey);

      const msg = {
        to: Array.isArray(options.to) ? options.to : [options.to],
        from: {
          email: this.config!.fromEmail || 'noreply@betapredit.com',
          name: this.config!.fromName || 'BETAPREDIT',
        },
        subject: options.subject,
        text: options.text || this.htmlToText(options.html),
        html: options.html,
        ...(options.cc && { cc: Array.isArray(options.cc) ? options.cc : [options.cc] }),
        ...(options.bcc && { bcc: Array.isArray(options.bcc) ? options.bcc : [options.bcc] }),
      };

      await sendgrid.send(msg);
      logger.info(`Email sent via SendGrid to ${options.to}`);
      return true;
    } catch (error: any) {
      logger.error('SendGrid error:', error);
      return false;
    }
  }

  /**
   * Send via Resend
   */
  private async sendViaResend(options: EmailOptions): Promise<boolean> {
    try {
      const { Resend } = require('resend');
      const resend = new Resend(this.config!.apiKey);

      const { error } = await resend.emails.send({
        from: `${this.config!.fromName || 'BETAPREDIT'} <${this.config!.fromEmail || 'noreply@betapredit.com'}>`,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
        ...(options.cc && { cc: Array.isArray(options.cc) ? options.cc : [options.cc] }),
        ...(options.bcc && { bcc: Array.isArray(options.bcc) ? options.bcc : [options.bcc] }),
      });

      if (error) {
        logger.error('Resend error:', error);
        return false;
      }

      logger.info(`Email sent via Resend to ${options.to}`);
      return true;
    } catch (error: any) {
      logger.error('Resend error:', error);
      return false;
    }
  }

  /**
   * Send via Nodemailer (SMTP)
   */
  private async sendViaNodemailer(options: EmailOptions): Promise<boolean> {
    try {
      const nodemailer = require('nodemailer');

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      const mailOptions = {
        from: `${this.config!.fromName || 'BETAPREDIT'} <${this.config!.fromEmail || process.env.SMTP_USER}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text || this.htmlToText(options.html),
        html: options.html,
        ...(options.cc && { cc: Array.isArray(options.cc) ? options.cc.join(', ') : options.cc }),
        ...(options.bcc && { bcc: Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc }),
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Email sent via Nodemailer to ${options.to}`);
      return true;
    } catch (error: any) {
      logger.error('Nodemailer error:', error);
      return false;
    }
  }

  /**
   * Convert HTML to plain text (simple version)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Send value bet alert email
   */
  async sendValueBetAlert(email: string, alert: any): Promise<boolean> {
    const html = this.getValueBetAlertTemplate(alert);
    return await this.sendEmail({
      to: email,
      subject: `🎯 Value Bet Detectado: ${alert.selection} @ ${alert.bookmakerOdds}`,
      html,
    });
  }

  /**
   * Send daily digest email
   */
  async sendDailyDigest(email: string, stats: any): Promise<boolean> {
    const html = this.getDailyDigestTemplate(stats);
    return await this.sendEmail({
      to: email,
      subject: '📊 Resumen Diario - BETAPREDIT',
      html,
    });
  }

  /**
   * Get value bet alert email template
   */
  private getValueBetAlertTemplate(alert: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
          .value-badge { background: #28a745; color: white; padding: 5px 10px; border-radius: 4px; font-weight: bold; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Value Bet Detectado</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <h2>${alert.event?.homeTeam || 'Equipo 1'} vs ${alert.event?.awayTeam || 'Equipo 2'}</h2>
              <p><strong>Selección:</strong> ${alert.selection}</p>
              <p><strong>Cuota:</strong> ${alert.bookmakerOdds} (${alert.bookmakerPlatform})</p>
              <p><strong>Valor:</strong> <span class="value-badge">+${alert.valuePercentage.toFixed(1)}%</span></p>
              <p><strong>Probabilidad Predicha:</strong> ${(alert.predictedProbability * 100).toFixed(1)}%</p>
              <p><strong>Confianza:</strong> ${(alert.confidence * 100).toFixed(1)}%</p>
            </div>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/alerts" class="button">Ver Detalles</a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
              Este es un email automático de BETAPREDIT. No respondas a este mensaje.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get daily digest email template
   */
  private getDailyDigestTemplate(stats: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .stat-box { background: white; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Resumen Diario</h1>
            <p>${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div class="content">
            <div class="stat-box">
              <h3>Value Bets Detectados</h3>
              <p><strong>${stats.valueBetsFound || 0}</strong> value bets encontrados hoy</p>
            </div>
            <div class="stat-box">
              <h3>Rendimiento</h3>
              <p>Win Rate: <strong>${(stats.winRate || 0).toFixed(1)}%</strong></p>
              <p>ROI: <strong>${(stats.roi || 0) >= 0 ? '+' : ''}${(stats.roi || 0).toFixed(1)}%</strong></p>
            </div>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/statistics" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px;">
              Ver Estadísticas Completas
            </a>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton
export const emailService = new EmailService();

// Initialize if environment variables are available
if (process.env.EMAIL_PROVIDER) {
  emailService.initialize({
    provider: process.env.EMAIL_PROVIDER as 'sendgrid' | 'resend' | 'nodemailer',
    apiKey: process.env.EMAIL_API_KEY,
    fromEmail: process.env.EMAIL_FROM || 'noreply@betapredit.com',
    fromName: process.env.EMAIL_FROM_NAME || 'BETAPREDIT',
  });
}

