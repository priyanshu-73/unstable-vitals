import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
  ) {
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
        'Unstable Vitals <noreply@healthjini.com>',
    });
  }
  /**
   *
   * @param to email address of the receiver
   */
  async sendEmail(to: string): Promise<void> {
    const mailOptions = {
      from:
        this.configService.get<string>('EMAIL_FROM') ||
        'Unstable Vitals <noreply@healthjini.com>',
      to,
      subject: "Account Verification Code",
      html: `      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Verification Code</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            padding: 20px;
          }
          .container {
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            margin: auto;
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
          <p>Dear User,</p>
          <p>Your verification code is:</p>
          <p>Please enter this code to complete your verification process.</p>
          <p>For your security, do not share this code with anyone. It will expire in the next <strong>10 minutes</strong>.</p>
          <p>If you did not request this code, please ignore this email.</p>
          <p>Best regards,<br><strong>NuvoGPT Team</strong></p>
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
