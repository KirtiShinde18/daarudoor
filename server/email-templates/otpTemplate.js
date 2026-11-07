const { baseTemplate } = require("./baseTemplate")

exports.otpTemplate = ({ name, otp, min, sec }) => {
    const content = `
        <h2>OTP</h2>
        <p>Hi, ${name}</p>
        <p>Please Use Following OTP</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in ${min} min (${sec} Seconds)</p>
        <p>If you did not Request this , please igonre this email</p>
    `
    return baseTemplate({
        title: "",
        content
    })
}