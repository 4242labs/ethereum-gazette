-- Manual import script for Vitalik Buterin's latest blog posts
-- Run this script in Supabase SQL Editor to import the 20 most recent posts

INSERT INTO posts (id, title, snippet, url, author, source, category, pub_date, created_at, updated_at) VALUES

-- Post 1: Balance of power (2025-12-30)
(
  'bal_pow_2025_12_30',
  'Balance of power',
  'Exploring the delicate balance of power in decentralized systems, governance structures, and the interplay between individual agency and collective coordination.',
  'https://vitalik.ca/general/2025/12/30/balance_of_power.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'people',
  '2025-12-30 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 2: Let a thousand societies bloom (2025-12-17)
(
  'societies_2025_12_17',
  'Let a thousand societies bloom',
  'A vision for diverse experimental societies and governance models, exploring how different communities can coexist and learn from each other in a pluralistic world.',
  'https://vitalik.ca/general/2025/12/17/societies.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'governance',
  '2025-12-17 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 3: Plinko PIR tutorial (2025-11-25)
(
  'plinko_pir_2025_11_25',
  'Plinko PIR tutorial',
  'A technical tutorial on Plinko Private Information Retrieval (PIR), explaining how this cryptographic technique enables private data queries in decentralized systems.',
  'https://vitalik.ca/general/2025/11/25/plinko.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'education',
  '2025-11-25 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 4: Galaxy brain resistance (2025-11-07)
(
  'galaxybrain_2025_11_07',
  'Galaxy brain resistance',
  'Examining resistance to overly complex intellectual frameworks and the importance of maintaining practical, grounded approaches to problem-solving in crypto and beyond.',
  'https://vitalik.ca/general/2025/11/07/galaxybrain.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'people',
  '2025-11-07 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 5: A GKR Tutorial (2025-10-25)
(
  'gkr_tutorial_2025_10_25',
  'A GKR Tutorial',
  'Comprehensive tutorial on the Goldwasser-Kalai-Rothblum (GKR) protocol, explaining this important zero-knowledge proof system and its applications in blockchain scaling.',
  'https://vitalik.ca/general/2025/10/25/gkr.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'education',
  '2025-10-25 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 6: One password to rule them all (2025-10-18)
(
  'password_2025_10_18',
  'One password to rule them all',
  'Exploring password management, digital identity solutions, and the trade-offs between security, usability, and privacy in authentication systems.',
  'https://vitalik.ca/general/2025/10/18/password.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'identity',
  '2025-10-18 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 7: The end of "move fast and break things" (2025-09-30)
(
  'move_fast_break_things_2025_09_30',
  'The end of "move fast and break things"',
  'Reflecting on the evolution of development philosophy in tech, from rapid iteration to more careful, considered approaches as systems mature and stakes increase.',
  'https://vitalik.ca/general/2025/09/30/move_fast.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'people',
  '2025-09-30 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 8: Making Ethereum alignment legible (2025-09-28)
(
  'ethereum_alignment_2025_09_28',
  'Making Ethereum alignment legible',
  'Discussing what it means to be "aligned" with Ethereum values, how to measure and maintain alignment, and ensuring the ecosystem stays true to its founding principles.',
  'https://vitalik.ca/general/2025/09/28/alignment.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'governance',
  '2025-09-28 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 9: Possible futures of the Ethereum protocol, part 6: The Splurge (2025-08-29)
(
  'ethereum_splurge_2025_08_29',
  'Possible futures of the Ethereum protocol, part 6: The Splurge',
  'Final part of the Ethereum roadmap series, covering miscellaneous protocol improvements including account abstraction, EVM enhancements, and other quality-of-life upgrades.',
  'https://vitalik.ca/general/2025/08/29/splurge.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'education',
  '2025-08-29 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 10: Possible futures of the Ethereum protocol, part 5: The Scourge (2025-08-21)
(
  'ethereum_scourge_2025_08_21',
  'Possible futures of the Ethereum protocol, part 5: The Scourge',
  'Addressing MEV (Maximal Extractable Value) and centralization risks in Ethereum, exploring solutions to maintain decentralization and fairness in block production.',
  'https://vitalik.ca/general/2025/08/21/scourge.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'education',
  '2025-08-21 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 11: Possible futures of the Ethereum protocol, part 4: The Verge (2025-08-13)
(
  'ethereum_verge_2025_08_13',
  'Possible futures of the Ethereum protocol, part 4: The Verge',
  'Exploring statelessness and verkle trees in Ethereum, explaining how these technologies will reduce node requirements and improve network accessibility.',
  'https://vitalik.ca/general/2025/08/13/verge.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'education',
  '2025-08-13 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 12: Possible futures of the Ethereum protocol, part 3: The Purge (2025-08-07)
(
  'ethereum_purge_2025_08_07',
  'Possible futures of the Ethereum protocol, part 3: The Purge',
  'Discussing protocol simplification efforts, state expiry, and history expiry to reduce the complexity and resource requirements of running Ethereum nodes.',
  'https://vitalik.ca/general/2025/08/07/purge.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'education',
  '2025-08-07 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 13: Possible futures of the Ethereum protocol, part 2: The Surge (2025-07-31)
(
  'ethereum_surge_2025_07_31',
  'Possible futures of the Ethereum protocol, part 2: The Surge',
  'Deep dive into Ethereum scaling solutions including rollups, data availability improvements, and how to achieve 100,000+ transactions per second while maintaining decentralization.',
  'https://vitalik.ca/general/2025/07/31/surge.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'education',
  '2025-07-31 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 14: Possible futures of the Ethereum protocol, part 1: The Merge (2025-07-23)
(
  'ethereum_merge_2025_07_23',
  'Possible futures of the Ethereum protocol, part 1: The Merge',
  'First in a series exploring Ethereum roadmap, focusing on the transition to proof-of-stake, single-slot finality, and validator experience improvements.',
  'https://vitalik.ca/general/2025/07/23/merge.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'education',
  '2025-07-23 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 15: My techno-optimism (2025-07-11)
(
  'techno_optimism_2025_07_11',
  'My techno-optimism',
  'Exploring a nuanced view of technological progress, balancing optimism about technology potential with awareness of risks and the importance of human agency in shaping outcomes.',
  'https://vitalik.ca/general/2025/07/11/techno-optimism.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'people',
  '2025-07-11 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 16: What do I think about Community Notes? (2025-06-20)
(
  'community_notes_2025_06_20',
  'What do I think about Community Notes?',
  'Analysis of Twitter Community Notes as a decentralized moderation mechanism, discussing its strengths, limitations, and lessons for broader decentralized governance systems.',
  'https://vitalik.ca/general/2025/06/20/community_notes.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'governance',
  '2025-06-20 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 17: What do I think about biometric proof of personhood? (2025-06-12)
(
  'biometric_proof_personhood_2025_06_12',
  'What do I think about biometric proof of personhood?',
  'Examining biometric identity solutions like Worldcoin, discussing privacy concerns, centralization risks, and alternative approaches to establishing unique human identity.',
  'https://vitalik.ca/general/2025/06/12/biometric.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'identity',
  '2025-06-12 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 18: Some thoughts on info finance (2025-05-29)
(
  'info_finance_2025_05_29',
  'Some thoughts on info finance',
  'Exploring the intersection of information markets and decentralized finance, including prediction markets, information tokenization, and incentive mechanisms for truth-seeking.',
  'https://vitalik.ca/general/2025/05/29/info_finance.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'defi',
  '2025-05-29 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 19: The promise and challenges of crypto + AI applications (2025-05-20)
(
  'crypto_ai_2025_05_20',
  'The promise and challenges of crypto + AI applications',
  'Analyzing potential synergies between cryptocurrency and artificial intelligence, covering privacy-preserving ML, decentralized AI training, and incentive alignment challenges.',
  'https://vitalik.ca/general/2025/05/20/crypto_ai.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'ai',
  '2025-05-20 00:00:00+00',
  NOW(),
  NOW()
),

-- Post 20: Against choosing your political allegiances based on who is "pro-crypto" (2025-05-12)
(
  'political_allegiances_2025_05_12',
  'Against choosing your political allegiances based on who is "pro-crypto"',
  'Arguing for principled political engagement beyond single-issue crypto advocacy, emphasizing the importance of broader values and long-term thinking in political decisions.',
  'https://vitalik.ca/general/2025/05/12/political.html',
  'Vitalik Buterin',
  'Vitalik Buterin''s Blog',
  'governance',
  '2025-05-12 00:00:00+00',
  NOW(),
  NOW()
)

ON CONFLICT (url) DO NOTHING;

-- Update statistics
INSERT INTO fetch_history (sources_processed, items_fetched, items_stored, execution_time_ms, errors, created_at)
VALUES (1, 20, 20, 0, NULL, NOW());

-- Verify import
SELECT
  COUNT(*) as total_vitalik_posts,
  MIN(pub_date) as oldest_post,
  MAX(pub_date) as newest_post
FROM posts
WHERE source = 'Vitalik Buterin''s Blog';

SELECT title, pub_date, category, url
FROM posts
WHERE source = 'Vitalik Buterin''s Blog'
ORDER BY pub_date DESC
LIMIT 10;
