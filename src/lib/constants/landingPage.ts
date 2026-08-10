/**
 * Landing Page Content Constants
 * Centralized content for the landing page to improve maintainability
 */

export const LANDING_CONTENT = {
  hero: {
    badge: {
      icon: "play",
      text: "MENAT Fitness Technology",
    },
    headline: {
      primary: "Built for Power.",
      secondary: "Designed for Growth.",
    },
    subtitle: "The gym operating system for MENAT",
    cta: {
      primary: {
        text: "Book Demo",
        href: "/signup",
      },
      secondary: {
        text: "Explore Platform",
        href: "#features",
      },
    },
    scrollIndicator: "Scroll to explore",
  },

  navigation: {
    logo: {
      text: "MTDRB",
      href: "/",
    },
    links: [
      { text: "Features", href: "#features" },
      { text: "Pricing", href: "#pricing" },
      { text: "About", href: "#about" },
      { text: "Contact", href: "#contact" },
    ],
    cta: {
      signIn: {
        text: "Sign In",
        href: "/login",
      },
      getStarted: {
        text: "Get Started",
        href: "/signup",
      },
    },
  },

  whatIsIdara: {
    headline: "Idara is the operating system for gyms — built for the region.",
    pillars: [
      {
        icon: "monitor",
        title: "Idara SaaS",
        description:
          "Complete gym management platform with real-time analytics and automation.",
      },
      {
        icon: "message-circle",
        title: "WhatsApp Assistant",
        description:
          "24/7 Assistant that handles member inquiries and bookings automatically.",
      },
      {
        icon: "shield",
        title: "Biometric Access",
        description:
          "Secure member check-ins with fingerprint and facial recognition technology.",
      },
    ],
  },

  features: {
    headline: "Everything you need to run your gym",
    subtitle:
      "Powerful features designed to streamline operations and boost member satisfaction",
    items: [
      {
        icon: "zap",
        title: "Smart Automation",
        description:
          "Smart-powered workflows that handle routine tasks automatically, saving hours every day.",
        category: "automation",
      },
      {
        icon: "bar-chart-2",
        title: "Real-Time Reports",
        description:
          "Live dashboards and analytics that give you instant insights into your gym's performance.",
        category: "analytics",
      },
      {
        icon: "message-circle",
        title: "WhatsApp Bot",
        description:
          "24/7 Assistant that handles member inquiries, bookings, and support automatically.",
        category: "communication",
      },
      {
        icon: "shield",
        title: "Biometric Check-ins",
        description:
          "Secure fingerprint and facial recognition technology for seamless member access.",
        category: "security",
      },
      {
        icon: "users",
        title: "Member Management",
        description:
          "Comprehensive member profiles, attendance tracking, and engagement tools.",
        category: "management",
      },
      {
        icon: "calendar",
        title: "Class Scheduling",
        description:
          "Intelligent scheduling system with automated reminders and capacity management.",
        category: "scheduling",
      },
      {
        icon: "credit-card",
        title: "Billing & Payments",
        description:
          "Automated billing, payment processing, and financial reporting with VAT compliance.",
        category: "billing",
      },
      {
        icon: "globe",
        title: "Arabic/English",
        description:
          "Fully localized interface with Arabic language support and regional business logic.",
        category: "localization",
      },
    ],
  },

  pricing: {
    headline: "Simple Pricing",
    subtitle: "Choose the plan that fits your gym's needs",
    toggle: {
      monthly: "Monthly",
      yearly: "Yearly",
      savings: "(Save 25%)",
    },
    plans: [
      {
        name: "Starter",
        monthlyPrice: 80,
        yearlyPrice: 65,
        description: "Perfect for single-location gyms",
        features: [
          "All core features",
          "Single location",
          "+$20 USD/month per extra location",
          "Basic analytics",
          "Email support",
        ],
        popular: false,
        cta: "Get Started",
      },
      {
        name: "Pro",
        monthlyPrice: 130,
        yearlyPrice: 105,
        description: "For growing gym chains",
        features: [
          "Everything in Starter",
          "$10 USD/month per extra location",
          "Unlimited members",
          "Advanced analytics",
          "Priority support",
          "WhatsApp bot",
        ],
        popular: true,
        cta: "Get Started",
      },
    ],
    faq: {
      headline: "Frequently Asked Questions",
      items: [
        {
          question: "Can I change plans anytime?",
          answer:
            "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
        },
        {
          question: "Is there a setup fee?",
          answer:
            "No setup fees. We'll help you migrate your data and get started at no additional cost.",
        },
        {
          question: "What about VAT?",
          answer:
            "All prices include VAT. We handle all tax compliance automatically for MENAT businesses.",
        },
        {
          question: "Do you offer custom plans?",
          answer:
            "For enterprise gyms with special requirements, we offer custom pricing and features.",
        },
      ],
    },
  },

  socialProof: {
    headline: "Trusted by gyms across MENAT",
    testimonials: [
      {
        name: "Ahmed Al-Mansoori",
        role: "Owner, Elite Fitness Dubai",
        content:
          "Idara transformed how we manage our gym. The automation features alone save us 10+ hours per week.",
        rating: 5,
      },
      {
        name: "Sarah Al-Khalifa",
        role: "Operations Manager, FitZone Riyadh",
        content:
          "The WhatsApp Assistant bot handles 80% of our member inquiries automatically. Game changer!",
        rating: 5,
      },
      {
        name: "Mohammed Al-Zahrani",
        role: "CEO, PowerGym Kuwait",
        content:
          "Real-time analytics help us make data-driven decisions. Our member retention improved by 25%.",
        rating: 5,
      },
    ],
    stats: [
      { value: "500+", label: "Gyms" },
      { value: "50K+", label: "Members" },
      { value: "99.9%", label: "Uptime" },
      { value: "4.8/5", label: "Rating" },
    ],
  },

  cta: {
    headline: "Ready to transform your gym?",
    subtitle: "Join hundreds of gyms already using Idara",
    primary: {
      text: "Start Free Trial",
      href: "/signup",
    },
    secondary: {
      text: "Schedule Demo",
      href: "/signup",
    },
  },

  footer: {
    description:
      "The gym operating system for MENAT. Built for power, designed for growth.",
    links: {
      product: [
        { text: "Features", href: "#features" },
        { text: "Pricing", href: "#pricing" },
        { text: "Demo", href: "/signup" },
        { text: "API", href: "#features" },
      ],
      company: [
        { text: "About", href: "#features" },
        { text: "Contact", href: "/login" },
        { text: "Support", href: "/login" },
        { text: "Careers", href: "#features" },
      ],
      legal: [
        { text: "Privacy", href: "#features" },
        { text: "Terms", href: "#features" },
        { text: "Security", href: "#features" },
      ],
    },
    copyright: `© ${new Date().getFullYear()} MTDRB. All rights reserved.`,
    social: {
      twitter: "https://twitter.com/mtdrb",
      linkedin: "https://linkedin.com/company/mtdrb",
      instagram: "https://instagram.com/mtdrb",
    },
  },
} as const;

