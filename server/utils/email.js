const nodemailer = require("nodemailer")
exports.sendEmail = async ({ email, subject, message }) => {
    try {
        console.log("sendEmail utility called with email:", email, "subject:", subject);
        const transport = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL, pass: (process.env.EMAIL_PASS || "").trim() }
        });

        console.log("Sending mail via transport...");
        const info = await transport.sendMail({
            to: email,
            subject,
            html: message
        });
        console.log("email send success:", info.messageId);
        return "email send success";
    } catch (error) {
        console.error("email send error detailed:", error);
        throw new Error("unable to send email");
    }
};