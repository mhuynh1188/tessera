import { AuthService } from '../auth'
import { supabase, supabaseAdmin } from '../supabase'

// Mock the supabase module
jest.mock('../supabase')

const mockedSupabase = supabase as jest.Mocked<typeof supabase>
const mockedSupabaseAdmin = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    authService = new AuthService()
    jest.clearAllMocks()
  })

  describe('signUp', () => {
    it('should create a new user successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        email_confirmed_at: null,
      }

      mockedSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      })

      mockedSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      } as any)

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      })

      expect(mockedSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: { name: 'Test User' },
          emailRedirectTo: undefined,
        },
      })

      expect(result.user).toEqual(mockUser)
    })

    it('should handle signup errors', async () => {
      const signupError = new Error('Email already registered')
      mockedSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: signupError,
      })

      await expect(
        authService.signUp({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
      ).rejects.toThrow('Email already registered')
    })

    it('should auto-confirm user when admin client is available', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        email_confirmed_at: null,
      }

      mockedSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      })

      mockedSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      } as any)

      if (mockedSupabaseAdmin) {
        mockedSupabaseAdmin.auth.admin.updateUserById.mockResolvedValue({
          data: mockUser,
          error: null,
        })
      }

      await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      })

      if (mockedSupabaseAdmin) {
        expect(mockedSupabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(
          'test-user-id',
          { email_confirm: true }
        )
      }
    })
  })

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      }

      mockedSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      })

      mockedSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      } as any)

      const result = await authService.signIn('test@example.com', 'password123')

      expect(mockedSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.user).toEqual(mockUser)
    })

    it('should handle signin errors', async () => {
      const signinError = new Error('Invalid credentials')
      mockedSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: signinError,
      })

      await expect(
        authService.signIn('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      mockedSupabase.auth.signOut.mockResolvedValue({ error: null })

      await authService.signOut()

      expect(mockedSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle signout errors', async () => {
      const signoutError = new Error('Signout failed')
      mockedSupabase.auth.signOut.mockResolvedValue({ error: signoutError })

      await expect(authService.signOut()).rejects.toThrow('Signout failed')
    })
  })

  describe('hasSubscriptionAccess', () => {
    it('should return true for equal tiers', () => {
      expect(authService.hasSubscriptionAccess('basic', 'basic')).toBe(true)
    })

    it('should return true for higher user tier', () => {
      expect(authService.hasSubscriptionAccess('premium', 'basic')).toBe(true)
    })

    it('should return false for lower user tier', () => {
      expect(authService.hasSubscriptionAccess('free', 'premium')).toBe(false)
    })
  })

  describe('getSubscriptionLimits', () => {
    it('should return correct limits for free tier', () => {
      const limits = authService.getSubscriptionLimits('free')
      expect(limits.workspaces).toBe(1)
      expect(limits.hexiesPerWorkspace).toBe(10)
    })

    it('should return correct limits for premium tier', () => {
      const limits = authService.getSubscriptionLimits('premium')
      expect(limits.workspaces).toBe(-1) // unlimited
      expect(limits.hexiesPerWorkspace).toBe(-1) // unlimited
    })
  })
})