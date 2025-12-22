//  محتوى utils/email.js 
const nodemailer = require('nodemailer');

class Email {
  constructor(user, url) {
    this.to = user.email;
    this.name = user.name;
    this.url = url;
    this.from = '"فريق فياتيكا" <no-reply@viatica.com>';
  }

  async sendPasswordReset() {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: 'إعادة تعيين كلمة المرور',
      text: `مرحباً ${this.name}، الرجاء الضغط على الرابط لإعادة تعيين كلمة المرور: ${this.url}`,
      html: `<p>مرحباً ${this.name}،<br><a href="${this.url}">اضغط هنا لإعادة تعيين كلمة المرور</a></p>`
    };

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    return transporter.sendMail(mailOptions);
  }
}

module.exports = Email;