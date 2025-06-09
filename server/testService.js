import dotenv from 'dotenv';
dotenv.config();

// Import email service
import emailService from '../services/emailService.js';

async function test() {
    console.log('Testing email service...');

    const testUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'gavinoxley@gmail.com',
        accountType: 'Breeder',
        breederType: 'breeder',
        licenceNumber: 'TEST123'
    };

    try {
        const result = await emailService.sendWelcomeEmail(testUser);
        console.log('Result:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

test();