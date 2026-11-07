const { baseTemplate } = require("./baseTemplate");

exports.deliveryBoyTemplate = ({ email, password }) => {
    const content = `
        <h2 style="color:#333;font-size:20px;">Welcome to DaaruDoor</h2>
        <p style="color:#555;font-size:16px;">Your delivery partner account has been created successfully.</p>
        <div style="background:#f9f9f9;padding:15px;border-radius:5px;margin:20px 0;border:1px solid #e0e0e0;">
            <p style="margin:5px 0;"><strong>Login Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p style="margin:5px 0;"><strong>Password:</strong> <span style="font-size:18px;font-weight:bold;color:#d9534f;">${password}</span></p>
        </div>
        <p style="color:#555;">Please login using the app or website and change your password immediately.</p>
        <p style="color:#555;">If you need to reset your password, please use the <strong>Forgot Password</strong> link on the login page.</p>
    `;
    return baseTemplate({
        title: "DaaruDoor Delivery Account Created",
        content
    });
};
