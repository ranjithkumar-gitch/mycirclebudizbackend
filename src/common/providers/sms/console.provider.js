import logger from '../../../config/logger.js';

export class ConsoleProvider {
  async sendOtp(phone, otp) {
    logger.info(`[SMS-CONSOLE] OTP for ${phone}: ${otp}`);
  }
}
