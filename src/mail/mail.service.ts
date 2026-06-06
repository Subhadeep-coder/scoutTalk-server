import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as ejs from 'ejs';
import { resolve, join } from 'path';

import { existsSync } from 'fs';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = this.configService.get<number>('MAIL_PORT');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: false,
        auth: { user, pass },
      });
      this.logger.log('Mail transporter initialized');
    } else {
      this.logger.warn(
        'Mail not configured — set MAIL_HOST, MAIL_USER, MAIL_PASS in .env',
      );
    }
  }

  private getTemplateDir(): string {
    const distPath = resolve(__dirname, 'templates');
    if (existsSync(distPath)) {
      return distPath;
    }
    return resolve(process.cwd(), 'src/mail/templates');
  }

  private async renderTemplate(
    template: string,
    variables: Record<string, unknown>,
  ): Promise<string> {
    return ejs.renderFile(
      join(this.getTemplateDir(), `${template}.ejs`),
      variables,
      { rmWhitespace: true },
    );
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'app.frontendUrl',
      'http://localhost:3000',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const html = await this.renderTemplate('password-reset', {
      resetUrl,
      year: new Date().getFullYear(),
    });

    if (!this.transporter) {
      this.logger.log(`[DEV] Password reset email to ${to}: ${resetUrl}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get<string>(
        'MAIL_FROM',
        'noreply@scouttalk.com',
      ),
      to,
      subject: 'Reset your ScoutTalk password',
      html,
    });
  }

  async sendEmailVerificationEmail(
    to: string,
    verificationToken: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'app.frontendUrl',
      'http://localhost:3000',
    );
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
    const html = await this.renderTemplate('email-verification', {
      verificationUrl,
      year: new Date().getFullYear(),
    });

    if (!this.transporter) {
      this.logger.log(`[DEV] Verification email to ${to}: ${verificationUrl}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get<string>(
        'MAIL_FROM',
        'noreply@scouttalk.com',
      ),
      to,
      subject: 'Verify your ScoutTalk email',
      html,
    });
  }
}
