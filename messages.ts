import { Hono } from "hono";
import {
  CONTRACT_ADDRESSES,
  RPC_ENDPOINTS,
  CHAIN_IDS,
  ESCROW_ABI,
  NFT_MARKETPLACE_ABI,
  OrderStatus,
  OrderStatusLabels,
  Carrier,
  CarrierLabels,
  ListingType,
  TokenStandard,
  ListingStatus,
  getNetworkConfig,
  formatAvax,
  parseAvax,
} from "../services/contracts";

export const contractsRouter = new Hono();

type Network = 'fuji' | 'mainnet';

/**
 * Get contract configuration
 * GET /api/contracts/config
 */
contractsRouter.get("/config", (c) => {
  const network = (c.req.query("network") || 'fuji') as Network;

  return c.json({
    network,
    config: getNetworkConfig(network),
    enums: {
      OrderStatus,
      OrderStatusLabels,
      Carrier,
      CarrierLabels,
      ListingType,
      TokenStandard,
      ListingStatus,
    },
  });
});

/**
 * Get contract ABIs for client-side interaction
 * GET /api/contracts/abi
 */
contractsRouter.get("/abi", (c) => {
  return c.json({
    escrow: ESCROW_ABI,
    nftMarketplace: NFT_MARKETPLACE_ABI,
  });
});

/**
 * Get escrow contract address
 * GET /api/contracts/escrow/address
 */
contractsRouter.get("/escrow/address", (c) => {
  const network = (c.req.query("network") || 'fuji') as Network;
  const address = CONTRACT_ADDRESSES[network].escrow;

  if (!address) {
    return c.json({ error: "Contract not deployed on this network" }, 404);
  }

  return c.json({
    network,
    address,
    rpcUrl: RPC_ENDPOINTS[network],
    chainId: CHAIN_IDS[network],
  });
});

/**
 * Get NFT marketplace contract address
 * GET /api/contracts/nft-marketplace/address
 */
contractsRouter.get("/nft-marketplace/address", (c) => {
  const network = (c.req.query("network") || 'fuji') as Network;
  const address = CONTRACT_ADDRESSES[network].nftMarketplace;

  if (!address) {
    return c.json({ error: "Contract not deployed on this network" }, 404);
  }

  return c.json({
    network,
    address,
    rpcUrl: RPC_ENDPOINTS[network],
    chainId: CHAIN_IDS[network],
  });
});

/**
 * Calculate escrow fee
 * GET /api/contracts/escrow/calculate-fee
 */
contractsRouter.get("/escrow/calculate-fee", (c) => {
  const amountAvax = c.req.query("amount");

  if (!amountAvax) {
    return c.json({ error: "amount query parameter required" }, 400);
  }

  const amount = parseFloat(amountAvax);
  if (isNaN(amount) || amount <= 0) {
    return c.json({ error: "Invalid amount" }, 400);
  }

  // Default platform fee is 2.5% (250 basis points)
  const platformFeePercent = 250;
  const fee = amount * (platformFeePercent / 10000);
  const sellerReceives = amount - fee;

  return c.json({
    amount: amount.toFixed(6),
    platformFeePercent: platformFeePercent / 100,
    platformFee: fee.toFixed(6),
    sellerReceives: sellerReceives.toFixed(6),
    amountWei: parseAvax(amount),
    platformFeeWei: parseAvax(fee),
    sellerReceivesWei: parseAvax(sellerReceives),
  });
});

/**
 * Get order status label
 * GET /api/contracts/escrow/status/:statusCode
 */
contractsRouter.get("/escrow/status/:statusCode", (c) => {
  const statusCode = parseInt(c.req.param("statusCode"));

  if (isNaN(statusCode) || statusCode < 0 || statusCode > 9) {
    return c.json({ error: "Invalid status code" }, 400);
  }

  return c.json({
    code: statusCode,
    label: OrderStatusLabels[statusCode],
    canCancel: statusCode === OrderStatus.Funded,
    canShip: statusCode === OrderStatus.Funded,
    canConfirmDelivery: statusCode === OrderStatus.Shipped || statusCode === OrderStatus.InTransit,
    canOpenDispute: statusCode === OrderStatus.DisputeWindow,
    canComplete: statusCode === OrderStatus.DisputeWindow,
    isFinal: [OrderStatus.Completed, OrderStatus.Refunded, OrderStatus.Cancelled].includes(statusCode as 6 | 8 | 9),
  });
});

/**
 * Get carrier label
 * GET /api/contracts/escrow/carrier/:carrierCode
 */
contractsRouter.get("/escrow/carrier/:carrierCode", (c) => {
  const carrierCode = parseInt(c.req.param("carrierCode"));

  if (isNaN(carrierCode) || carrierCode < 0 || carrierCode > 4) {
    return c.json({ error: "Invalid carrier code" }, 400);
  }

  return c.json({
    code: carrierCode,
    label: CarrierLabels[carrierCode],
  });
});

/**
 * Helper: Format amount from wei to AVAX
 * POST /api/contracts/format-avax
 */
contractsRouter.post("/format-avax", async (c) => {
  const body = await c.req.json<{ wei: string }>();

  if (!body.wei) {
    return c.json({ error: "wei field required" }, 400);
  }

  try {
    return c.json({
      wei: body.wei,
      avax: formatAvax(body.wei),
    });
  } catch (e) {
    return c.json({ error: "Invalid wei value" }, 400);
  }
});

/**
 * Helper: Parse amount from AVAX to wei
 * POST /api/contracts/parse-avax
 */
contractsRouter.post("/parse-avax", async (c) => {
  const body = await c.req.json<{ avax: string | number }>();

  if (body.avax === undefined) {
    return c.json({ error: "avax field required" }, 400);
  }

  try {
    return c.json({
      avax: body.avax,
      wei: parseAvax(body.avax),
    });
  } catch (e) {
    return c.json({ error: "Invalid avax value" }, 400);
  }
});

/**
 * Get dispute window info
 * GET /api/contracts/escrow/dispute-window
 */
contractsRouter.get("/escrow/dispute-window", (c) => {
  const DISPUTE_WINDOW_SECONDS = 7 * 24 * 60 * 60; // 7 days

  return c.json({
    durationSeconds: DISPUTE_WINDOW_SECONDS,
    durationDays: 7,
    description: "Buyers have 7 days after delivery confirmation to open a dispute",
  });
});

/**
 * Get supported networks
 * GET /api/contracts/networks
 */
contractsRouter.get("/networks", (c) => {
  return c.json({
    networks: [
      {
        id: 'fuji',
        name: 'Avalanche Fuji Testnet',
        chainId: CHAIN_IDS.fuji,
        rpcUrl: RPC_ENDPOINTS.fuji,
        explorerUrl: 'https://testnet.snowtrace.io',
        faucet: 'https://faucet.avax.network/',
        isTestnet: true,
        escrowDeployed: !!CONTRACT_ADDRESSES.fuji.escrow,
        nftMarketplaceDeployed: !!CONTRACT_ADDRESSES.fuji.nftMarketplace,
      },
      {
        id: 'mainnet',
        name: 'Avalanche C-Chain',
        chainId: CHAIN_IDS.mainnet,
        rpcUrl: RPC_ENDPOINTS.mainnet,
        explorerUrl: 'https://snowtrace.io',
        faucet: null,
        isTestnet: false,
        escrowDeployed: !!CONTRACT_ADDRESSES.mainnet.escrow,
        nftMarketplaceDeployed: !!CONTRACT_ADDRESSES.mainnet.nftMarketplace,
      },
    ],
  });
});

/**
 * Get transaction helper for creating escrow order
 * POST /api/contracts/escrow/create-order-tx
 */
contractsRouter.post("/escrow/create-order-tx", async (c) => {
  const body = await c.req.json<{
    seller: string;
    itemDescription: string;
    shippingAddressHash: string;
    amountAvax: string;
    network?: Network;
  }>();

  const { seller, itemDescription, shippingAddressHash, amountAvax, network = 'fuji' } = body;

  if (!seller || !itemDescription || !shippingAddressHash || !amountAvax) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const config = getNetworkConfig(network);

  if (!config.escrowAddress) {
    return c.json({ error: "Escrow contract not deployed on this network" }, 404);
  }

  return c.json({
    to: config.escrowAddress,
    value: parseAvax(amountAvax),
    chainId: config.chainId,
    functionName: 'createOrder',
    args: [seller, itemDescription, shippingAddressHash],
    description: `Create escrow order for ${amountAvax} AVAX`,
  });
});

/**
 * Get transaction helper for shipping order
 * POST /api/contracts/escrow/ship-order-tx
 */
contractsRouter.post("/escrow/ship-order-tx", async (c) => {
  const body = await c.req.json<{
    orderId: number;
    carrier: number;
    trackingNumber: string;
    network?: Network;
  }>();

  const { orderId, carrier, trackingNumber, network = 'fuji' } = body;

  if (orderId === undefined || carrier === undefined || !trackingNumber) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const config = getNetworkConfig(network);

  if (!config.escrowAddress) {
    return c.json({ error: "Escrow contract not deployed on this network" }, 404);
  }

  return c.json({
    to: config.escrowAddress,
    chainId: config.chainId,
    functionName: 'shipOrder',
    args: [orderId, carrier, trackingNumber],
    description: `Ship order #${orderId} via ${CarrierLabels[carrier]} (${trackingNumber})`,
  });
});
