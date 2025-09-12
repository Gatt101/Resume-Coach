/**
 * Unit tests for GitHubResumeModal component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GitHubResumeModal from '../../components/GitHubResumeModal';

// Mock fetch
global.fetch = vi.fn();

describe('GitHubResumeModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          resume: {
            name: 'Test User',
            email: 'test@example.com',
            phone: '(555) 123-4567',
            location: 'San Francisco',
            summary: 'Software Developer with 3+ years of experience',
            experience: [],
            skills: ['TypeScript', 'React'],
            projects: [],
          },
          metadata: {
            source: 'github',
            githubUsername: 'testuser',
            processedAt: '2023-12-01T00:00:00Z',
          },
          stats: {
            repositoriesAnalyzed: 10,
            languagesFound: 5,
            totalCommits: 150,
            totalStars: 200,
          },
        },
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('should render modal when open', () => {
      render(<GitHubResumeModal {...defaultProps} />);
      
      expect(screen.getByText('Build Resume from GitHub')).toBeInTheDocument();
      expect(screen.getByText('GitHub Username *')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., octocat')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(<GitHubResumeModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Build Resume from GitHub')).not.toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<GitHubResumeModal {...defaultProps} />);
      
      expect(screen.getByLabelText('GitHub Username *')).toBeInTheDocument();
      expect(screen.getByText('Target Role')).toBeInTheDocument();
      expect(screen.getByText('Experience Level')).toBeInTheDocument();
      expect(screen.getByText('Preferred Technologies')).toBeInTheDocument();
      expect(screen.getByText('Target Company (Optional)')).toBeInTheDocument();
      expect(screen.getByText('Advanced Options')).toBeInTheDocument();
    });

    it('should render role options in select', async () => {
      const user = userEvent.setup();
      render(<GitHubResumeModal {...defaultProps} />);
      
      const roleSelect = screen.getByText('Select your target role');
      await user.click(roleSelect);
      
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Backend Developer')).toBeInTheDocument();
      expect(screen.getByText('Full-Stack Developer')).toBeInTheDocument();
    });

    it('should render experience level options in select', async () => {
      const user = userEvent.setup();
      render(<GitHubResumeModal {...defaultProps} />);
      
      const experienceSelect = screen.getByText('Select your experience level');
      await user.click(experienceSelect);
      
      expect(screen.getByText('Junior (0-2 years)')).toBeInTheDocument();
      expect(screen.getByText('Mid-level (2-5 years)')).toBeInTheDocument();
      expect(screen.getByText('Senior (5+ years)')).toBeInTheDocument();
      expect(screen.getByText('Lead/Principal (8+ years)')).toBeInTheDocument();
    });
  });

  describe('form interactions', () => {
    it('should update username field', async () => {
      const user = userEvent.setup();
      render(<GitHubResumeModal {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g., octocat');
      await user.type(usernameInput, 'testuser');
      
      expect(usernameInput).toHaveValue('testuser');
    });

    it('should add tech stack items', async () => {
      const user = userEvent.setup();
      render(<GitHubResumeModal {...defaultProps} />);
      
      const techInput = screen.getByPlaceholderText('Add a technology...');
      const addButton = screen.getByText('Add');
      
      await user.type(techInput, 'React');
      await user.click(addButton);
      
      expect(screen.getByText('React ×')).toBeInTheDocument();
    });

    it('should add tech stack on Enter key', async () => {
      const user = userEvent.setup();
      render(<GitHubResumeModal {...defaultProps} />);
      
      const techInput = screen.getByPlaceholderText('Add a technology...');
      
      await user.type(techInput, 'TypeScript');
      await user.keyboard('{Enter}');
      
      expect(screen.getByText('TypeScript ×')).toBeInTheDocument();
    });

    it('should remove tech stack items when clicked', async () => {
      const user = userEvent.setup();
      render(<GitHubResumeModal {...defaultProps} />);
      
      const techInput = screen.getByPlaceholderText('Add a technology...');
      await user.type(techInput, 'Vue.js');
      await user.keyboard('{Enter}');
      
      const techBadge = screen.getByText('Vue.js ×');
      expect(techBadge).toBeInTheDocument();
      
      await user.click(techBadge);
      expect(screen.queryByText('Vue.js ×')).not.toBeInTheDocument();
    });

    it('should add common tech stack suggestions', async () => {
      const user = userEvent.setup();
      render(<GitHubResumeModal {...defaultProps} />);
      
      const reactSuggestion = screen.getByText('+ React');
      await user.click(reactSuggestion);
      
      expect(screen.getByText('React ×')).toBeInTheDocument();
    });

    it('should update slider values', async () => {
      const user = userEvent.setup();
      render(<GitHubResumeModal {...defaultProps} />);
      
      const maxReposSlider = screen.getByDisplayValue('6');
      fireEvent.change(maxReposSlider, { target: { value: '8' } });
      
      expect(screen.getByText('Max Repositories: 8')).toBeInTheDocument();
    });

    it('should disable submit button when username is empty', () => {
      render(<GitHubResumeModal {...defaultProps} />);
      
      const submitButton = screen.getByText('Generate Resume');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when username is provided', async () => {
      const user = userEvent.setup();
      render(<GitHubResumeModal {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g., octocat');
      await user.type(usernameInput, 'testuser');
      
      const submitButton = screen.getByText('Generate Resume');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('form submission', () => {
    it('should submit form with basic data', async () => {
      const user = userEvent.setup();
      render(<GitHubResumeModal {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g., octocat');
      await user.type(usernameInput, 'testuser');
      
      const submitButton = screen.getByText('Generate Resume');
      await user.click(submitButton);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/resume/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          hints: {
            preferredRole: undefined,
            techStack: undefined,
            targetCompany: undefined,
            experienceLevel: undefined,
          },
          options: {
            maxRepositories: 6,
            minStarsForProjects: 0,
            includeOpenSourceExperience: true,
            conservativeEstimates: true,
          },
        }),
      });
    });

    it('should submit form with all optional data', async () => {
      const user = userEvent.setup();
      render(<GitHubResumeModal {...defaultProps} />);
      
      // Fill in username
      const usernameInput = screen.getByPlaceholderText('e.g., octocat');
      await user.type(usernameInput, 'testuser');
      
      // Select role
      const roleSelect = screen.getByText('Select your target role');
      await user.click(roleSelect);
      await user.click(screen.getByText('Frontend Developer'));
      
      // Add tech stack
      const techInput = screen.getByPlaceholderText('Add a technology...');
      await user.type(techInput, 'React');
      await user.keyboard('{Enter}');
      
      // Add target company
      const companyInput = screen.getByPlaceholderText('e.g., Google, Microsoft, Startup');
      await user.type(companyInput, 'Google');
      
      const submitButton = screen.getByText('Generate Resume');
      await user.click(submitButton);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/resume/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          hints: {
            preferredRole: 'frontend',
            techStack: ['React'],
            targetCompany: 'Google',
            experienceLevel: undefined,
          },
          options: {
            maxRepositories: 6,
            minStarsForProjects: 0,
            includeOpenSourceExperience: true,
            conservativeEstimates: true,
          },
        }),
      });
    });

    it('should show processing steps during submission', async () => {
      const user = userEvent.setup();
      render(<GitHubResumeModal {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g., octocat');
      await user.type(usernameInput, 'testuser');
      
      const submitButton = screen.getByText('Generate Resume');
      await user.click(submitButton);
      
      expect(screen.getByText('Processing your GitHub data...')).toBeInTheDocument();
      expect(screen.getByText('Validating GitHub username')).toBeInTheDocument();
      expect(screen.getByText('Fetching GitHub profile')).toBeInTheDocument();
      expect(screen.getByText('Analyzing repositories')).toBeInTheDocument();
    });

    it('should call onSuccess when API succeeds', async () => {
      const user = userEvent.setup();
      render(<GitHubResumeModal {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g., octocat');
      await user.type(usernameInput, 'testuser');
      
      const submitButton = screen.getByText('Generate Resume');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test User',
            email: 'test@example.com',
          }),
          expect.objectContaining({
            source: 'github',
            githubUsername: 'testuser',
          })
        );
      }, { timeout: 1000 });
    });
  });

  describe('error handling', () => {
    it('should display error when API fails', async () => {
      const user = userEvent.setup();
      
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'GitHub user not found',
          message: 'The GitHub user "testuser" does not exist.',
        }),
      });
      
      render(<GitHubResumeModal {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g., octocat');
      await user.type(usernameInput, 'testuser');
      
      const submitButton = screen.getByText('Generate Resume');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('The GitHub user "testuser" does not exist.')).toBeInTheDocument();
      });
    });

    it('should display error when network fails', async () => {
      const user = userEvent.setup();
      
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      render(<GitHubResumeModal {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g., octocat');
      await user.type(usernameInput, 'testuser');
      
      const submitButton = screen.getByText('Generate Resume');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('modal controls', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<GitHubResumeModal {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset form when modal is closed', async () => {
      const user = userEvent.setup();
      render(<GitHubResumeModal {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g., octocat');
      await user.type(usernameInput, 'testuser');
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      // Reopen modal
      render(<GitHubResumeModal {...defaultProps} />);
      
      const newUsernameInput = screen.getByPlaceholderText('e.g., octocat');
      expect(newUsernameInput).toHaveValue('');
    });

    it('should prevent closing during processing', async () => {
      const user = userEvent.setup();
      
      // Mock a slow API response
      (global.fetch as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, data: {} }),
        }), 1000))
      );
      
      render(<GitHubResumeModal {...defaultProps} />);
      
      const usernameInput = screen.getByPlaceholderText('e.g., octocat');
      await user.type(usernameInput, 'testuser');
      
      const submitButton = screen.getByText('Generate Resume');
      await user.click(submitButton);
      
      // Try to close during processing
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });
  });
});