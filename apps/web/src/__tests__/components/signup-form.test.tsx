import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignupForm } from '@/components/auth/signup-form';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Supabase client
const mockSignUp = jest.fn();
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
    },
  }),
}));

// Mock window.location.origin
Object.defineProperty(window, 'location', {
  value: { origin: 'http://localhost:3000' },
  writable: true,
});

describe('SignupForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders signup form correctly', () => {
    render(<SignupForm />);

    expect(screen.getByText('Create an account')).toBeInTheDocument();
    expect(screen.getByText('Start your 14-day free trial. No credit card required.')).toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  });

  it('shows login link', () => {
    render(<SignupForm />);

    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('shows password requirements', () => {
    render(<SignupForm />);

    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
  });

  it('handles successful signup', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        options: {
          data: { full_name: 'John Doe' },
          emailRedirectTo: 'http://localhost:3000/auth/callback',
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });
  });

  it('displays error on failed signup', async () => {
    mockSignUp.mockResolvedValueOnce({
      error: { message: 'Email already registered' },
    });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    mockSignUp.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
    );

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByRole('button', { name: 'Creating account...' })).toBeDisabled();
  });

  it('shows confirmation screen with back to login button', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: 'Back to sign in' });
    fireEvent.click(backButton);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
