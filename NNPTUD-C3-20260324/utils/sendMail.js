const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
    port: Number(process.env.SMTP_PORT || 2525),
    secure: false, // true for 465, false for 587/2525
    auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
    },
});

module.exports = {
    sendMail: async function (to, url) {
        await transporter.sendMail({
            from: process.env.MAIL_FROM || 'admin@haha.com',
            to: to,
            subject: "reset password email",
            text: "click vao day de doi pass", // Plain-text version of the message
            html: "click vao <a href=" + url+ ">day</a> de doi pass", // HTML version of the message
        })
    },
    sendPasswordMail: async function (to, username, password) {
        const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="220" height="48" viewBox="0 0 220 48">
  <rect x="0" y="0" width="220" height="48" rx="10" fill="#111827"/>
  <circle cx="26" cy="24" r="12" fill="#22c55e"/>
  <text x="50" y="30" font-family="Segoe UI, Arial" font-size="16" fill="#ffffff">NNPTUD-C3</text>
</svg>`.trim();

        await transporter.sendMail({
            from: process.env.MAIL_FROM || 'admin@haha.com',
            to: to,
            subject: "Tai khoan moi NNPTUD-C3",
            text:
                "Tai khoan cua ban da duoc tao.\n" +
                "Username: " + username + "\n" +
                "Mat khau tam: " + password + "\n" +
                "Vui long dang nhap va doi mat khau ngay.",
            html:
                "<div style=\"font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:16px\">" +
                "  <div style=\"margin-bottom:16px\">" +
                "    <img src=\"cid:nnptud_logo\" width=\"220\" height=\"48\" alt=\"NNPTUD-C3\" />" +
                "  </div>" +
                "  <h2 style=\"margin:0 0 12px 0;color:#111827\">Tai khoan cua ban da duoc tao</h2>" +
                "  <div style=\"background:#f3f4f6;border-radius:10px;padding:12px 14px\">" +
                "    <p style=\"margin:6px 0\"><b>Username:</b> " + username + "</p>" +
                "    <p style=\"margin:6px 0\"><b>Mat khau tam:</b> " + password + "</p>" +
                "  </div>" +
                "  <p style=\"margin:14px 0 0 0;color:#374151\">Vui long dang nhap va doi mat khau ngay sau lan dau dang nhap.</p>" +
                "</div>",
            attachments: [
                {
                    filename: "logo.svg",
                    content: logoSvg,
                    cid: "nnptud_logo",
                    contentType: "image/svg+xml",
                }
            ]
        });
    }
}

// Send an email using async/await
