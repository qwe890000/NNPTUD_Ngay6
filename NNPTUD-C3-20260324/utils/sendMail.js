const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 25,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "",
        pass: "",
    },
});

module.exports = {
    sendMail: async function (to, url) {
        await transporter.sendMail({
            from: 'admin@haha.com',
            to: to,
            subject: "reset password email",
            text: "click vao day de doi pass", // Plain-text version of the message
            html: "click vao <a href=" + url+ ">day</a> de doi pass", // HTML version of the message
        })
    },
    sendPasswordMail: async function (to, username, password) {
        await transporter.sendMail({
            from: 'admin@haha.com',
            to: to,
            subject: "Tai khoan moi NNPTUD-C3",
            text: "Tai khoan: " + username + " | Mat khau tam: " + password,
            html: "<p>Tai khoan cua ban da duoc tao.</p>" +
                "<p><b>Username:</b> " + username + "</p>" +
                "<p><b>Mat khau tam:</b> " + password + "</p>" +
                "<p>Vui long dang nhap va doi mat khau ngay sau lan dau dang nhap.</p>",
        });
    }
}

// Send an email using async/await
