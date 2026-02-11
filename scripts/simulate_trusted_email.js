const { Resend } = require('resend');

// Mock data
const contact = {
    name: 'Juan Perez',
    email: 'test-recipient@example.com' // Replace with your email if you want to receive it
};
// Use a real email to verify it arrives or just log it
const userEmail = 'daniel.fernandez@example.com';

const emailBody = `
    <h2>${contact.name ? `Hello ${contact.name},` : 'Hello,'}</h2>
    <h3 style="color: #6366f1;">You’ve been chosen as a trusted contact</h3>
    <p>${userEmail} has chosen you as a trusted contact on Carry my Words.</p>
    <p>This means that if this person does not confirm their activity within the defined period, you may receive a notification related to the messages they have scheduled.</p>
    <p>No action is required from you at this time. We just wanted to inform you and thank you for being part of ${userEmail}’s circle of trust.</p>
    <br/>
    <p>—<br/>
    <strong>Carry my Words</strong><br/>
    <span style="color: #666; font-style: italic;">So your words arrive when they’re meant to.</span></p>
`;

console.log('--- Email Subject ---');
console.log("You’ve been chosen as a trusted contact");
console.log('\n--- Email Body (HTML) ---');
console.log(emailBody);
console.log('\n--- Verification ---');
console.log(`From: Carry my Words <noreply@voiceforlater.com>`);
console.log(`To: ${contact.email}`);
console.log(`Containing user: ${userEmail}`);
