import crypto from "crypto";

export class OTPService {
  /**
   * Generate a 6-digit OTP code
   */
  static generateOTP(): string {
    // Generate a random 6-digit number
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
  }

  /**
   * Send OTP to user's phone
   * TODO: Integrate with actual SMS service (e.g., Twilio, AWS SNS, etc.)
   * For now, this is a placeholder that logs the OTP
   */
  static async sendOTP(phone: string, code: string): Promise<void> {
    // TODO: Replace this with actual SMS integration
    // Example: await smsService.send(phone, `Your password reset code is: ${code}`);

    // For development/testing purposes, log the OTP
    console.log(`[OTP Service] Sending OTP to ${phone}: ${code}`);

    // In production, you would integrate with an SMS service here:
    // - Twilio
    // - AWS SNS
    // - MessageBird
    // - etc.
  }

  /**
   * Get OTP expiration time (default: 10 minutes)
   */
  static getOTPExpiration(): Date {
    const expirationMinutes = 10;
    return new Date(Date.now() + expirationMinutes * 60 * 1000);
  }
}
