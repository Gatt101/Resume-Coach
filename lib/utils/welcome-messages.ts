/**
 * Welcome message utilities for new user onboarding
 */

export interface WelcomeMessage {
  title: string;
  message: string;
  credits: number;
  actionText?: string;
}

/**
 * Generate welcome message for new users with credit information
 */
export function generateWelcomeMessage(credits: number = 200): WelcomeMessage {
  return {
    title: "Welcome to our platform!",
    message: `Congratulations! You've been awarded ${credits} free credits to get started. Use these credits to explore our AI-powered features including resume analysis, job matching, and more.`,
    credits,
    actionText: "Start exploring"
  };
}

/**
 * Generate low balance warning message
 */
export function generateLowBalanceMessage(currentCredits: number): WelcomeMessage {
  return {
    title: "Running low on credits",
    message: `You have ${currentCredits} credits remaining. Consider upgrading to a subscription plan to continue using our AI features without interruption.`,
    credits: currentCredits,
    actionText: "View plans"
  };
}

/**
 * Generate credit allocation success message
 */
export function generateCreditAllocationMessage(creditsAdded: number, newBalance: number): WelcomeMessage {
  return {
    title: "Credits added successfully!",
    message: `${creditsAdded} credits have been added to your account. Your new balance is ${newBalance} credits.`,
    credits: newBalance,
    actionText: "Continue"
  };
}

/**
 * Generate error message for credit allocation failures
 */
export function generateCreditErrorMessage(): WelcomeMessage {
  return {
    title: "Credit allocation issue",
    message: "There was an issue allocating your initial credits. Don't worry - your account has been created successfully and our team will resolve this shortly. You can still use the platform with your default credit balance.",
    credits: 200, // Default credits from user model
    actionText: "Continue to dashboard"
  };
}