import express from 'express';
import emailService from '../../services/emailService.js';

const router = express.Router();

// Welcome email endpoint
router.post('/api/send-welcome-email', async (req, res) => {
    try {
        const { userData } = req.body;

        const result = await emailService.sendWelcomeEmail(userData);

        if (result.success) {
            res.json({ success: true, message: 'Welcome email sent' });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Email endpoint error:', error);
        res.status(500).json({ success: false, error: 'Failed to send email' });
    }
});

export default router;