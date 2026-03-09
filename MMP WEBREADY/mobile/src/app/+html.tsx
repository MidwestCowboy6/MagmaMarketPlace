import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* App title & description */}
        <title>Magma Marketplace</title>
        <meta name="description" content="Trade NFT collectibles securely on Avalanche. Escrow-protected trades, seller ratings, and full wallet integration." />
        <meta name="theme-color" content="#f97316" />

        {/* PWA - makes it installable from browser on any device */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="Magma Marketplace" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Magma Market" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Social sharing previews */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Magma Marketplace" />
        <meta property="og:description" content="Trade NFT collectibles securely on Avalanche." />
        <meta property="og:site_name" content="Magma Marketplace" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Magma Marketplace" />
        <meta name="twitter:description" content="Trade NFT collectibles securely on Avalanche." />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: webStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const webStyles = `
  * { box-sizing: border-box; }

  body {
    background-color: #000000;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  /* On desktop, center the app and give it a phone-like frame */
  @media (min-width: 768px) {
    body {
      background: radial-gradient(ellipse at center, #1c0a00 0%, #000000 70%);
    }
    #root {
      max-width: 480px;
      margin: 0 auto;
      min-height: 100vh;
      box-shadow: 0 0 80px rgba(249, 115, 22, 0.2), 0 0 160px rgba(249, 115, 22, 0.05);
      position: relative;
    }
  }

  /* Scrollbars */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #000; }
  ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 2px; }

  /* Mobile web feel */
  * { -webkit-tap-highlight-color: transparent; }
  button, [role="button"] {
    user-select: none;
    -webkit-user-select: none;
  }
`;
