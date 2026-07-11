// Featured content for right sidebar
// This file is auto-generated from admin/featured-content.yml
// Do not edit manually - run 'node admin/sync-featured.js' to update
//
// Last updated: 2025-12-28T20:02:10.374Z

import type { FeaturedItem } from "@/types";

export const featuredItems: FeaturedItem[] = [
  {
    id: "featured-001",
    category: "news",
    title: "Ethereum's Hegota Upgrade Coming 2026",
    description:
      "Major protocol upgrade will introduce parallel execution and Verkle Trees, targeting 10,000+ TPS performance.",
    badge: "Protocol",
    url: "https://www.coindesk.com/tech/2025/12/28/ethereum-s-hegota-upgrade-slated-for-late-2026-as-devs-accelerate-roadmap",
    featuredLevel: 1,
  },
  {
    id: "featured-002",
    category: "education",
    title: "Account Abstraction Deep Dive",
    description:
      "Understanding ERC-4337 and smart account fundamentals for developers.",
    badge: "Education",
    url: "https://www.reddit.com/r/ethereum/comments/1pxx78m/account_abstraction_erc4337_part_1_the_basics/",
    featuredLevel: 2,
  },
  {
    id: "featured-003",
    category: "projects",
    title: "Lido stETH SEC Analysis",
    description:
      "Impact of new regulatory guidance on liquid staking protocols.",
    badge: "DeFi",
    url: "https://blog.lido.fi/analysis-of-steth-in-light-of-sec-division-of-corporate-finances-guidance-on-liquid-staking-activities/",
    imageUrl:
      "https://blog.lido.fi/content/images/2025/11/Staking-Ethereum-With-Lid--1-.png",
    featuredLevel: 2,
  },
  {
    id: "featured-004",
    category: "projects",
    title: "Uniswap UNIfication Passes",
    description:
      "Major governance proposal enables fee switch and token burns.",
    badge: "Governance",
    url: "https://thedefiant.io/news/defi/uniswap-passes-unification-fee-switch-proposal",
    imageUrl:
      "https://cdn.thedefiant.io/52a6afc52397d2cf503709281795c27f9a58dbf744560b2aa01838a7732b-c2cad5d7-d650-4d37-a4de-2d22bcf05a88.png",
    featuredLevel: 2,
  },
];

// Helper function to get featured posts (for backward compatibility)
export const getFeaturedPosts = (): FeaturedItem[] => {
  return featuredItems;
};

// Get primary featured item (Level 1)
export const getPrimaryFeatured = (): FeaturedItem | undefined => {
  return featuredItems.find((item) => item.featuredLevel === 1);
};

// Get secondary featured items (Level 2)
export const getSecondaryFeatured = (): FeaturedItem[] => {
  return featuredItems.filter((item) => item.featuredLevel === 2);
};
