const nodemailer = require("nodemailer");

const sendEmail = async options => {

    //1.create a transporter=> a service that will send the email, node itself won't.
    //we are going to use mailtrap to send emails to their emails-id
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });


    //2.define email options
    const mailOptions = {
        from: 'JaTin <jigyashusaini7@gmail.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
        //html will be specified later
    }


    //3.actually send the email with nodemailer
    await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;