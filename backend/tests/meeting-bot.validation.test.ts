import { createBotSchema, listBotsSchema } from '../src/modules/meeting-bot/meeting-bot.validation';

describe('createBotSchema', () => {
  it('accepts a valid Google Meet URL', () => {
    const { error } = createBotSchema.validate({ meetingUrl: 'https://meet.google.com/abc-defg-hij' });
    expect(error).toBeUndefined();
  });

  it('accepts a valid Meet URL with query params', () => {
    const { error } = createBotSchema.validate({ meetingUrl: 'https://meet.google.com/abc-defg-hij?authuser=0' });
    expect(error).toBeUndefined();
  });

  it('accepts an optional displayName', () => {
    const { error, value } = createBotSchema.validate({
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      displayName: 'My Notetaker',
    });
    expect(error).toBeUndefined();
    expect(value.displayName).toBe('My Notetaker');
  });

  it('rejects a missing meetingUrl', () => {
    const { error } = createBotSchema.validate({});
    expect(error).toBeDefined();
    expect(error!.message).toContain('Meeting URL is required');
  });

  it('rejects a non-Google-Meet URL', () => {
    const { error } = createBotSchema.validate({ meetingUrl: 'https://zoom.us/j/123456789' });
    expect(error).toBeDefined();
    expect(error!.message).toContain('valid Google Meet');
  });

  it('rejects a displayName longer than 100 chars', () => {
    const { error } = createBotSchema.validate({
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      displayName: 'x'.repeat(101),
    });
    expect(error).toBeDefined();
  });
});

describe('listBotsSchema', () => {
  it('applies defaults', () => {
    const { value } = listBotsSchema.validate({});
    expect(value.page).toBe(1);
    expect(value.limit).toBe(10);
  });
});
