const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.fromEmail = process.env.EMAIL_FROM || 'noreply@tiaraconnect.com';
        this.fromName = process.env.EMAIL_FROM_NAME || 'TiaraConnect';
        
        this.initializeTransporter();
    }

    initializeTransporter() {
        // For development, use Gmail or other SMTP service
        if (process.env.NODE_ENV === 'production') {
            this.transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            // For development, use Gmail or create a test account
            this.transporter = nodemailer.createTransporter({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD
                }
            });
        }
    }

    async sendEmail(to, subject, html, text = null) {
        try {
            if (!this.transporter) {
                throw new Error('Email transporter not configured');
            }

            const mailOptions = {
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: to,
                subject: subject,
                html: html,
                text: text || this.htmlToText(html)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully to ${to}: ${result.messageId}`);
            
            return {
                success: true,
                messageId: result.messageId,
                to: to
            };
        } catch (error) {
            console.error('❌ Email sending failed:', error.message);
            throw error;
        }
    }

    // Convert HTML to plain text
    htmlToText(html) {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    // Welcome email
    async sendWelcomeEmail(user) {
        const subject = 'Welcome to TiaraConnect!';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                    <h1>Welcome to TiaraConnect!</h1>
                    <p>Your account has been successfully created</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2>Hello ${user.name},</h2>
                    <p>Welcome to TiaraConnect! We're excited to have you on board.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Your Account Details:</h3>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Phone:</strong> ${user.phoneNumber}</p>
                        <p><strong>Account Type:</strong> ${user.role}</p>
                    </div>
                    
                    <p>You can now:</p>
                    <ul>
                        <li>Make payments using MPesa</li>
                        <li>Receive SMS notifications</li>
                        <li>Track your transaction history</li>
                        <li>Manage your account settings</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                           style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                            Go to Dashboard
                        </a>
                    </div>
                    
                    <p>If you have any questions, feel free to contact our support team.</p>
                    
                    <p>Best regards,<br>The TiaraConnect Team</p>
                </div>
            </div>
        `;

        return await this.sendEmail(user.email, subject, html);
    }

    // Payment confirmation email
    async sendPaymentConfirmationEmail(user, transaction) {
        const subject = 'Payment Confirmation - TiaraConnect';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; color: white;">
                    <h1>Payment Successful!</h1>
                    <p>Your payment has been processed successfully</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2>Hello ${user.name},</h2>
                    <p>Your payment has been processed successfully. Here are the details:</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Transaction Details:</h3>
                        <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
                        <p><strong>Amount:</strong> KES ${transaction.amount.toLocaleString()}</p>
                        <p><strong>Reference:</strong> ${transaction.accountReference}</p>
                        <p><strong>Date:</strong> ${new Date(transaction.completedAt).toLocaleString()}</p>
                        <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">${transaction.status}</span></p>
                    </div>
                    
                    <p>Thank you for using TiaraConnect!</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/transactions" 
                           style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                            View Transaction History
                        </a>
                    </div>
                    
                    <p>If you have any questions about this transaction, please contact our support team.</p>
                    
                    <p>Best regards,<br>The TiaraConnect Team</p>
                </div>
            </div>
        `;

        return await this.sendEmail(user.email, subject, html);
    }

    // Payment failed email
    async sendPaymentFailedEmail(user, transaction) {
        const subject = 'Payment Failed - TiaraConnect';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%); padding: 30px; text-align: center; color: white;">
                    <h1>Payment Failed</h1>
                    <p>We couldn't process your payment</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2>Hello ${user.name},</h2>
                    <p>Unfortunately, we couldn't process your payment. Here are the details:</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Transaction Details:</h3>
                        <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
                        <p><strong>Amount:</strong> KES ${transaction.amount.toLocaleString()}</p>
                        <p><strong>Reference:</strong> ${transaction.accountReference}</p>
                        <p><strong>Date:</strong> ${new Date(transaction.createdAt).toLocaleString()}</p>
                        <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">${transaction.status}</span></p>
                        ${transaction.errorMessage ? `<p><strong>Error:</strong> ${transaction.errorMessage}</p>` : ''}
                    </div>
                    
                    <p>Please try again or contact our support team if the problem persists.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments" 
                           style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                            Try Again
                        </a>
                    </div>
                    
                    <p>If you need assistance, please contact our support team.</p>
                    
                    <p>Best regards,<br>The TiaraConnect Team</p>
                </div>
            </div>
        `;

        return await this.sendEmail(user.email, subject, html);
    }

    // Password reset email
    async sendPasswordResetEmail(user, resetToken) {
        const subject = 'Password Reset Request - TiaraConnect';
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                    <h1>Password Reset Request</h1>
                    <p>Reset your TiaraConnect password</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2>Hello ${user.name},</h2>
                    <p>You requested to reset your password. Click the button below to create a new password:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p>This link will expire in 1 hour for security reasons.</p>
                    
                    <p>If you didn't request this password reset, please ignore this email.</p>
                    
                    <p>Best regards,<br>The TiaraConnect Team</p>
                </div>
            </div>
        `;

        return await this.sendEmail(user.email, subject, html);
    }

    // Account verification email
    async sendVerificationEmail(user, verificationToken) {
        const subject = 'Verify Your Email - TiaraConnect';
        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                    <h1>Verify Your Email</h1>
                    <p>Complete your TiaraConnect registration</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2>Hello ${user.name},</h2>
                    <p>Thank you for registering with TiaraConnect! Please verify your email address by clicking the button below:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verifyUrl}" 
                           style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                            Verify Email
                        </a>
                    </div>
                    
                    <p>This link will expire in 24 hours.</p>
                    
                    <p>If you didn't create an account with TiaraConnect, please ignore this email.</p>
                    
                    <p>Best regards,<br>The TiaraConnect Team</p>
                </div>
            </div>
        `;

        return await this.sendEmail(user.email, subject, html);
    }

    // Bulk email sending
    async sendBulkEmail(recipients, subject, html, text = null) {
        const results = [];
        
        for (const recipient of recipients) {
            try {
                const result = await this.sendEmail(recipient.email, subject, html, text);
                results.push({ recipient, success: true, result });
            } catch (error) {
                results.push({ recipient, success: false, error: error.message });
            }
        }

        return {
            total: recipients.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }
}

module.exports = new EmailService(); 