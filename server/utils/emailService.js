const nodemailer = require('nodemailer');
const con = require('../db/config'); // Need database access to fetch user emails
require('dotenv').config();
// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or use host/port if not gmail
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

const sendEmail = async (to, subject, htmlContent) => {
    try {
        if (!to || !to.length) {
            console.log('No recipients for email:', subject);
            return;
        }

        const mailOptions = {
            from: process.env.MAIL_USER,
            to: Array.isArray(to) ? to.join(',') : to,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const getNotificationTemplate = (title, bodyContent) => {
    return `
    <table border="0" cellpadding="0" cellspacing="0" width="600" style="border:1px solid #e4e4e4; margin: 0 auto; background-color: #ffffff;">
        <tbody>
            <tr>
                <td valign="top" style="background-color: #ffffff;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%">
                        <tbody>
                            <tr>
                                <td valign="top">
                                    <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%">
                                        <tbody>
                                            <tr>
                                                <td valign="top" style="text-align:center;padding-top:20px;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:18px;font-style:normal;font-weight:bold;">
                                                    <center>
                                                        <table width="100%">
                                                            <tbody>
                                                                <tr>
                                                                    <td style="border-bottom:2px solid #0C4379; padding-bottom: 10px;">
                                                                        <h1 style="text-align:center;margin:0; color: #0C4379;">
                                                                            <span style="font-size:24px;display:inline-block">
                                                                                <span style="font-family:arial,helvetica neue,helvetica,sans-serif;">
                                                                                    ${title}
                                                                                </span>
                                                                            </span>
                                                                        </h1>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </center>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
            <tr>
                <td valign="top">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%">
                        <tbody>
                            <tr>
                                <td valign="top">
                                    <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%">
                                        <tbody>
                                            <tr>
                                                <td valign="top" style="padding: 40px 50px;">
                                                    <span style="color:#202020;font-family:helvetica;font-size:15px;line-height:24px">Hi,</span>
                                                    <br>
                                                    <br>
                                                    <span style="color:#202020;font-family:helvetica;font-size:15px;line-height:24px">
                                                        ${bodyContent}
                                                    </span>
                                                    <br>
                                                    <br>
                                                    <span style="color:#202020;font-family:helvetica;font-size:15px;line-height:24px">Thank you.</span>
                                                    <br>
                                                    <br>
                                                    <span style="color:#202020;font-family:helvetica;font-size:15px;line-height:24px">Regards,</span>
                                                    <br>
                                                    <span style="color:#0C4379;font-family:helvetica;font-size:15px;line-height:24px;font-weight:bold;">SPPL Billing</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>`;
};

// Helper: Get Manager Emails
const getManagerEmails = async () => {
    try {
        const [rows] = await con.query('SELECT email FROM users WHERE role = ?', ['MG']);
        return rows.map(user => user.email).filter(email => email);
    } catch (error) {
        console.error('Error fetching manager emails:', error);
        return [];
    }
};

// Helper: Get User Email by ID
const getUserEmail = async (userId) => {
    try {
        const [rows] = await con.query('SELECT email FROM users WHERE user_id = ?', [userId]);
        if (rows.length > 0) return rows[0].email;
        return null;
    } catch (error) {
        console.error('Error fetching user email:', error);
        return null;
    }
};

module.exports = {
    sendEmail,
    getNotificationTemplate,
    getManagerEmails,
    getUserEmail
};
