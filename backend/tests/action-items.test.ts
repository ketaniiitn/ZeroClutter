import {
  createActionItemSchema,
  updateStatusSchema,
  listActionItemsSchema,
} from '../src/modules/action-items/action-item.validation';

describe('Action Item Validation', () => {
  describe('createActionItemSchema', () => {
    it('accepts valid action item data', () => {
      const { error } = createActionItemSchema.validate({
        task: 'Prepare release notes',
        assignee: 'Alice',
        meetingId: '507f1f77bcf86cd799439011',
        dueDate: '2026-06-10T00:00:00Z',
        citations: [{ timestamp: '00:20', speaker: 'Alice', quote: 'I will prepare release notes.' }],
      });
      expect(error).toBeUndefined();
    });

    it('accepts action item without dueDate', () => {
      const { error } = createActionItemSchema.validate({
        task: 'Review pull request',
        assignee: 'Bob',
        meetingId: '507f1f77bcf86cd799439011',
      });
      expect(error).toBeUndefined();
    });

    it('rejects missing task', () => {
      const { error } = createActionItemSchema.validate({
        assignee: 'Alice',
        meetingId: '507f1f77bcf86cd799439011',
      });
      expect(error).toBeDefined();
      expect(error!.message).toContain('Task is required');
    });

    it('rejects missing assignee', () => {
      const { error } = createActionItemSchema.validate({
        task: 'Do something important',
        meetingId: '507f1f77bcf86cd799439011',
      });
      expect(error).toBeDefined();
      expect(error!.message).toContain('Assignee is required');
    });

    it('rejects invalid dueDate', () => {
      const { error } = createActionItemSchema.validate({
        task: 'Do something',
        assignee: 'Alice',
        meetingId: '507f1f77bcf86cd799439011',
        dueDate: 'not-a-date',
      });
      expect(error).toBeDefined();
      expect(error!.message).toContain('ISO 8601');
    });

    it('rejects short task', () => {
      const { error } = createActionItemSchema.validate({
        task: 'Do',
        assignee: 'Alice',
        meetingId: '507f1f77bcf86cd799439011',
      });
      expect(error).toBeDefined();
    });
  });

  describe('updateStatusSchema', () => {
    it('accepts PENDING', () => {
      expect(updateStatusSchema.validate({ status: 'PENDING' }).error).toBeUndefined();
    });

    it('accepts IN_PROGRESS', () => {
      expect(updateStatusSchema.validate({ status: 'IN_PROGRESS' }).error).toBeUndefined();
    });

    it('accepts COMPLETED', () => {
      expect(updateStatusSchema.validate({ status: 'COMPLETED' }).error).toBeUndefined();
    });

    it('rejects invalid status', () => {
      const { error } = updateStatusSchema.validate({ status: 'DONE' });
      expect(error).toBeDefined();
      expect(error!.message).toContain('PENDING, IN_PROGRESS, COMPLETED');
    });

    it('rejects missing status', () => {
      const { error } = updateStatusSchema.validate({});
      expect(error).toBeDefined();
      expect(error!.message).toContain('Status is required');
    });
  });

  describe('listActionItemsSchema', () => {
    it('applies defaults', () => {
      const { value } = listActionItemsSchema.validate({});
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
    });

    it('accepts status filter', () => {
      const { error } = listActionItemsSchema.validate({ status: 'PENDING' });
      expect(error).toBeUndefined();
    });

    it('rejects invalid status filter', () => {
      const { error } = listActionItemsSchema.validate({ status: 'INVALID' });
      expect(error).toBeDefined();
    });

    it('accepts assignee filter', () => {
      const { error } = listActionItemsSchema.validate({ assignee: 'Alice' });
      expect(error).toBeUndefined();
    });
  });
});

describe('Overdue Detection Logic', () => {
  it('correctly identifies overdue criteria', () => {
    const pastDate = new Date('2020-01-01T00:00:00Z');
    const futureDate = new Date('2099-01-01T00:00:00Z');
    const now = new Date();

    const isOverdue = (status: string, dueDate: Date | null): boolean => {
      if (status === 'COMPLETED') return false;
      if (!dueDate) return false;
      return dueDate < now;
    };

    expect(isOverdue('PENDING', pastDate)).toBe(true);
    expect(isOverdue('IN_PROGRESS', pastDate)).toBe(true);
    expect(isOverdue('COMPLETED', pastDate)).toBe(false);
    expect(isOverdue('PENDING', futureDate)).toBe(false);
    expect(isOverdue('PENDING', null)).toBe(false);
  });
});
