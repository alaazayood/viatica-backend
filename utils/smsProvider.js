/**
 * SmsProvider Bridge Utility
 * This handles the abstraction of sending SMS/OTP.
 * In development, it logs to console. 
 * In production, it will connect to a real SMS API (like Twilio, Vonage, or a local provider).
 */
class SmsProvider {
  /**
   * Sends an OTP or message to a phone number.
   * @param {string} phone - Target phone number
   * @param {string} message - Message content
   * @returns {Promise<boolean>}
   */
  static async send(phone, message) {
    // 1) Logic for Development / Sandbox
    if (process.env.NODE_ENV !== 'production' || phone.endsWith('0000')) {
      console.log('------------------------------------------');
      console.log(`📡 [SMS PROVISIONER]`);
      console.log(`TO: ${phone}`);
      console.log(`MESSAGE: ${message}`);
      console.log('------------------------------------------');
      return true;
    }

    // 2) Logic for Production (Placeholder)
    // Here you would integrate with your SMS provider API
    // const response = await axios.post('your-sms-api-url', { phone, message, key: process.env.SMS_API_KEY });
    // return response.status === 200;
    
    console.warn(`⚠️ SMS sending not fully configured for production. Logged to console instead.`);
    console.log(`[PROD MOCK] To ${phone}: ${message}`);
    return true;
  }
}

module.exports = SmsProvider;
