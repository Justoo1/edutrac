/**
 * Email utility functions for sending notifications and generating passwords
 */

/**
 * Generates a temporary password for new user accounts
 * @returns A random password string
 */
export function generateTemporaryPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Sends a welcome email to a new user with their temporary password
 * @param email The recipient's email address
 * @param firstName The recipient's first name
 * @param password The temporary password
 */
export async function sendWelcomeEmail(email: string, firstName: string, password: string): Promise<void> {
  // This is a placeholder - you would integrate with an email service like SendGrid, Mailgun, etc.
  console.log(`Sending welcome email to ${email}`);
  console.log(`Subject: Welcome to EduTrac, ${firstName}!`);
  console.log(`Body: Your temporary password is: ${password}. Please change it after your first login.`);
  
  // In a real implementation, you would use an email service API here
  // Example with a hypothetical email service:
  // 
  // return emailService.send({
  //   to: email,
  //   from: 'support@edutrac.com',
  //   subject: `Welcome to EduTrac, ${firstName}!`,
  //   text: `Your temporary password is: ${password}. Please change it after your first login.`,
  //   html: `<p>Your temporary password is: <strong>${password}</strong>. Please change it after your first login.</p>`,
  // });
  
  // For now, we'll just return a resolved promise
  return Promise.resolve();
} 