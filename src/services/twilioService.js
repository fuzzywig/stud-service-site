// src/services/twilioService.js
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

// Environment variables for Vite
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

class TwilioService {
    constructor() {
        this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}`;
        this.authString = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    }

    async sendSMS(to, message) {
        try {
            console.log(`Sending SMS to ${to}: ${message}`);

            const response = await fetch(`${this.baseUrl}/Messages.json`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${this.authString}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    To: to,
                    From: TWILIO_PHONE_NUMBER,
                    Body: message,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send SMS');
            }

            const data = await response.json();
            console.log('SMS sent successfully:', data.sid);

            return {
                success: true,
                messageSid: data.sid,
                status: data.status,
                to: data.to,
                from: data.from,
                body: data.body,
                dateCreated: data.date_created,
                price: data.price,
                priceUnit: data.price_unit
            };
        } catch (error) {
            console.error('Error sending SMS:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async sendBulkSMS(messages) {
        const results = [];

        for (const message of messages) {
            try {
                const result = await this.sendSMS(message.to, message.body);

                // Try to log message, but don't fail if it doesn't work
                try {
                    await this.logMessage({
                        ...message,
                        ...result,
                        timestamp: new Date(),
                        type: 'sms'
                    });
                } catch (logError) {
                    console.warn('Failed to log message to Firebase:', logError);
                    // Continue anyway - logging failure shouldn't stop SMS
                }

                results.push({
                    ...message,
                    ...result
                });

                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`Failed to send message to ${message.to}:`, error);
                results.push({
                    ...message,
                    success: false,
                    error: error.message
                });
            }
        }

        return results;
    }

    async logMessage(messageData) {
        try {
            const docRef = await addDoc(collection(db, 'smsMessages'), {
                ...messageData,
                timestamp: new Date(),
                createdAt: new Date()
            });

            console.log('Message logged to Firebase with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error logging message:', error);
            throw error;
        }
    }

    async getAccountBalance() {
        try {
            const response = await fetch(`${this.baseUrl}/Balance.json`, {
                headers: {
                    'Authorization': `Basic ${this.authString}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch account balance');
            }

            const data = await response.json();
            return {
                success: true,
                balance: data.balance,
                currency: data.currency
            };
        } catch (error) {
            console.error('Error fetching balance:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    validatePhoneNumber(phoneNumber) {
        // Remove all non-digit characters
        const cleaned = phoneNumber.replace(/\D/g, '');

        // Handle UK numbers that start with 0
        if (cleaned.startsWith('0') && cleaned.length === 11) {
            return `+44${cleaned.substring(1)}`; // Convert UK format: 07XXX -> +447XXX
        }

        // Handle US numbers
        if (cleaned.length === 10) {
            return `+1${cleaned}`;
        } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return `+${cleaned}`;
        }

        // If already has country code
        if (phoneNumber.startsWith('+')) {
            return phoneNumber;
        }

        // Default: assume it's already formatted correctly
        return phoneNumber;
    }

    formatMessage(template, variables) {
        let formatted = template;

        Object.keys(variables).forEach(key => {
            const placeholder = `{${key}}`;
            formatted = formatted.replace(new RegExp(placeholder, 'g'), variables[key]);
        });

        return formatted;
    }
}

export default new TwilioService();