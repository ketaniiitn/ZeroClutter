export const SELECTORS = {
  nameInput: 'input[placeholder="Your name"], input[aria-label="Your name"]',
  turnOffMic: '[aria-label*="Turn off microphone"], [data-tooltip*="Turn off microphone"]',
  turnOffCam: '[aria-label*="Turn off camera"], [data-tooltip*="Turn off camera"]',
  joinButtons: [
    'button:has-text("Ask to join")',
    'button:has-text("Join now")',
    'span:has-text("Ask to join")',
    'span:has-text("Join now")',
  ],
  inCall: 'button[aria-label="Leave call"], [aria-label="Leave call"], button[aria-label*="Leave call"]',
  meetingEnded:
    'text=/You(\'|)ve left the meeting|Return to home screen|You were removed|Your meeting code|Ask to join/i',
};
