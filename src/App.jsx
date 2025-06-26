// =====================
// NETWORK CONFIGURATION
// =====================
const NETWORKS = {
  optimism: {
    name: 'Optimism',
    chainId: 10,
    defaultRpc: 'https://optimism-rpc.publicnode.com',
    explorer: 'https://optimistic.etherscan.io',
    currency: 'ETH',
    contracts: {
      xenft: '0xAF18644083151cf57F914CCCc23c42A1892C218e'
    }
  },
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    defaultRpc: 'https://ethereum-rpc.publicnode.com',
    explorer: 'https://etherscan.io',
    currency: 'ETH',
    contracts: {
      xenft: '0x06450dEe7FD2Fb8E39061434BAbCFC05599a6Fb8'
    }
  },
  base: {
    name: 'Base',
    chainId: 8453,
    defaultRpc: 'https://base-rpc.publicnode.com',
    explorer: 'https://basescan.org',
    currency: 'ETH',
    contracts: {
      xenft: '0x379002701BF6f2862e3dFdd1f96d3C5E1BF450B6'
    }
  },
  polygon: {
    name: 'Polygon (MXEN)',
    chainId: 137,
    defaultRpc: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    currency: 'MATIC',
    contracts: {
      xenft: '0x2A0c0DBEcC7E4D658f48E01e3fA353F44050c208', // MXEN contract
      mxen: '0x2A0c0DBEcC7E4D658f48E01e3fA353F44050c208'  // Same as xenft
    }
  }
};

// =================
// ALCHEMY API KEYS
// =================
const ALCHEMY_KEYS = {
  ethereum: import.meta.env.VITE_ALCHEMY_ETHEREUM_KEY || "8dASJbrbZeVybFKSf3HWqgLu3uFhskOL",
  optimism: import.meta.env.VITE_ALCHEMY_OPTIMISM_KEY || "8dASJbrbZeVybFKSf3HWqgLu3uFhskOL",  
  base: import.meta.env.VITE_ALCHEMY_BASE_KEY || "8dASJbrbZeVybFKSf3HWqgLu3uFhskOL",
  polygon: import.meta.env.VITE_ALCHEMY_POLYGON_KEY || "8dASJbrbZeVybFKSf3HWqgLu3uFhskOL"
};

// =====================
// GAS PRICE FUNCTIONS
// =====================
const fetchPolygonGas = async () => {
  try {
    const response = await fetch(`https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEYS.polygon}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 1
      })
    });

    const data = await response.json();
    if (data.result) {
      const gasPriceWei = parseInt(data.result, 16);
      const gasPriceGwei = gasPriceWei / 1e9;

      return {
        fast: (gasPriceGwei * 1.2).toFixed(2),
        standard: gasPriceGwei.toFixed(2),
        safe: (gasPriceGwei * 0.8).toFixed(2),
        loading: false
      };
    }
  } catch (error) {
    console.error('Alchemy Polygon gas fetch failed:', error);
  }

  return {
    fast: '50',
    standard: '40',
    safe: '30',
    loading: false
  };
};

const fetchAllGasPrices = async () => {
  setGasPrices(prev => ({
    optimism: { ...prev.optimism, loading: true },
    ethereum: { ...prev.ethereum, loading: true },
    base: { ...prev.base, loading: true },
    polygon: { ...prev.polygon, loading: true }
  }));

  try {
    const [optGas, ethGas, baseGas, polygonGas] = await Promise.allSettled([
      fetchOptimismGas(),
      fetchEthereumGas(),
      fetchBaseGas(),
      fetchPolygonGas()
    ]);

    setGasPrices({
      optimism: optGas.status === 'fulfilled' ? optGas.value : { fast: '0.001', standard: '0.001', safe: '0.001', loading: false },
      ethereum: ethGas.status === 'fulfilled' ? ethGas.value : { fast: '25', standard: '20', safe: '15', loading: false },
      base: baseGas.status === 'fulfilled' ? baseGas.value : { fast: '0.01', standard: '0.008', safe: '0.005', loading: false },
      polygon: polygonGas.status === 'fulfilled' ? polygonGas.value : { fast: '50', standard: '40', safe: '30', loading: false }
    });

    setGasUpdateTime(new Date());
  } catch (error) {
    console.error('Failed to fetch gas prices:', error);
  }
};

// ==========================
// CONTRACT ADDRESS RESOLVER
// ==========================
const getCurrentContractAddress = () => {
  // MXEN and XENFT use same contract on Polygon
  return NETWORKS[selectedNetwork].contracts.xenft;
};

// =====================
// NETWORK SELECTOR UI
// =====================
const NetworkSelector = () => (
  <div className="network-selector">
    <select
      value={selectedNetwork}
      onChange={(e) => setSelectedNetwork(e.target.value)}
      className="network-select"
    >
      {Object.entries(NETWORKS).map(([key, network]) => (
        <option key={key} value={key}>
          {network.name}
        </option>
      ))}
    </select>
    {/* ... rest of your NetworkSelector component ... */}
  </div>
);

// =====================
// GAS COLOR CODING
// =====================
const getGasColor = (network) => {
  const standard = parseFloat(currentGas.standard || 0);
  
  if (network === 'optimism') return '#10b981';
  if (network === 'base') return '#eab308';
  if (network === 'polygon') {
    if (standard < 30) return '#10b981';
    if (standard < 60) return '#eab308';
    return '#ef4444';
  }
  if (network === 'ethereum') {
    if (standard < 20) return '#10b981';
    if (standard < 50) return '#eab308';
    return '#ef4444';
  }
  return '#6b7280';
};
