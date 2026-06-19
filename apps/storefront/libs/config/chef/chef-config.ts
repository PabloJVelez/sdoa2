/**
 * Chef Configuration
 *
 * This file contains all chef-specific information that can be easily customized
 * for different chefs. Update these values to personalize the storefront.
 */

export interface ChefConfig {
  // Basic Information
  name: string;
  displayName: string; // e.g., "Chef [Name]"
  tagline: string;

  // Biography
  bio: {
    short: string; // 1-2 sentences
    long: string[]; // Array of paragraphs
    subtitle: string; // e.g., "Culinary Artistry"
  };

  // Experience & Credentials
  credentials: {
    yearsExperience: string;
    specialization: string;
    highlights: string[]; // Badge items like "Michelin Trained", "Local Sourcing"
  };

  // Hero Section
  hero: {
    tagline: string;
    description: string;
    imageUrl: string;
    imageAlt: string;
  };

  // Meta & SEO
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

/**
 * Default Configuration
 *
 * This provides a generic template that can be used as-is for demos
 * or customized for specific chefs.
 */
export const chefConfig: ChefConfig = {
  // Basic Information
  name: 'SDOA',
  displayName: 'Sushi Delivery of Austin',
  tagline: 'Premium Sushi Experiences',

  // Biography
  bio: {
    short:
      "Austin's premier sushi experience — from artisanal bento boxes for pickup to intimate omakase dinners in your home.",
    long: [
      "Sushi Delivery of Austin was born from a simple belief: exceptional sushi shouldn't be confined to restaurant walls. What started as a passion project has grown into Austin's premier private sushi experience.",
      "Every roll, every slice of sashimi, every bento box is crafted with the same meticulous attention to detail you'd expect from a high-end omakase counter — but delivered directly to your home or prepared fresh in your kitchen.",
      'From intimate dinners for two to celebrations with friends and family, SDOA brings the artistry of Japanese cuisine to your most meaningful moments.',
    ],
    subtitle: 'Passion, Precision & Fresh Fish',
  },

  // Experience & Credentials
  credentials: {
    yearsExperience: '10+ years',
    specialization: 'Traditional and contemporary Japanese cuisine',
    highlights: ['Fresh Daily Ingredients', 'Austin-Based', 'Private Experiences'],
  },

  // Hero Section
  hero: {
    tagline: 'PREMIUM SUSHI EXPERIENCES',
    description:
      "From artisanal bento boxes to intimate omakase dinners — experience Austin's finest sushi, crafted with passion.",
    imageUrl: '/assets/images/home_test.jpg',
    imageAlt: 'Assorted sashimi trays',
  },

  // Meta & SEO
  seo: {
    title: 'Sushi Delivery of Austin - Premium Sushi & Omakase Experiences',
    description:
      "Austin's premier sushi experience. Order artisanal bento boxes for pickup or book a private omakase dinner.",
    keywords: [
      'sushi austin',
      'omakase austin',
      'bento box austin',
      'private sushi chef',
      'japanese catering austin',
      'sushi delivery austin',
      'sushi pickup austin',
      'private omakase austin',
    ],
  },
};

/**
 * Helper function to get chef configuration
 * This allows for future extensibility (e.g., environment-based configs)
 */
export function getChefConfig(): ChefConfig {
  return chefConfig;
}
