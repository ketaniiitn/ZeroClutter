import { createMeetingSchema, listMeetingsSchema } from '../src/modules/meetings/meeting.validation';

describe('Meeting Validation', () => {
  const validTranscript = [
    { timestamp: '00:10', speaker: 'Alice', text: 'We should launch next Friday.' },
    { timestamp: '00:20', speaker: 'Bob', text: 'I agree with that plan.' },
  ];

  describe('createMeetingSchema', () => {
    it('accepts valid meeting creation data', () => {
      const { error } = createMeetingSchema.validate({
        title: 'Sprint Planning',
        participants: ['alice@example.com', 'bob@example.com'],
        meetingDate: '2026-05-20T10:00:00Z',
        transcript: validTranscript,
      });
      expect(error).toBeUndefined();
    });

    it('rejects missing title', () => {
      const { error } = createMeetingSchema.validate({
        participants: ['alice@example.com'],
        meetingDate: '2026-05-20T10:00:00Z',
        transcript: validTranscript,
      });
      expect(error).toBeDefined();
      expect(error!.message).toContain('Meeting title is required');
    });

    it('rejects invalid participant email', () => {
      const { error } = createMeetingSchema.validate({
        title: 'Sprint Planning',
        participants: ['not-an-email'],
        meetingDate: '2026-05-20T10:00:00Z',
        transcript: validTranscript,
      });
      expect(error).toBeDefined();
      expect(error!.message).toContain('valid email');
    });

    it('rejects invalid meetingDate', () => {
      const { error } = createMeetingSchema.validate({
        title: 'Sprint Planning',
        participants: ['alice@example.com'],
        meetingDate: 'not-a-date',
        transcript: validTranscript,
      });
      expect(error).toBeDefined();
      expect(error!.message).toContain('ISO 8601');
    });

    it('rejects empty transcript', () => {
      const { error } = createMeetingSchema.validate({
        title: 'Sprint Planning',
        participants: ['alice@example.com'],
        meetingDate: '2026-05-20T10:00:00Z',
        transcript: [],
      });
      expect(error).toBeDefined();
      expect(error!.message).toContain('at least one segment');
    });

    it('rejects transcript segment missing text', () => {
      const { error } = createMeetingSchema.validate({
        title: 'Sprint Planning',
        participants: ['alice@example.com'],
        meetingDate: '2026-05-20T10:00:00Z',
        transcript: [{ timestamp: '00:10', speaker: 'Alice' }],
      });
      expect(error).toBeDefined();
    });

    it('rejects title shorter than 2 chars', () => {
      const { error } = createMeetingSchema.validate({
        title: 'X',
        participants: ['alice@example.com'],
        meetingDate: '2026-05-20T10:00:00Z',
        transcript: validTranscript,
      });
      expect(error).toBeDefined();
    });
  });

  describe('listMeetingsSchema', () => {
    it('applies defaults', () => {
      const { value } = listMeetingsSchema.validate({});
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
    });

    it('accepts valid filters', () => {
      const { error } = listMeetingsSchema.validate({
        page: '2',
        limit: '20',
        from: '2026-01-01T00:00:00Z',
      });
      expect(error).toBeUndefined();
    });

    it('rejects invalid from date', () => {
      const { error } = listMeetingsSchema.validate({ from: 'bad-date' });
      expect(error).toBeDefined();
    });
  });
});
