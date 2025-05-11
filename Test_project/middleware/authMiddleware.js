const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-super-secret-key-123456789';

module.exports = function (req, res, next) {
    if (req.method === "OPTIONS") {
        next();
    }
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                message: 'Не авторизован',
                redirect: true 
            });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        if (e.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Срок действия токена истек',
                redirect: true 
            });
        }
        if (e.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Недействительный токен',
                redirect: true 
            });
        }
        return res.status(401).json({ 
            message: 'Не авторизован',
            redirect: true 
        });
    }
}; 