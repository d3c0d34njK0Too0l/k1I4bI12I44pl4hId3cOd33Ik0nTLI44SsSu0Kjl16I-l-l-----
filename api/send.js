const nodemailer = require('nodemailer');

async function trySend(config, to, subject, body, senderEmail, senderPassword) {
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        requireTLS: config.requireTLS,
        auth: {
            user: senderEmail,
            pass: senderPassword
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 15000
    });

    return await transporter.sendMail({
        from: senderEmail,
        to: to,
        subject: subject,
        text: body
    });
}

function mask(str) {
    if (!str || str.length < 4) return '****';
    return str.substring(0, 3) + '***' + str.substring(str.length - 2);
}

module.exports = async (req, res) => {
    const startTime = Date.now();

    if (req.method !== 'POST') {
        return res.status(405).json({
            status: 'error',
            message: 'Method not allowed',
            owner: 'Rullzzz06',
            response_time_ms: Date.now() - startTime
        });
    }

    const { to, subject, body, senderEmail, senderPassword, apiKey } = req.body || {};

    if (apiKey !== 'mks_3QyT90HoqpU8op8QyTu76lay68krT7nm-kdy') {
        return res.status(403).json({
            status: 'error',
            message: 'Forbidden: invalid API key',
            owner: 'Rullzzz06',
            response_time_ms: Date.now() - startTime
        });
    }

    if (!to || !subject || !body) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing parameters: to, subject, body',
            owner: 'Rullzzz06',
            response_time_ms: Date.now() - startTime
        });
    }

    const configs = [
        { host: 'smtp.gmail.com', port: 587, secure: false, requireTLS: true, label: 'STARTTLS' },
        { host: 'smtp.gmail.com', port: 465, secure: true, requireTLS: false, label: 'SSL' }
    ];

    let lastError = '';
    let usedConfig = null;

    for (const config of configs) {
        try {
            await trySend(config, to, subject, body, senderEmail, senderPassword);
            usedConfig = config;
            break;
        } catch (e) {
            lastError = e.message;
        }
    }

    const responseTime = Date.now() - startTime;

    if (usedConfig) {
        return res.status(200).json({
            status: 'ok',
            message: 'Email sent successfully',
            owner: 'Rullzzz06',
            sender: {
                email: senderEmail,
                app_password: mask(senderPassword)
            },
            recipient: {
                to: to,
                subject: subject,
                body_preview: body.substring(0, 60) + (body.length > 60 ? '...' : '')
            },
            smtp: {
                host: usedConfig.host,
                port: usedConfig.port,
                mode: usedConfig.label
            },
            response_time_ms: responseTime,
            timestamp: new Date().toISOString()
        });
    }

    return res.status(500).json({
        status: 'error',
        message: lastError,
        owner: 'Rullzzz06',
        sender: {
            email: senderEmail,
            app_password: mask(senderPassword)
        },
        recipient: {
            to: to,
            subject: subject
        },
        response_time_ms: responseTime,
        timestamp: new Date().toISOString()
    });
};
