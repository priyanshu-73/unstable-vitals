import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Validate email configuration
    const emailUser = this.configService.get<string>('EMAIL_USER');
    const emailPass = this.configService.get<string>('EMAIL_PASSWORD');
    if (!emailUser || !emailPass) {
      throw new Error(
        'Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST') || 'smtp.gmail.com',
      port: this.configService.get<number>('EMAIL_PORT') || 587,
      secure: this.configService.get<boolean>('EMAIL_SECURE') || false,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      from:
        this.configService.get<string>('EMAIL_FROM') ||
        'UNstable Vitals <noreply@healthjini.com>',
    });
  }
  /**
   *
   * @param to email address of the receiver
   */
  async sendEmail(
    to: string,
    sessionName: string,
    userName: string,
  ): Promise<void> {
    const mailOptions = {
      from:
        this.configService.get<string>('EMAIL_FROM') ||
        'Exercise Monitor <noreply@medtech-hackathon.com>',
      to, // guardian's email address
      subject: `🚨 Emergency Alert: Possible Incident Detected`,
      html: `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Emergency Alert</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f9f9f9;
        padding: 20px;
      }
      .container {
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(255,0,0,0.15);
        max-width: 480px;
        margin: auto;
      }
      .alert {
        color: #c0392b;
        font-weight: bold;
        font-size: 20px;
      }
      .footer {
        margin-top: 20px;
        font-size: 12px;
        color: #7f8c8d;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <p class="alert">🚨 Attention Required: Possible Emergency!</p>
      <p>Dear Guardian,</p>
      <p>
        We detected a critical situation during <strong>${userName}'s</strong> exercise session.<br>
        <strong>Session Name:</strong> ${sessionName}
      </p>
      <p>
        Please check in immediately to ensure their safety.<br>
        This automated alert was triggered due to abnormal inactivity or fall detection.
      </p>
      <p>Best regards,<br><strong>UNstable Vitals Team</strong></p>
      <div class="footer">
        <p>This is an automated message. Please do not reply.</p>
      </div>
    </div>
  </body>
  </html>
  `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to send email',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
