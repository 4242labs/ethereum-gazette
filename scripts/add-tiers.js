const fs = require('fs');
const path = require('path');

// Tier assignments based on SOURCE-TIERS.md analysis
const TIER_ASSIGNMENTS = {
  // Tier 1: Core Ethereum Sources (Auto-Approve)
  1: { tier: 1, autoApprove: true },   // Ethereum Foundation Blog
  2: { tier: 1, autoApprove: true },   // Week in Ethereum News
  7: { tier: 1, autoApprove: true },   // Vitalik Buterin's Blog
  23: { tier: 1, autoApprove: true },  // EthResearch
  26: { tier: 1, autoApprove: true },  // EF Grants
  37: { tier: 1, autoApprove: true },  // EthStaker

  // Tier 2: High-Relevance Sources (Keyword + Context Filtering)
  3: { tier: 2, autoApprove: false },  // CoinDesk Ethereum
  8: { tier: 2, autoApprove: false },  // ETH.Build Blog (disabled)
  9: { tier: 2, autoApprove: false },  // EthHub
  10: { tier: 2, autoApprove: false }, // Finematics
  11: { tier: 2, autoApprove: false }, // Uniswap Blog
  12: { tier: 2, autoApprove: false }, // Aave Blog
  13: { tier: 2, autoApprove: false }, // Lido Blog
  14: { tier: 2, autoApprove: false }, // MakerDAO Blog
  15: { tier: 2, autoApprove: false }, // Optimism Blog
  16: { tier: 2, autoApprove: false }, // Arbitrum Blog
  18: { tier: 2, autoApprove: false }, // Bankless
  22: { tier: 2, autoApprove: false }, // Reddit r/ethereum
  24: { tier: 2, autoApprove: false }, // Ethereum Magicians
  27: { tier: 2, autoApprove: false }, // MakerDAO Governance
  35: { tier: 2, autoApprove: false }, // The Defiant
  38: { tier: 2, autoApprove: false }, // StarkWare Blog
  39: { tier: 2, autoApprove: false }, // zkSync Blog
  40: { tier: 2, autoApprove: false }, // Scroll Blog
  41: { tier: 2, autoApprove: false }, // Alchemy Blog
  42: { tier: 2, autoApprove: false }, // Ethereum Cat Herders

  // Tier 3: Ecosystem Sources (LLM Classification Required)
  4: { tier: 3, autoApprove: false },  // The Block (disabled)
  5: { tier: 3, autoApprove: false },  // Decrypt (disabled)
  6: { tier: 3, autoApprove: false },  // Cointelegraph (disabled)
  17: { tier: 3, autoApprove: false }, // ETHGlobal Events (disabled)
  19: { tier: 3, autoApprove: false }, // Unchained Podcast
  20: { tier: 3, autoApprove: false }, // Zero Knowledge Podcast
  21: { tier: 3, autoApprove: false }, // Epicenter Podcast
  25: { tier: 3, autoApprove: false }, // Gitcoin Blog
  28: { tier: 3, autoApprove: false }, // Uniswap Governance
  29: { tier: 3, autoApprove: false }, // ENS DAO
  30: { tier: 3, autoApprove: false }, // ConsenSys
  31: { tier: 3, autoApprove: false }, // Crypto Jobs List
  32: { tier: 3, autoApprove: false }, // Web3 Career
  33: { tier: 3, autoApprove: false }, // Polygon Blog (disabled)
  34: { tier: 3, autoApprove: false }, // Chainlink Blog (disabled)
  36: { tier: 3, autoApprove: false }, // Messari (disabled)
};

function addTiersToSources() {
  try {
    // Read the current feed-sources.json
    const filePath = path.join(__dirname, '..', 'data', 'feed-sources.json');
    console.log(`Reading ${filePath}...`);

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    console.log(`Loaded ${data.sources.length} sources`);

    // Add tier metadata to each source
    let tierCounts = { tier1: 0, tier2: 0, tier3: 0, unassigned: 0 };

    data.sources = data.sources.map(source => {
      const tierInfo = TIER_ASSIGNMENTS[source.id];

      if (tierInfo) {
        source.tier = tierInfo.tier;
        source.autoApprove = tierInfo.autoApprove;

        // Count tier assignments
        if (tierInfo.tier === 1) tierCounts.tier1++;
        else if (tierInfo.tier === 2) tierCounts.tier2++;
        else if (tierInfo.tier === 3) tierCounts.tier3++;

        console.log(`✅ Source ${source.id} (${source.name}) → Tier ${tierInfo.tier} ${tierInfo.autoApprove ? '(auto-approve)' : '(filtered)'}`);
      } else {
        tierCounts.unassigned++;
        console.log(`⚠️  Source ${source.id} (${source.name}) → No tier assigned`);
      }

      return source;
    });

    // Update metadata
    data.lastUpdated = new Date().toISOString();
    data.notes = {
      ...data.notes,
      "method3_status": "Phase 1 implemented - Source tiering active",
      "tier_distribution": `Tier 1: ${tierCounts.tier1} sources (auto-approve), Tier 2: ${tierCounts.tier2} sources (keyword filter), Tier 3: ${tierCounts.tier3} sources (LLM filter)`,
      "auto_approve_count": tierCounts.tier1
    };

    // Write updated file
    console.log('\nWriting updated feed-sources.json...');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log('\n🎉 Source tier metadata added successfully!');
    console.log(`📈 Tier distribution:`);
    console.log(`   Tier 1 (Auto-approve): ${tierCounts.tier1} sources`);
    console.log(`   Tier 2 (Keyword filter): ${tierCounts.tier2} sources`);
    console.log(`   Tier 3 (LLM filter): ${tierCounts.tier3} sources`);
    console.log(`   Unassigned: ${tierCounts.unassigned} sources`);

    return true;

  } catch (error) {
    console.error('❌ Error adding tier metadata:', error.message);
    return false;
  }
}

// Run the script
if (require.main === module) {
  const success = addTiersToSources();
  process.exit(success ? 0 : 1);
}

module.exports = { addTiersToSources };
