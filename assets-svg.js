// assets-svg.js — Neon liquid glass SVG illustrations for service cards
// Each returns an SVG string. Embedded inline, no external host needed.

var ServiceImages = {

  // Landing page — browser with neon glow
  'landing-page': `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg1" cx="50%" cy="50%"><stop offset="0%" stop-color="#0f0c2e"/><stop offset="100%" stop-color="#050510"/></radialGradient>
      <radialGradient id="glow1" cx="50%" cy="50%"><stop offset="0%" stop-color="#F97316" stop-opacity="0.4"/><stop offset="100%" stop-color="#F97316" stop-opacity="0"/></radialGradient>
      <filter id="blur1"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>
      <linearGradient id="glass1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(255,255,255,0.12)"/><stop offset="100%" stop-color="rgba(255,255,255,0.02)"/></linearGradient>
    </defs>
    <rect width="280" height="180" fill="url(#bg1)"/>
    <!-- glow orbs -->
    <ellipse cx="200" cy="60" rx="80" ry="60" fill="url(#glow1)" filter="url(#blur1)"/>
    <ellipse cx="80" cy="130" rx="60" ry="40" fill="#6366F1" fill-opacity="0.15" filter="url(#blur1)"/>
    <!-- browser frame -->
    <rect x="30" y="30" width="220" height="130" rx="10" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <rect x="30" y="30" width="220" height="26" rx="10" fill="rgba(255,255,255,0.07)"/>
    <rect x="30" y="44" width="220" height="12" fill="rgba(255,255,255,0.07)"/>
    <!-- traffic lights -->
    <circle cx="46" cy="43" r="4" fill="#EF4444" fill-opacity="0.8"/>
    <circle cx="60" cy="43" r="4" fill="#F59E0B" fill-opacity="0.8"/>
    <circle cx="74" cy="43" r="4" fill="#10B981" fill-opacity="0.8"/>
    <!-- address bar -->
    <rect x="90" y="37" width="120" height="12" rx="6" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
    <text x="150" y="47" fill="rgba(255,255,255,0.4)" font-size="7" text-anchor="middle" font-family="monospace">forsync.vercel.app</text>
    <!-- hero section mock -->
    <rect x="40" y="65" width="200" height="85" rx="4" fill="rgba(255,255,255,0.02)"/>
    <rect x="55" y="80" width="90" height="8" rx="4" fill="rgba(249,115,22,0.6)" filter="url(#blur2)"/>
    <rect x="55" y="80" width="90" height="8" rx="4" fill="#F97316" fill-opacity="0.9"/>
    <rect x="55" y="94" width="130" height="5" rx="2" fill="rgba(255,255,255,0.15)"/>
    <rect x="55" y="104" width="110" height="5" rx="2" fill="rgba(255,255,255,0.1)"/>
    <rect x="55" y="118" width="50" height="14" rx="7" fill="#F97316" fill-opacity="0.9"/>
    <rect x="112" y="118" width="50" height="14" rx="7" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
    <!-- floating card -->
    <rect x="165" y="75" width="65" height="60" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(249,115,22,0.3)" stroke-width="1" filter="url(#blur2)"/>
    <rect x="165" y="75" width="65" height="60" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(249,115,22,0.25)" stroke-width="1"/>
    <circle cx="197" cy="97" r="12" fill="rgba(249,115,22,0.2)" stroke="rgba(249,115,22,0.5)" stroke-width="1"/>
    <text x="197" y="101" fill="#F97316" font-size="10" text-anchor="middle">✦</text>
    <rect x="177" y="114" width="40" height="4" rx="2" fill="rgba(255,255,255,0.2)"/>
    <rect x="182" y="121" width="30" height="3" rx="1" fill="rgba(255,255,255,0.1)"/>
    <!-- neon line -->
    <line x1="30" y1="56" x2="250" y2="56" stroke="rgba(249,115,22,0.15)" stroke-width="0.5"/>
  </svg>`,

  // Ecommerce — floating product cards
  'tienda-virtual': `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg2" cx="30%" cy="40%"><stop offset="0%" stop-color="#0a0520"/><stop offset="100%" stop-color="#050510"/></radialGradient>
      <radialGradient id="glow2" cx="50%" cy="50%"><stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.5"/><stop offset="100%" stop-color="#8B5CF6" stop-opacity="0"/></radialGradient>
      <filter id="blurE"><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="blurE2"><feGaussianBlur stdDeviation="2"/></filter>
    </defs>
    <rect width="280" height="180" fill="url(#bg2)"/>
    <ellipse cx="140" cy="90" rx="100" ry="70" fill="url(#glow2)" filter="url(#blurE)"/>
    <ellipse cx="240" cy="150" rx="50" ry="35" fill="#F97316" fill-opacity="0.12" filter="url(#blurE)"/>
    <!-- main card -->
    <rect x="20" y="20" width="100" height="130" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(139,92,246,0.35)" stroke-width="1"/>
    <rect x="20" y="20" width="100" height="70" rx="12" fill="rgba(139,92,246,0.1)"/>
    <rect x="20" y="78" width="100" height="12" fill="rgba(139,92,246,0.1)"/>
    <text x="70" y="62" fill="#8B5CF6" font-size="28" text-anchor="middle" fill-opacity="0.8">◈</text>
    <rect x="30" y="100" width="60" height="6" rx="3" fill="rgba(255,255,255,0.25)"/>
    <rect x="30" y="112" width="40" height="5" rx="2" fill="rgba(255,255,255,0.12)"/>
    <rect x="30" y="124" width="50" height="14" rx="7" fill="#8B5CF6" fill-opacity="0.8"/>
    <!-- second card (shifted) -->
    <rect x="100" y="35" width="90" height="120" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(249,115,22,0.3)" stroke-width="1"/>
    <rect x="100" y="35" width="90" height="62" rx="12" fill="rgba(249,115,22,0.1)"/>
    <rect x="100" y="83" width="90" height="12" fill="rgba(249,115,22,0.1)"/>
    <text x="145" y="72" fill="#F97316" font-size="28" text-anchor="middle" fill-opacity="0.9">⬡</text>
    <rect x="112" y="105" width="55" height="6" rx="3" fill="rgba(255,255,255,0.25)"/>
    <rect x="112" y="117" width="38" height="5" rx="2" fill="rgba(255,255,255,0.12)"/>
    <rect x="112" y="129" width="55" height="14" rx="7" fill="#F97316" fill-opacity="0.8"/>
    <!-- third card -->
    <rect x="170" y="25" width="85" height="115" rx="12" fill="rgba(255,255,255,0.04)" stroke="rgba(16,185,129,0.3)" stroke-width="1"/>
    <rect x="170" y="25" width="85" height="60" rx="12" fill="rgba(16,185,129,0.08)"/>
    <rect x="170" y="73" width="85" height="12" fill="rgba(16,185,129,0.08)"/>
    <text x="212" y="60" fill="#10B981" font-size="26" text-anchor="middle" fill-opacity="0.9">✦</text>
    <rect x="180" y="97" width="55" height="6" rx="3" fill="rgba(255,255,255,0.2)"/>
    <rect x="180" y="109" width="38" height="5" rx="2" fill="rgba(255,255,255,0.1)"/>
    <!-- cart badge -->
    <circle cx="248" cy="28" r="14" fill="rgba(249,115,22,0.15)" stroke="rgba(249,115,22,0.4)" stroke-width="1"/>
    <text x="248" y="33" fill="#F97316" font-size="12" text-anchor="middle">🛒</text>
    <circle cx="258" cy="18" r="6" fill="#EF4444"/>
    <text x="258" y="22" fill="white" font-size="7" text-anchor="middle" font-weight="bold">3</text>
  </svg>`,

  // App / Dashboard — data viz
  'app-dashboard': `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg3" cx="50%" cy="0%"><stop offset="0%" stop-color="#061528"/><stop offset="100%" stop-color="#050510"/></radialGradient>
      <linearGradient id="bar1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#4F46E5" stop-opacity="0.3"/></linearGradient>
      <linearGradient id="bar2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F97316"/><stop offset="100%" stop-color="#DC2626" stop-opacity="0.3"/></linearGradient>
      <linearGradient id="bar3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#10B981"/><stop offset="100%" stop-color="#059669" stop-opacity="0.3"/></linearGradient>
      <filter id="blurD"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <rect width="280" height="180" fill="url(#bg3)"/>
    <!-- glow -->
    <ellipse cx="70" cy="90" rx="60" ry="50" fill="#6366F1" fill-opacity="0.12" filter="url(#blurD)"/>
    <ellipse cx="220" cy="60" rx="50" ry="40" fill="#F97316" fill-opacity="0.1" filter="url(#blurD)"/>
    <!-- sidebar -->
    <rect x="15" y="15" width="50" height="150" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <circle cx="40" cy="35" r="10" fill="rgba(99,102,241,0.3)" stroke="rgba(99,102,241,0.5)" stroke-width="1"/>
    <text x="40" y="39" fill="#6366F1" font-size="9" text-anchor="middle">◈</text>
    <rect x="24" y="55" width="32" height="5" rx="2" fill="rgba(255,255,255,0.08)"/>
    <rect x="24" y="66" width="32" height="5" rx="2" fill="rgba(249,115,22,0.4)"/>
    <rect x="24" y="77" width="32" height="5" rx="2" fill="rgba(255,255,255,0.06)"/>
    <rect x="24" y="88" width="32" height="5" rx="2" fill="rgba(255,255,255,0.06)"/>
    <rect x="24" y="99" width="32" height="5" rx="2" fill="rgba(255,255,255,0.06)"/>
    <!-- stat cards row -->
    <rect x="75" y="15" width="55" height="38" rx="6" fill="rgba(99,102,241,0.1)" stroke="rgba(99,102,241,0.2)" stroke-width="1"/>
    <text x="102" y="30" fill="#6366F1" font-size="7" text-anchor="middle" font-weight="600">VENTAS</text>
    <text x="102" y="44" fill="white" font-size="11" text-anchor="middle" font-weight="700">$2.4M</text>
    <rect x="136" y="15" width="55" height="38" rx="6" fill="rgba(249,115,22,0.1)" stroke="rgba(249,115,22,0.2)" stroke-width="1"/>
    <text x="163" y="30" fill="#F97316" font-size="7" text-anchor="middle" font-weight="600">PEDIDOS</text>
    <text x="163" y="44" fill="white" font-size="11" text-anchor="middle" font-weight="700">348</text>
    <rect x="197" y="15" width="68" height="38" rx="6" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.2)" stroke-width="1"/>
    <text x="231" y="30" fill="#10B981" font-size="7" text-anchor="middle" font-weight="600">USUARIOS</text>
    <text x="231" y="44" fill="white" font-size="11" text-anchor="middle" font-weight="700">1,204</text>
    <!-- chart area -->
    <rect x="75" y="60" width="190" height="90" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
    <!-- bars -->
    <rect x="90"  y="108" width="16" height="32" rx="3" fill="url(#bar1)" fill-opacity="0.8"/>
    <rect x="113" y="95"  width="16" height="45" rx="3" fill="url(#bar1)" fill-opacity="0.9"/>
    <rect x="136" y="102" width="16" height="38" rx="3" fill="url(#bar2)" fill-opacity="0.8"/>
    <rect x="159" y="85"  width="16" height="55" rx="3" fill="url(#bar2)" fill-opacity="0.9"/>
    <rect x="182" y="90"  width="16" height="50" rx="3" fill="url(#bar3)" fill-opacity="0.8"/>
    <rect x="205" y="75"  width="16" height="65" rx="3" fill="url(#bar3)" fill-opacity="0.9"/>
    <rect x="228" y="95"  width="16" height="45" rx="3" fill="url(#bar1)" fill-opacity="0.7"/>
    <!-- line overlay -->
    <polyline points="98,108 121,95 144,100 167,82 190,88 213,70 236,90"
      fill="none" stroke="#F97316" stroke-width="1.5" stroke-opacity="0.7"
      stroke-dasharray="none"/>
    <circle cx="213" cy="70" r="3" fill="#F97316"/>
    <!-- grid lines -->
    <line x1="80" y1="140" x2="260" y2="140" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
    <line x1="80" y1="120" x2="260" y2="120" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
    <line x1="80" y1="100" x2="260" y2="100" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
    <line x1="80" y1="80"  x2="260" y2="80"  stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/>
  </svg>`,

  // Web corporativa — clean corporate
  'web-corporativa': `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg4" cx="50%" cy="80%"><stop offset="0%" stop-color="#0a1520"/><stop offset="100%" stop-color="#050510"/></radialGradient>
      <filter id="blurC"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <rect width="280" height="180" fill="url(#bg4)"/>
    <ellipse cx="140" cy="160" rx="120" ry="60" fill="#6366F1" fill-opacity="0.1" filter="url(#blurC)"/>
    <ellipse cx="250" cy="40" rx="60" ry="40" fill="#F97316" fill-opacity="0.1" filter="url(#blurC)"/>
    <!-- nav -->
    <rect x="15" y="15" width="250" height="28" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <rect x="20" y="22" width="40" height="14" rx="3" fill="rgba(249,115,22,0.3)"/>
    <text x="40" y="33" fill="#F97316" font-size="8" text-anchor="middle" font-weight="700">CORP</text>
    <rect x="130" y="25" width="25" height="5" rx="2" fill="rgba(255,255,255,0.15)"/>
    <rect x="162" y="25" width="25" height="5" rx="2" fill="rgba(255,255,255,0.1)"/>
    <rect x="194" y="25" width="25" height="5" rx="2" fill="rgba(255,255,255,0.1)"/>
    <rect x="228" y="22" width="30" height="14" rx="7" fill="rgba(99,102,241,0.5)"/>
    <text x="243" y="33" fill="white" font-size="7" text-anchor="middle">Contacto</text>
    <!-- hero -->
    <rect x="15" y="50" width="160" height="90" rx="6" fill="rgba(255,255,255,0.02)"/>
    <rect x="25" y="62" width="100" height="10" rx="3" fill="rgba(255,255,255,0.25)"/>
    <rect x="25" y="78" width="130" height="6" rx="2" fill="rgba(255,255,255,0.1)"/>
    <rect x="25" y="89" width="110" height="6" rx="2" fill="rgba(255,255,255,0.08)"/>
    <rect x="25" y="105" width="55" height="20" rx="10" fill="rgba(249,115,22,0.8)"/>
    <text x="52" y="120" fill="white" font-size="8" text-anchor="middle" font-weight="600">Saber más</text>
    <!-- floating glass cards right -->
    <rect x="185" y="48" width="80" height="42" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(99,102,241,0.25)" stroke-width="1"/>
    <text x="225" y="68" fill="#6366F1" font-size="16" text-anchor="middle">⬡</text>
    <rect x="192" y="80" width="55" height="4" rx="2" fill="rgba(255,255,255,0.15)"/>
    <rect x="185" y="98" width="80" height="42" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(249,115,22,0.25)" stroke-width="1"/>
    <text x="225" y="118" fill="#F97316" font-size="16" text-anchor="middle">✦</text>
    <rect x="192" y="130" width="55" height="4" rx="2" fill="rgba(255,255,255,0.15)"/>
    <!-- footer strip -->
    <rect x="15" y="148" width="250" height="22" rx="5" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
    <rect x="25" y="155" width="35" height="4" rx="2" fill="rgba(255,255,255,0.1)"/>
    <rect x="200" y="155" width="50" height="4" rx="2" fill="rgba(255,255,255,0.08)"/>
  </svg>`,

  // Generic fallback — abstract neon sphere
  'default': `<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bgD" cx="50%" cy="50%"><stop offset="0%" stop-color="#0a0820"/><stop offset="100%" stop-color="#050510"/></radialGradient>
      <radialGradient id="sphereG" cx="35%" cy="35%"><stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.9"/><stop offset="60%" stop-color="#6366F1" stop-opacity="0.6"/><stop offset="100%" stop-color="#4F46E5" stop-opacity="0.1"/></radialGradient>
      <radialGradient id="glowG" cx="50%" cy="50%"><stop offset="0%" stop-color="#6366F1" stop-opacity="0.4"/><stop offset="100%" stop-color="#6366F1" stop-opacity="0"/></radialGradient>
      <filter id="blurG"><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="blurG2"><feGaussianBlur stdDeviation="2"/></filter>
    </defs>
    <rect width="280" height="180" fill="url(#bgD)"/>
    <!-- outer glow -->
    <circle cx="140" cy="90" r="80" fill="url(#glowG)" filter="url(#blurG)"/>
    <circle cx="200" cy="50" r="40" fill="#F97316" fill-opacity="0.08" filter="url(#blurG)"/>
    <!-- main sphere -->
    <circle cx="140" cy="90" r="55" fill="url(#sphereG)"/>
    <circle cx="140" cy="90" r="55" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
    <!-- glass highlight -->
    <ellipse cx="122" cy="68" rx="20" ry="12" fill="rgba(255,255,255,0.2)" transform="rotate(-30 122 68)"/>
    <!-- orbit rings -->
    <ellipse cx="140" cy="90" rx="72" ry="20" fill="none" stroke="rgba(249,115,22,0.3)" stroke-width="1" stroke-dasharray="4 3"/>
    <ellipse cx="140" cy="90" rx="72" ry="20" fill="none" stroke="rgba(249,115,22,0.15)" stroke-width="0.5" transform="rotate(60 140 90)"/>
    <!-- orbit dot -->
    <circle cx="212" cy="90" r="5" fill="#F97316" filter="url(#blurG2)"/>
    <circle cx="212" cy="90" r="3" fill="#F97316"/>
    <!-- grid lines on sphere -->
    <ellipse cx="140" cy="90" rx="55" ry="15" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
    <ellipse cx="140" cy="90" rx="55" ry="30" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>
    <line x1="140" y1="35" x2="140" y2="145" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
    <!-- floating particles -->
    <circle cx="60" cy="40" r="2" fill="#6366F1" fill-opacity="0.8"/>
    <circle cx="230" cy="130" r="2" fill="#F97316" fill-opacity="0.8"/>
    <circle cx="45" cy="130" r="1.5" fill="#10B981" fill-opacity="0.8"/>
    <circle cx="240" cy="50" r="1.5" fill="#8B5CF6" fill-opacity="0.8"/>
    <circle cx="100" cy="155" r="1" fill="#F97316" fill-opacity="0.6"/>
    <circle cx="185" cy="25" r="1" fill="#6366F1" fill-opacity="0.6"/>
  </svg>`
};

// Map service slugs/categories to images
function getServiceImage(product) {
  var slug = (product.slug || '').toLowerCase();
  var cat  = (product.category || '').toLowerCase();
  if (slug.includes('landing') || slug.includes('portafolio') || slug.includes('blog'))
    return ServiceImages['landing-page'];
  if (cat === 'ecommerce' || slug.includes('tienda') || slug.includes('ecommerce'))
    return ServiceImages['tienda-virtual'];
  if (cat === 'app' || slug.includes('dashboard') || slug.includes('inventario') || slug.includes('reservas'))
    return ServiceImages['app-dashboard'];
  if (slug.includes('corporativa') || slug.includes('educativa'))
    return ServiceImages['web-corporativa'];
  return ServiceImages['default'];
}