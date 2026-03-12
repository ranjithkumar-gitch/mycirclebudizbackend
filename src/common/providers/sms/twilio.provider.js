import logger from '../../../config/logger.js';

export class TwilioProvider {
  async sendOtp(phone, otp) {
    // TODO: Implement Twilio SMS sending
    logger.warn('[SMS-TWILIO] Twilio provider not yet implemented, logging OTP instead');
    logger.info(`[SMS-TWILIO] OTP for ${phone}: ${otp}`);
  }
}
