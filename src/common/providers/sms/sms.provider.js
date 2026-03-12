import config from '../../../config/index.js';
import { ConsoleProvider } from './console.provider.js';
import { TwilioProvider } from './twilio.provider.js';

let instance = null;

export function getSmsProvider() {
  if (!instance) {
    switch (config.sms.provider) {
      case 'twilio':
        instance = new TwilioProvider();
        break;
      case 'console':
      default:
        instance = new ConsoleProvider();
        break;
    }
  }
  return instance;
}
