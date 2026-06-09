import { registerSchema, loginSchema } from '../src/modules/auth/auth.validation';

describe('Auth Validation', () => {
  describe('Register Schema', () => {
    it('accepts valid registration data', () => {
      const { error } = registerSchema.validate({
        name: 'Alice Smith',
        email: 'alice@example.com',
        password: 'securepass123',
      });
      expect(error).toBeUndefined();
    });

    it('rejects missing name', () => {
      const { error } = registerSchema.validate({
        email: 'alice@example.com',
        password: 'securepass123',
      });
      expect(error).toBeDefined();
      expect(error!.message).toContain('Name is required');
    });

    it('rejects invalid email', () => {
      const { error } = registerSchema.validate({
        name: 'Alice',
        email: 'not-an-email',
        password: 'securepass123',
      });
      expect(error).toBeDefined();
      expect(error!.message).toContain('Invalid email');
    });

    it('rejects short password', () => {
      const { error } = registerSchema.validate({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'short',
      });
      expect(error).toBeDefined();
      expect(error!.message).toContain('8 characters');
    });

    it('rejects short name', () => {
      const { error } = registerSchema.validate({
        name: 'A',
        email: 'alice@example.com',
        password: 'securepass123',
      });
      expect(error).toBeDefined();
    });
  });

  describe('Login Schema', () => {
    it('accepts valid login data', () => {
      const { error } = loginSchema.validate({
        email: 'alice@example.com',
        password: 'securepass123',
      });
      expect(error).toBeUndefined();
    });

    it('rejects missing password', () => {
      const { error } = loginSchema.validate({ email: 'alice@example.com' });
      expect(error).toBeDefined();
      expect(error!.message).toContain('Password is required');
    });

    it('rejects invalid email format', () => {
      const { error } = loginSchema.validate({
        email: 'notvalid',
        password: 'password123',
      });
      expect(error).toBeDefined();
    });
  });
});
