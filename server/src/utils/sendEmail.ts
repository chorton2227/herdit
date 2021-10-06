import nodemailer from "nodemailer";

export async function sendEmail(subject: string, to: string, html: string) {
    // let testAccount = await nodemailer.createTestAccount();
    // console.log('testAccount:', testAccount);

    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: "gmql2yzn5hcm7aq4@ethereal.email",
            pass: "YqdBJKDGEuPRvc64Fu"
        }
    });

    let info = await transporter.sendMail({
        from: "herd.it support <support@herd.it>",
        to: to,
        subject: subject,
        html: html
    })

    console.log("Email sent:", info);
    console.log("Preview Url: %s", nodemailer.getTestMessageUrl(info));
}