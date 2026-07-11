import type { Post, Category } from "@/types";

// Helper function to parse CSV date strings to Date objects
const parseDate = (dateStr: string): Date => {
  // Handle placeholder dates
  if (dateStr.includes("XX")) {
    return new Date("2025-01-01");
  }
  return new Date(dateStr);
};

// Mock posts data - imported from dummy-content-data.csv in this directory
export const mockPosts: Post[] = [
  {
    id: "1",
    category: "news" as Category,
    title:
      "Crypto activity in Brazil rises 43% with average investment surpassing $1000",
    snippet:
      "Brazil's crypto market showed signs of maturity in 2025 with 43% growth in transaction volume and average investments crossing $1000 per user.",
    author: "Amin Haqshanas",
    source: "Cointelegraph",
    timestamp: parseDate("2025-12-30"),
    url: "https://cointelegraph.com/news/brazil-crypto-activity-43-percent-growth-average-investment-2025",
  },
  {
    id: "46",
    category: "people" as Category,
    title: "",
    snippet:
      "Information is powerful. Whoever can control, alter, or erase it holds power. For anyone still in Buenos Aires, the Museo Sitio de Memoria ESMA is worth a visit. Once a secret detention center, now a place of testimony showing how the military dictatorship operated.",
    author: "@AyaMiyagotchi",
    source: "X",
    timestamp: parseDate("2025-12-28"),
    url: "https://x.com/AyaMiyagotchi/status/1994421737954390487",
  },
  {
    id: "15",
    category: "orgs" as Category,
    title: "How Consensys and Ethereum made 2025 crypto's most important year",
    snippet: "2026 will be about building on the foundation set in 2025.",
    author: "Eric Mack",
    source: "Consensys",
    timestamp: parseDate("2025-12-26"),
    url: "https://consensys.io/blog/how-consensys-and-ethereum-made-2025-cryptos-most-important-year",
  },
  {
    id: "22",
    category: "events" as Category,
    title: "Ethereum Cypherpunk Congress #2",
    snippet: "Sunday, November 16 9:00 AM - 7:00 PM GMT-3",
    author: "Web3Privacy Now Events",
    source: "Luma",
    timestamp: parseDate("2025-12-24"),
    url: "https://luma.com/u2sw5kpv?tk=CEDK24",
  },
  {
    id: "9",
    category: "grants" as Category,
    title:
      "Calling All Builders: BlobKit is Funding $50000 in Ethereum for OnBlob Innovation",
    snippet:
      "Ethereum Community Foundation announces $50000 in grants for developers building with BlobKit SDK to expand the OnBlob ecosystem.",
    author: "Ethereum Community Foundation",
    source: "ECF",
    timestamp: parseDate("2025-12-22"),
    url: "https://ethcf.org/blog/blob-grants/",
  },
  {
    id: "33",
    category: "projects" as Category,
    title: "Hubs Network",
    snippet:
      "Collaborative network for social impact that creates and connects Multidisciplinary in real life spaces that acts and sets impulses to reinvent society futures.",
    author: "Pensieve",
    source: "ECF",
    timestamp: parseDate("2025-12-20"),
    url: "https://pensieve.ecf.network/project/111",
  },
  {
    id: "32",
    category: "media" as Category,
    title:
      "Mihai Alisie - AKASHA: Decentralized Autonomous Worlds for smarter communities",
    snippet:
      "Join us for an insightful session with Mihai Alisie, Ethereum co-founder, as he delves into his presentation called `AKASHA: Decentralized Autonomous Worlds for smarter communities'.",
    author: "ETH Bucharest",
    source: "YouTube",
    timestamp: parseDate("2024-12-18"),
    url: "https://youtu.be/Ya_X2bedgfQ",
  },
  {
    id: "2",
    category: "news" as Category,
    title:
      "Blockchains quietly prepare for quantum threat as Bitcoin debates timeline",
    snippet:
      "Altcoin blockchains like Aptos and Solana are testing quantum-resistant solutions while Bitcoin community debates urgency of the distant threat.",
    author: "Yohan Yun",
    source: "Cointelegraph",
    timestamp: parseDate("2025-12-16"),
    url: "https://cointelegraph.com/news/blockchains-prepare-quantum-threat-bitcoin-debate-timeline",
  },
  {
    id: "49",
    category: "people" as Category,
    title: "",
    snippet:
      "a long read, and the pacing and depth varies nicely between practical experiences, experiments, and theoretical explorations - great insights into some aspects of Ethereum culture (at least a side of it)",
    author: "@tkstanczak",
    source: "X",
    timestamp: parseDate("2025-12-14"),
    url: "https://x.com/tkstanczak/status/2001418974513246279",
  },
  {
    id: "12",
    category: "orgs" as Category,
    title: "Devconnect Argentina Recap",
    snippet:
      "Devconnect Buenos Aires drew 14000+ attendees from 130+ countries featuring World's Fair format at La Rural with 80+ exhibitors.",
    author: "Devcon Team",
    source: "Ethereum Foundation",
    timestamp: parseDate("2025-12-12"),
    url: "https://blog.ethereum.org/2025/12/04/devconnect-arg-wrap",
  },
  {
    id: "24",
    category: "events" as Category,
    title: "Logos Circle Barcelona #3",
    snippet: "Thursday, Nov 6 · 6:30 PM to 8:30 PM CET",
    author: "AKASHA Hub B.",
    source: "Meetup",
    timestamp: parseDate("2025-12-10"),
    url: "https://www.meetup.com/akashabarcelona/events/311885481/",
  },
  {
    id: "37",
    category: "projects" as Category,
    title: "World of Dypians",
    snippet:
      "Experience unique gameplay and explore a world without end in a quest to form your destiny.",
    author: "DappRadar",
    source: "DappRadar",
    timestamp: parseDate("2025-12-08"),
    url: "https://dappradar.com/dapp/world-of-dypians",
  },
  {
    id: "31",
    category: "media" as Category,
    title:
      "Ethereum co-founder on ETH treasury strategy and the crypto's utility",
    snippet:
      "Joe Lubin, Ethereum co-founder, joins 'Squawk Box' to discuss what's going on with Ethereum, the treasury strategy and much more.",
    author: "CNBC Television",
    source: "YouTube",
    timestamp: parseDate("2025-12-06"),
    url: "https://youtu.be/UTz572Drfqw",
  },
  {
    id: "3",
    category: "news" as Category,
    title: "Synthetix returns to Ethereum mainnet after 3 years",
    snippet:
      "Synthetix founder Kain Warwick announces return to Ethereum L1 for perpetuals trading citing reduced gas fees and improved network capacity.",
    author: "Ciaran Lyons",
    source: "Cointelegraph",
    timestamp: parseDate("2025-12-04"),
    url: "https://cointelegraph.com/news/synthetix-ethereum-mainnet-return-kain-warwick-bullish-eth",
  },
  {
    id: "42",
    category: "people" as Category,
    title: "",
    snippet:
      "The future: I think tribes and zones will mostly cooperate, not merge. And hopefully they can give people more options where to be, redistribute global talent, and improve our institutions and our culture.",
    author: "vitalik.eth @VitalikButerin",
    source: "X",
    timestamp: parseDate("2025-12-02"),
    url: "https://x.com/VitalikButerin/status/2001368501072822480",
  },
  {
    id: "19",
    category: "orgs" as Category,
    title:
      "Decentralized Autonomous Worlds: AKASHA's Keynote at ETH Bucharest 2024",
    snippet:
      "ETH Bucharest 2024: Mihai Alisie discusses Ethereum's inception, maximum viable decentralization, legal hacking, and smarter communities.",
    author: "Wass B.",
    source: "AKASHA Foundation",
    timestamp: parseDate("2024-11-30"),
    url: "https://blog.akasha.org/akasha-keynote-eth-bucharest-2024/",
  },
  {
    id: "23",
    category: "events" as Category,
    title: "Ethereum Culture Day by ETHPrague",
    snippet: "Thursday, November 20 2:00 PM - 7:00 PM GMT-3",
    author: "Multiple",
    source: "Luma",
    timestamp: parseDate("2025-11-28"),
    url: "https://luma.com/tpsd95u6?tk=ktVBhF",
  },
  {
    id: "35",
    category: "projects" as Category,
    title: "Dapp Learning",
    snippet:
      "Dapp learning project for developers at all stages. Becoming and cultivating sovereign individuals. Nonprofit organization.",
    author: "Pensieve",
    source: "ECF",
    timestamp: parseDate("2025-11-26"),
    url: "https://pensieve.ecf.network/project/119",
  },
  {
    id: "30",
    category: "media" as Category,
    title: "Ethereum in 30 minutes by Vitalik Buterin | Devcon SEA",
    snippet:
      'Vitalik Buterin opens Devcon with a comprehensive overview of Ethereum\'s evolution as a decentralized "world computer," explaining layer 1 trust and layer 2 scaling solutions, emphasizing improvements in decentralization and encouraging developers to build innovative applications.',
    author: "Ethereum Foundation",
    source: "YouTube",
    timestamp: parseDate("2024-11-24"),
    url: "https://youtu.be/ei3tDRMjw6k",
  },
  {
    id: "7",
    category: "news" as Category,
    title: "Most Influential: Hsiao-Wei Wang and Tomasz K. Stańczak",
    snippet:
      "The Ethereum Foundation's new leaders hope to bring in a new era for the second-largest cryptocurrency.",
    author: "Margaux Nijkerk",
    source: "CoinDesk",
    timestamp: parseDate("2025-11-22"),
    url: "https://www.coindesk.com/tech/2025/12/19/most-influential-hsiao-wei-wang-and-tomasz-k-stanczak",
  },
  {
    id: "47",
    category: "people" as Category,
    title: "",
    snippet:
      "Privacy is not a nice add on. It is a basic need, especially in our highly exposed lives on the internet.",
    author: "@AyaMiyagotchi",
    source: "X",
    timestamp: parseDate("2025-11-20"),
    url: "https://x.com/AyaMiyagotchi/status/1990913495576052203",
  },
  {
    id: "17",
    category: "orgs" as Category,
    title: "ETH10X Celebration: Honoring A Decade of Ethereum",
    snippet:
      "At ETH10X, Ethereum co-founders received the first Swiss Blockchain Award for 'Lifetime Achievement'. This historic moment at CV Summit 2024 honored their decade-long impact on blockchain tech and Zug's role as \"Crypto Valley\".",
    author: "Wass B.",
    source: "AKASHA Foundation",
    timestamp: parseDate("2024-11-18"),
    url: "https://blog.akasha.org/eth10x-celebration-decade-of-ethereum/",
  },
  {
    id: "25",
    category: "events" as Category,
    title: "Meet Enterprise Ethereum Alliance",
    snippet: "Fri, Jul 21, 2023 · 6:00 PM to 8:00 PM CEST",
    author: "Ethereum Zurich",
    source: "Meetup",
    timestamp: parseDate("2025-11-16"),
    url: "https://www.meetup.com/ethereum-zurich/events/294884660/?eventOrigin=group_past_events",
  },
  {
    id: "40",
    category: "projects" as Category,
    title: "Decentraland",
    snippet:
      "A community-driven virtual world where you can connect, explore, and create! Decentraland 2.0 Beta out NOW",
    author: "DappRadar",
    source: "DappRadar",
    timestamp: parseDate("2025-11-14"),
    url: "https://dappradar.com/dapp/decentraland",
  },
  {
    id: "29",
    category: "media" as Category,
    title: "Next 10 Years of Ethereum by Fede - Devconnect",
    snippet: "The Next 10 Years of Ethereum: Verifiable Future",
    author: "Ethereum Foundation",
    source: "YouTube",
    timestamp: parseDate("2025-11-12"),
    url: "https://youtu.be/2E-0DF0tFbc",
  },
  {
    id: "4",
    category: "news" as Category,
    title: "Ethereum's Glamsterdam upgrade aims to fix MEV fairness",
    snippet:
      "Ethereum developers plan 2026 Glamsterdam upgrade featuring enshrined Proposer-Builder Separation to reduce MEV manipulation risks.",
    author: "Margaux Nijkerk",
    source: "CoinDesk",
    timestamp: parseDate("2025-11-10"),
    url: "https://www.coindesk.com/tech/2025/12/20/ethereum-s-glamsterdam-upgrade-aims-to-fix-mev-fairness",
  },
  {
    id: "50",
    category: "people" as Category,
    title: "",
    snippet: "Ethereum in Manhattan",
    author: "@tkstanczak",
    source: "X",
    timestamp: parseDate("2025-11-08"),
    url: "https://x.com/tkstanczak/status/1999578667840610516",
  },
  {
    id: "16",
    category: "orgs" as Category,
    title: "AKASHA Around The World #6",
    snippet:
      "Monthly dispatch covering AKASHA's global hub network celebrating Ethereum's 10-year anniversary with events across Zug Barcelona Rome and Cluj.",
    author: "Wass B.",
    source: "AKASHA Foundation",
    timestamp: parseDate("2025-11-06"),
    url: "https://blog.akasha.org/akasha-around-the-world-6/",
  },
  {
    id: "21",
    category: "events" as Category,
    title: "Global Ethereum Communities Meet LATAM",
    snippet: "Saturday, November 15 12:00 PM - 1:30 PM GMT-3",
    author: "ETHCluj",
    source: "Luma",
    timestamp: parseDate("2025-11-04"),
    url: "https://luma.com/o12kekyr?tk=ycH1uD",
  },
  {
    id: "34",
    category: "projects" as Category,
    title: "Web3Radio",
    snippet: "the first decentralized webradio, for communities",
    author: "Pensieve",
    source: "ECF",
    timestamp: parseDate("2025-11-02"),
    url: "https://pensieve.ecf.network/project/6",
  },
  {
    id: "28",
    category: "media" as Category,
    title: "Devconnect ARG Closing Happy Hour & Big Announcement",
    snippet:
      "Devconnect in Buenos Aires livestreaming from the Music Stage for the Closing Happy Hour& Big Announcement.",
    author: "Ethereum Foundation",
    source: "YouTube",
    timestamp: parseDate("2025-10-30"),
    url: "https://www.youtube.com/live/1E9Nkkfg_38?si=TFUI11RuiA3HwqCc",
  },
  {
    id: "5",
    category: "news" as Category,
    title:
      "Ethereum Activates Fusaka Upgrade Aiming to Cut Node Costs Speed Layer-2 Settlements",
    snippet:
      "Ethereum's Fusaka upgrade introduces PeerDAS allowing validators to verify data slices rather than full blobs reducing costs for L2 networks.",
    author: "Margaux Nijkerk",
    source: "CoinDesk",
    timestamp: parseDate("2025-10-28"),
    url: "https://www.coindesk.com/tech/2025/12/03/ethereum-activates-fusaka-upgrade-aiming-to-cut-node-costs-speed-layer-2-settlements",
  },
  {
    id: "43",
    category: "people" as Category,
    title: "",
    snippet:
      "The fact that we have political systems that do byzantine things instead of just charging a basic tax per litre of fuel to account for environmental costs continues to frustrate me. Policy should tell consumers what to optimize for, not how to optimize for it.",
    author: "vitalik.eth @VitalikButerin",
    source: "X",
    timestamp: parseDate("2025-10-26"),
    url: "https://x.com/VitalikButerin/status/1996997278893044045",
  },
  {
    id: "13",
    category: "orgs" as Category,
    title: "The Ethereum Foundation's Commitment to Privacy",
    snippet: "Privacy is for everyone",
    author: "Ethereum Foundation Team",
    source: "Ethereum Foundation",
    timestamp: parseDate("2025-10-24"),
    url: "https://blog.ethereum.org/2025/10/08/privacy-commitment",
  },
  {
    id: "26",
    category: "events" as Category,
    title: "Ethereum Account Abstraction (Register Link Inside)",
    snippet: "Thu, Apr 13, 2023 · 6:00 PM to 9:00 PM CEST",
    author: "Ethereum Zurich",
    source: "Meetup",
    timestamp: parseDate("2025-10-22"),
    url: "https://www.meetup.com/ethereum-zurich/events/292504588/?eventOrigin=group_past_events",
  },
  {
    id: "36",
    category: "projects" as Category,
    title: "Project Mocha",
    snippet: "Turning Coffee Consumers to Coffee Investors",
    author: "Pensieve",
    source: "ECF",
    timestamp: parseDate("2025-10-20"),
    url: "https://pensieve.ecf.network/project/88",
  },
  {
    id: "6",
    category: "news" as Category,
    title:
      "Ethereum's 'Fusaka' Upgrade Cements Network's Role as On-Chain Finance Settlement Layer: Bitwise",
    snippet:
      "The upgrade will boost throughput, keep validators efficient and, most importantly, strengthen Ethereum's value capture by putting a floor under blob fees.",
    author: "Will Canny, AI Boost",
    source: "CoinDesk",
    timestamp: parseDate("2025-10-18"),
    url: "https://www.coindesk.com/tech/2025/12/03/fusaka-cementing-ethereum-s-role-as-on-chain-finance-settlement-layer-bitwise",
  },
  {
    id: "48",
    category: "people" as Category,
    title: "",
    snippet:
      'As Ethereum matures, new bridges are forming between open networks and public institutions. The 10th anniversary year of Ethereum and Singapore FinTech Festival will host "Ethereum in the Spotlight", exploring how open networks can reach institutional adoption.',
    author: "@AyaMiyagotchi",
    source: "X",
    timestamp: parseDate("2025-10-16"),
    url: "https://x.com/AyaMiyagotchi/status/1986059165551456467",
  },
  {
    id: "11",
    category: "orgs" as Category,
    title: "The Future of Ethereum's State",
    snippet:
      "Ethereum Foundation explores state growth challenges and proposes solutions including state expiry archives and partial statelessness.",
    author: "Wei Han Ng and Carlos Pérez",
    source: "Ethereum Foundation",
    timestamp: parseDate("2025-10-14"),
    url: "https://blog.ethereum.org/2025/12/16/future-of-state",
  },
  {
    id: "27",
    category: "events" as Category,
    title: "Let's Talk About DAOs",
    snippet: "Wed, Oct 11, 2023, 6:00 PM",
    author: "Ethereum Denver",
    source: "Meetup",
    timestamp: parseDate("2025-10-12"),
    url: "https://www.meetup.com/ethereum-denver/events/296183830/?eventOrigin=group_past_events",
  },
  {
    id: "38",
    category: "projects" as Category,
    title: "Guild of Guardians Heroes",
    snippet: "NFT collection by Guild of Guardians",
    author: "DappRadar",
    source: "DappRadar",
    timestamp: parseDate("2025-10-10"),
    url: "https://dappradar.com/nft-collection/guild-of-guardians-heroes-1",
  },
  {
    id: "8",
    category: "news" as Category,
    title:
      "Ethereum must become simpler to achieve true trustlessness: Buterin",
    snippet:
      'Vitalik Buterin says Ethereum needs to boost the number of people who can understand the entire blockchain, and it can "get better at this by making the protocol simpler."',
    author: "Stephen Katte",
    source: "Cointelegraph",
    timestamp: parseDate("2025-10-08"),
    url: "https://cointelegraph.com/news/ethereum-simplify-trustless-user-experience-buterin",
  },
  {
    id: "41",
    category: "people" as Category,
    title: "",
    snippet:
      "Wonderland is a great team and has been very helpful in the Ethereum ecosystem, including to the EF on interop and Kohaku, and to many Ethereum projects.",
    author: "vitalik.eth @VitalikButerin",
    source: "X",
    timestamp: parseDate("2025-10-06"),
    url: "https://x.com/VitalikButerin/status/2001421862593585533",
  },
  {
    id: "14",
    category: "orgs" as Category,
    title: "10 years of Ethereum",
    snippet:
      "Joe Lubin reflects on Ethereum's 10-year journey from genesis block to becoming foundational infrastructure for the decentralized global economy.",
    author: "Joe Lubin",
    source: "Consensys",
    timestamp: parseDate("2025-10-04"),
    url: "https://consensys.io/blog/10-years-of-ethereum",
  },
  {
    id: "20",
    category: "events" as Category,
    title: "Ethereum 10 Year Anniversary - ETHCluj",
    snippet:
      "ETHCluj hosts special evening celebrating 10 years since Ethereum's genesis block open to builders devs and crypto-curious community members.",
    author: "ETHCluj",
    source: "Luma",
    timestamp: parseDate("2025-10-02"),
    url: "https://luma.com/sfxc7yrs?tk=FfUCEB",
  },
  {
    id: "39",
    category: "projects" as Category,
    title: "Hooked",
    snippet:
      "The on-ramp layer for massive Web3 adoption to form the ecosystem of future community-owned economies.",
    author: "DappRadar",
    source: "DappRadar",
    timestamp: parseDate("2025-09-30"),
    url: "https://dappradar.com/dapp/hooked",
  },
  {
    id: "44",
    category: "people" as Category,
    title: "",
    snippet:
      "I hope Zcash resists the dark hand of token voting. Token voting is bad in all kinds of ways (see vitalik.eth.limo/general/2021/08/16/voting3.html). Privacy is exactly the sort of thing that will erode over time if left to the median token holder.",
    author: "vitalik.eth @VitalikButerin",
    source: "X",
    timestamp: parseDate("2025-09-28"),
    url: "https://x.com/VitalikButerin/status/1995063062165135675",
  },
  {
    id: "18",
    category: "orgs" as Category,
    title: "AKASHA at ETHRome 2024: Announcing the Urbe Hub",
    snippet:
      "AKASHA-Urbe hub announced at ETH Rome: a new Roma-based center to offer coworking, hackathons, and knowledge transfer for the Ethereum community.",
    author: "Wass B.",
    source: "AKASHA Foundation",
    timestamp: parseDate("2024-09-26"),
    url: "https://blog.akasha.org/akasha-urbe-hub-rome/",
  },
];

// Helper function to get posts sorted by timestamp (newest first)
export const getPostsSorted = (): Post[] => {
  return [...mockPosts].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );
};

// Helper function to get posts by category
export const getPostsByCategory = (category: Category | "all"): Post[] => {
  const sorted = getPostsSorted();
  if (category === "all") {
    return sorted;
  }
  return sorted.filter((post) => post.category === category);
};

// Mock featured posts - these would typically come from a different source
// For now, we'll just reference some posts from the main list
export const getFeaturedPosts = (): Post[] => {
  // Return posts with featured_level set in the CSV
  // Based on the CSV data, these are the featured posts:
  return mockPosts.filter(
    (post) =>
      post.id === "9" || // BlobKit grants (featured_level: 1)
      post.id === "12" || // Devconnect Argentina (featured_level: 2)
      post.id === "11" || // Future of Ethereum's State (featured_level: 2)
      post.id === "20", // Ethereum 10 Year Anniversary (featured_level: 2)
  );
};
