export const SELECTORS = {
  // Sign-in interstitial — click these to reach the guest name form
  guestContinue: [
    'button:has-text("Continue without an account")',
    'span:has-text("Continue without an account")',
    'a:has-text("Continue without an account")',
    'button:has-text("Continue as guest")',
    'span:has-text("Continue as guest")',
    'button:has-text("Join as guest")',
    'span:has-text("Join as guest")',
  ],
  dismissals: [
    'button:has-text("Got it")',
    'button:has-text("Accept all")',
    'button:has-text("I agree")',
    'button:has-text("Dismiss")',
  ],
  mediaContinueWithout: [
    'button:has-text("Continue without microphone and camera")',
    'span:has-text("Continue without microphone and camera")',
    'a:has-text("Continue without microphone and camera")',
    'text=Continue without microphone and camera',
    'button:has-text("Continue without")',
  ],
  // Meet lobby name field — Google rotates attributes often
  nameInput: [
    'input[type="text"][aria-label="Your name"]',
    'input[placeholder="Your name"]',
    'input[aria-label="Your name"]',
    'input[aria-label*="Your name" i]',
    'input[aria-label*="name" i]',
    'input[placeholder*="name" i]',
    'input[jsname]',
    'div[role="main"] input[type="text"]',
    'form input[type="text"]',
  ],
  turnOffMic: [
    '[aria-label*="Turn off microphone"]',
    '[data-tooltip*="Turn off microphone"]',
    'button[aria-label*="microphone" i][data-is-muted="false"]',
  ],
  turnOffCam: [
    '[aria-label*="Turn off camera"]',
    '[data-tooltip*="Turn off camera"]',
    'button[aria-label*="camera" i][data-is-muted="false"]',
  ],
  joinButtons: [
    'button:has-text("Ask to join")',
    'button:has-text("Join now")',
    'span:has-text("Ask to join")',
    'span:has-text("Join now")',
    '//button[.//span[contains(text(),"Ask to join")]]',
    '//button[.//span[contains(text(),"Join now")]]',
  ],
  inCall: 'button[aria-label="Leave call"], [aria-label="Leave call"], button[aria-label*="Leave call"]',
  // Hard-fail screens
  cantJoin: [
    'text=/can.?t join/i',
    'text=/You can.?t join/i',
    'text=/Unable to join/i',
    'text=/Meeting not found/i',
    'text=/Check your meeting code/i',
    'text=/Invalid video call name/i',
    'text=/Returning to home screen/i',
  ],
  signInWall: [
    'text=/Sign in to continue|Sign in to join|Sign in with Google/i',
    'input[type="email"]',
    '#identifierId',
  ],
};

export const MEET_SCREEN_TEXT = {
  invalidOrEndedMeeting: [
    'Meeting not found',
    'Check your meeting code',
    'Invalid video call name',
    'Returning to home screen',
  ],
  policyBlocked: [
    "Can't join",
    'Cannot join',
    'Unable to join',
    'Ask your administrator',
  ],
  signInRequired: [
    'Sign in to continue',
    'Sign in to join',
    'Sign in with Google',
  ],
  admissionDenied: ['request to join was denied'],
} as const;
