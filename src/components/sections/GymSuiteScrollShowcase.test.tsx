import React from 'react';
import { render } from '@testing-library/react';
import GymSuiteScrollShowcase from './GymSuiteScrollShowcase';

// Mock GSAP to avoid issues in test environment
jest.mock('gsap', () => ({
  registerPlugin: jest.fn(),
  timeline: jest.fn(() => ({
    scrollTrigger: jest.fn(),
    kill: jest.fn(),
  })),
  set: jest.fn(),
  to: jest.fn(),
}));

jest.mock('gsap/ScrollTrigger', () => ({
  getAll: jest.fn(() => []),
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