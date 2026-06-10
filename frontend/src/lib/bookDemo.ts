/**
 * Reusable "Book Demo" action.
 * Swap the body of this function when a real Calendly/HubSpot link is available.
 */
export const openBookDemo = (): void => {
  const subject = encodeURIComponent('ZeroClutter — Demo Request');
  const body = encodeURIComponent(
    "Hi,\n\nI'd like to schedule a demo of ZeroClutter for my team.\n\nTeam size: \nUse case: \n\nThanks!",
  );
  window.open(`mailto:hello@zeroclutter.com?subject=${subject}&body=${body}`, '_blank');
};
