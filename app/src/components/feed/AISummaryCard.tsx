import { useEffect, useState, useRef, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { POST_CARD_HEIGHT } from "@/components/feed/PostCard";

// ---------------------------------------------------------------------------
// 5 static summaries simulating LLM-generated content from real feed data.
// Replace `summaries` with an API call to /api/ai-summary when ready.
// ---------------------------------------------------------------------------
const summaries = [
  {
    id: 1,
    title: "Ethereum Foundation doubles down on DeFi and staking",
    body: "The Ethereum Foundation reaffirmed its commitment to privacy-first, permissionless DeFi infrastructure — echoed by Vitalik's blog post arguing 'low-risk DeFi can be for Ethereum what search was for Google.' Separately, the EF announced staking ~70,000 ETH from its treasury, with rewards redirected to fund core development. Both Reddit r/ethereum and EthResearch picked up the story.",
  },
  {
    id: 2,
    title: "Fusaka & Glamsterdam devnets advancing on schedule",
    body: "All Core Devs Testing #72 (Ethereum Magicians) confirmed blob-devnet-0 for Fusaka is progressing and bal-devnet-3 readiness for Glamsterdam is under review. The EIP-7928 breakout (#13) confirmed new client readiness checks. The Encrypt The Mempool working group held its first session March 4, signalling growing interest in transaction privacy at the protocol level.",
  },
  {
    id: 3,
    title: "Vitalik active across blog and Reddit with philosophy and scaling takes",
    body: "Vitalik Buterin published multiple posts this week on private property theory, privacy advocacy, and L1 gas limit rationale. On Reddit r/ethereum his account flagged the EF's DeFi commitment thread. EthResearch and community members are revisiting 'Scaling Ethereum L1 and L2s in 2025 and beyond' alongside the ongoing 'Possible futures of the Ethereum protocol' series.",
  },
  {
    id: 4,
    title: "Lido V3 live — institutional staking goes modular",
    body: "Lido V3 launched stVaults, a modular infrastructure layer for institutional-grade staking. The Lido Blog published six related posts covering integrations with Kiln, Nansen, Obol, Pier Two, Northstake, and RockSolid. Deribit also reduced its margin haircut for stETH. 'The Case for Staked ETH in Corporate Treasuries' signals Lido is targeting treasury allocation strategies beyond retail.",
  },
  {
    id: 5,
    title: "Security tooling and ETH market moves draw community attention",
    body: "A Telegram bot aggregating audit contest updates from Sherlock, Code4rena, Cantina, and Immunefi gained traction on Reddit r/ethereum. A thread flagged Vitalik's wallet moving 1,869 ETH (~$3.6M) — consensus leaned toward noise. EtherWorld Weekly Edition 352 and a community-built ETH transaction encoder tool also made the rounds this week.",
  },
  {
    id: 6,
    title: "DeFi rebuilds the fixed-income stack as institutions circle",
    body: "CoinDesk reported on how DeFi protocols are quietly assembling institutional-grade fixed-income products. Electric Capital mapped 501 real-world yield sources and found 93% remain untouched by DeFi — signaling massive expansion runway. EtherFi announced tapping Plume's Nest Vaults for real-world asset yield, while Amundi launched a tokenized swap fund on Ethereum and Stellar.",
  },
  {
    id: 7,
    title: "Encrypted mempools and post-quantum research heat up",
    body: "EIP-8184 proposes LUCID, an encrypted mempool standard. EthResearch published 'Encrypted frame transactions' and 'What if post-quantum Ethereum doesn't need signatures at all?' — exploring lattice-based alternatives. FOCIL Breakout #31 continued work on forced inclusion lists. The trend is clear: transaction privacy and quantum resistance are moving from theory to concrete EIPs.",
  },
  {
    id: 8,
    title: "AI agents get payment rails on Ethereum",
    body: "World Liberty Financial launched a toolkit letting AI agents spend USD1 autonomously. Visa announced a CLI payment tool for agentic commerce. Tempo went live on mainnet with a machine payments protocol integrated with Stripe. Meanwhile, ERC-8184 proposes signed voucher payment channels designed for AI agent micropayments — the infrastructure for machine-to-machine finance is forming fast.",
  },
  {
    id: 9,
    title: "EF deposits another $7.5M into Morpho as treasury strategy evolves",
    body: "The Ethereum Foundation deposited $7.5M in ETH into Morpho, continuing its shift toward active treasury management. This follows earlier staking of ~70,000 ETH. The community on Reddit r/ethereum debated whether the Foundation should be more aggressive with DeFi allocations. Separately, ETH outperformed large-cap crypto assets as 'OG' holders increased positions.",
  },
  {
    id: 10,
    title: "Fast Confirmation Rule targets 13-second bridge times",
    body: "The Ethereum Foundation published research on the Fast Confirmation Rule (FCR), which could reduce bridge confirmation times to ~13 seconds — a 98% reduction from current wait times. Reddit r/ethereum surfaced the paper, with community discussion focused on implications for L2 interoperability. EthResearch also explored rational finality stalls and pre-finality risks in Ethereum-anchored systems.",
  },
  {
    id: 11,
    title: "Binary tries and EVM changes drive protocol-level research",
    body: "EthResearch published two papers on optimal group depth for Ethereum's binary trie migration. Ethereum Magicians hosted Glamsterdam Repricings #4, reviewing gas cost adjustments. EIP-8197 proposes cryptographically agile transactions (CATX), and a draft ERC for PhaseGuard introduces a standard interface for contract lifecycle states. Core protocol evolution continues at a rapid clip.",
  },
  {
    id: 12,
    title: "ENS governance active amid Tally shutdown",
    body: "ENS DAO saw a busy week: a temp check on expanding the Foundation board, Anticapture's voting interface going live, and retro evaluation preliminary results published. Meanwhile, DAO governance platform Tally shut down after six years citing lack of viable market demand — a reminder that governance tooling still struggles with sustainability. ENSWhois.com launched as an API-first data layer.",
  },
  {
    id: 13,
    title: "Tokenized real-world assets gain institutional backing",
    body: "The World Gold Council proposed shared infrastructure for tokenized gold products. Cari Network launched a tokenized deposit platform on ZKsync's Prividium for US regional banks. TradeXYZ landed an official S&P 500 license for on-chain perpetuals. Celo proposed shifting Opera to a long-term stakeholder with a 160M CELO grant. The RWA narrative is moving from pilots to production deployments.",
  },
];

const TYPING_SPEED = 12; // ms per character (fast)
const HOLD_DURATION = 7000; // 7 seconds hold after typing completes
const MAX_BODY_CHARS = 360;

export function AISummaryCard() {
  const [index, setIndex] = useState(0);
  const [displayedTitle, setDisplayedTitle] = useState("");
  const [displayedBody, setDisplayedBody] = useState("");
  const [phase, setPhase] = useState<"typing-title" | "typing-body" | "holding" | "clearing">("typing-title");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = summaries.length;

  const current = summaries[index];
  const fullTitle = current.title;
  const fullBody = current.body.length > MAX_BODY_CHARS
    ? current.body.substring(0, MAX_BODY_CHARS).trimEnd() + "..."
    : current.body;

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Typing title
  useEffect(() => {
    if (phase !== "typing-title") return;
    if (displayedTitle.length < fullTitle.length) {
      timerRef.current = setTimeout(() => {
        setDisplayedTitle(fullTitle.slice(0, displayedTitle.length + 1));
      }, TYPING_SPEED);
      return () => clearTimers();
    }
    // Title done, start body
    setPhase("typing-body");
  }, [phase, displayedTitle, fullTitle, clearTimers]);

  // Typing body
  useEffect(() => {
    if (phase !== "typing-body") return;
    if (displayedBody.length < fullBody.length) {
      timerRef.current = setTimeout(() => {
        setDisplayedBody(fullBody.slice(0, displayedBody.length + 1));
      }, TYPING_SPEED);
      return () => clearTimers();
    }
    // Body done, hold
    setPhase("holding");
  }, [phase, displayedBody, fullBody, clearTimers]);

  // Holding
  useEffect(() => {
    if (phase !== "holding") return;
    timerRef.current = setTimeout(() => {
      setPhase("clearing");
    }, HOLD_DURATION);
    return () => clearTimers();
  }, [phase, clearTimers]);

  // Clearing → next summary
  useEffect(() => {
    if (phase !== "clearing") return;
    timerRef.current = setTimeout(() => {
      setDisplayedTitle("");
      setDisplayedBody("");
      setIndex((index + 1) % total);
      setPhase("typing-title");
    }, 300);
    return () => clearTimers();
  }, [phase, index, total, clearTimers]);

  return (
    <article
      className={`
        relative w-full min-w-0 overflow-hidden rounded-xl p-6
        bg-white dark:bg-gray-800
        border border-gray-300 dark:border-gray-700
        shadow-soft hover:shadow-soft-md
        transition-all duration-200
      `}
      style={{ minHeight: POST_CARD_HEIGHT * 2.5 + 24 }}
    >
      {/* AI Badge — centered */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-sm bg-gradient-to-r from-accent-500 to-accent-600 text-white">
          <Sparkles className="w-3 h-3" />
          AI Briefing
        </span>
      </div>

      {/* Content with typewriter effect */}
      <div
        className={`transition-opacity duration-300 ${phase === "clearing" ? "opacity-0" : "opacity-100"}`}
      >
        <h2 className="text-title text-[18px] text-gray-900 dark:text-gray-100 mb-3 leading-relaxed">
          {displayedTitle}
          {phase === "typing-title" && (
            <span className="inline-block w-0.5 h-5 bg-accent-500 ml-0.5 animate-pulse align-text-bottom" />
          )}
        </h2>
        <p className="text-body text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {displayedBody}
          {phase === "typing-body" && (
            <span className="inline-block w-0.5 h-4 bg-accent-500 ml-0.5 animate-pulse align-text-bottom" />
          )}
        </p>
      </div>
    </article>
  );
}
