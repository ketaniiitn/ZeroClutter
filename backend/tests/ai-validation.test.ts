import { buildAnalysisPrompt } from '../src/modules/analysis/analysis.prompt';

describe('AI Analysis Prompt', () => {
  const sampleTranscript = [
    { timestamp: '00:10', speaker: 'John', text: 'We should launch next Friday.' },
    { timestamp: '00:20', speaker: 'Alice', text: 'I will prepare release notes.' },
    { timestamp: '00:30', speaker: 'Bob', text: 'Agreed, Friday works for everyone.' },
  ];

  const meetingDate = new Date('2026-05-20T10:00:00Z');

  it('builds a prompt containing the transcript', () => {
    const prompt = buildAnalysisPrompt(
      'Sprint Planning',
      ['john@example.com', 'alice@example.com'],
      sampleTranscript,
      meetingDate,
    );
    expect(prompt).toContain('[00:10] John: We should launch next Friday.');
    expect(prompt).toContain('[00:20] Alice: I will prepare release notes.');
  });

  it('includes valid timestamps in the prompt', () => {
    const prompt = buildAnalysisPrompt('Test Meeting', [], sampleTranscript, meetingDate);
    expect(prompt).toContain('00:10, 00:20, 00:30');
  });

  it('includes meeting title in the prompt', () => {
    const prompt = buildAnalysisPrompt('Sprint Planning', [], sampleTranscript, meetingDate);
    expect(prompt).toContain('Sprint Planning');
  });

  it('includes anti-hallucination instructions', () => {
    const prompt = buildAnalysisPrompt('Test Meeting', [], sampleTranscript, meetingDate);
    expect(prompt).toContain('NEVER invent');
    expect(prompt).toContain('ONLY use information explicitly stated');
  });

  it('requires citations in output format', () => {
    const prompt = buildAnalysisPrompt('Test Meeting', [], sampleTranscript, meetingDate);
    expect(prompt).toContain('citations');
    expect(prompt).toContain('timestamp');
  });

  it('handles empty participants gracefully', () => {
    const prompt = buildAnalysisPrompt('Test Meeting', [], sampleTranscript, meetingDate);
    expect(prompt).toBeDefined();
    expect(typeof prompt).toBe('string');
  });
});

describe('Response format utilities', () => {
  it('paginatedResponse calculates totalPages correctly', () => {
    const { paginatedResponse } = require('../src/utils/response');
    const result = paginatedResponse(['a', 'b', 'c'], 25, 1, 10);
    expect(result.pagination.totalPages).toBe(3);
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(false);
  });

  it('paginatedResponse page 2 has hasPrev true', () => {
    const { paginatedResponse } = require('../src/utils/response');
    const result = paginatedResponse(['a'], 25, 2, 10);
    expect(result.pagination.hasPrev).toBe(true);
  });

  it('paginatedResponse last page has hasNext false', () => {
    const { paginatedResponse } = require('../src/utils/response');
    const result = paginatedResponse(['a'], 10, 1, 10);
    expect(result.pagination.hasNext).toBe(false);
  });
});

describe('Error classes', () => {
  const {
    AppError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
    ConflictError,
  } = require('../src/utils/errors');

  it('NotFoundError has 404 status and NOT_FOUND code', () => {
    const err = new NotFoundError('Meeting');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toContain('Meeting not found');
    expect(err.isOperational).toBe(true);
  });

  it('UnauthorizedError has 401 status', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('ValidationError has 400 status and VALIDATION_ERROR code', () => {
    const err = new ValidationError('Field is required');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('ConflictError has 409 status', () => {
    const err = new ConflictError('Email already exists');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });

  it('AppError is operational by default', () => {
    const err = new AppError('Custom error', 'CUSTOM_CODE', 422);
    expect(err.isOperational).toBe(true);
    expect(err.statusCode).toBe(422);
  });
});
