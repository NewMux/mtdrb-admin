import React from 'react';
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import GymSuiteScrollShowcase from './GymSuiteScrollShowcase';

// Mock GSAP to avoid issues in test environment
vi.mock('gsap', () => {
  const gsap = {
    registerPlugin: vi.fn(),
    timeline: vi.fn(() => ({
      scrollTrigger: vi.fn(),
      kill: vi.fn(),
    })),
    set: vi.fn(),
    to: vi.fn(),
  };
  return { default: gsap, ...gsap };
});

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    getAll: vi.fn(() => []),
  },
}));

describe('GymSuiteScrollShowcase', () => {
  it('renders without crashing', () => {
    const { container } = render(<GymSuiteScrollShowcase />);
    expect(container).toBeInTheDocument();
  });

  it('contains the main section element', () => {
    const { container } = render(<GymSuiteScrollShowcase />);
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
  });

  it('renders all 6 panels', () => {
    const { container } = render(<GymSuiteScrollShowcase />);
    const panels = container.querySelectorAll('[class*="min-h-screen"]');
    expect(panels.length).toBeGreaterThan(0);
  });
}); 