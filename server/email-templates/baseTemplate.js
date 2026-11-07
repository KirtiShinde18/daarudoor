exports.baseTemplate = ({ title, content }) => {
    return `
        <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>

<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
        <tr>
            <td align="center">

                <!-- Main Container -->
                <table width="600" cellpadding="0" cellspacing="0"
                    style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);">

                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(90deg,#0d6efd,#0a58ca);padding:20px;text-align:center;">
                            <h1 style="color:#ffffff;margin:0;font-size:22px;">
                                BLOOMATRIX INFOTECH
                            </h1>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding:30px;">
                            ${content}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#f1f5ff;padding:15px;text-align:center;font-size:12px;color:#555;">
                            © ${new Date().getFullYear()} BLOOMATRIX INFOTECH <br />
                            Maharashtra, India <br />
                            <span style="color:#0d6efd;">Empowering 🚀</span>
                        </td>
                    </tr>

                </table>
                <!-- End Container -->

            </td>
        </tr>
    </table>

</body>

</html>
    `
}