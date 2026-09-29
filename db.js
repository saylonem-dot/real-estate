/**
 * Emmanuel Real Estate - Database & CRM Layer (Neon PostgreSQL + Local Seeded Store)
 * Full Lead Scoring (0-100, HOT/WARM/COLD), Kanban Stages, Rate-Limiting, Role-based CRM.
 */

require('dotenv').config();
const { Pool } = require('pg');

let pool = null;
let isNeonConnected = false;

const databaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '' 
  ? process.env.DATABASE_URL.trim() 
  : null;

if (databaseUrl) {
  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    console.log('[Database] Initialized Neon connection pool.');
  } catch (err) {
    console.error('[Database] Failed to initialize Neon pool:', err.message);
  }
}

// ============================================================================
// LEAD SCORING ALGORITHM (0 TO 100)
// More points for cash buyers, ready to buy soon, bigger budgets, phone number,
// and interest in a specific property. Label: HOT, WARM, or COLD.
// ============================================================================

function calculateLeadScore(leadData) {
  let score = 20; // Base score for verified inquiry

  // 1. Valid phone number provided (+15 pts)
  if (leadData.phone && leadData.phone.replace(/[^0-9]/g, '').length >= 7) {
    score += 15;
  }

  // 2. Payment Method: Cash buyers get high priority (+25 pts)
  const notesAndMsg = `${leadData.message || ''} ${leadData.payment_method || ''} ${leadData.notes || ''}`.toLowerCase();
  if (notesAndMsg.includes('cash') || leadData.payment_method === 'Cash' || notesAndMsg.includes('funds ready') || notesAndMsg.includes('liquid')) {
    score += 25;
  } else if (notesAndMsg.includes('mortgage') || notesAndMsg.includes('pre-approved') || notesAndMsg.includes('finance')) {
    score += 15;
  }

  // 3. Timeframe: Ready to buy soon / Immediate horizon (+20 pts)
  const horizon = `${leadData.timeframe || ''} ${leadData.message || ''}`.toLowerCase();
  if (horizon.includes('immediate') || horizon.includes('ready') || horizon.includes('this week') || horizon.includes('this month') || horizon.includes('asap')) {
    score += 20;
  } else if (horizon.includes('1-3') || horizon.includes('soon') || horizon.includes('quarter')) {
    score += 12;
  } else {
    score += 5;
  }

  // 4. Budget Scale (AED) (+10 to +25 pts)
  const budget = Number(leadData.budget_aed) || 0;
  if (budget >= 40000000) {
    score += 25; // Ultra high net worth (AED 40M+)
  } else if (budget >= 20000000) {
    score += 20; // AED 20M - 40M
  } else if (budget >= 10000000) {
    score += 15; // AED 10M - 20M
  } else if (budget > 0) {
    score += 10;
  }

  // 5. Interest in a specific property / viewing booking (+15 pts)
  if (leadData.property_name || leadData.property_id || (leadData.preferred_community && leadData.preferred_community !== 'all') || (leadData.source_form && leadData.source_form.includes('Viewing'))) {
    score += 15;
  }

  // Cap score between 0 and 100
  score = Math.min(100, Math.max(10, score));

  // Label assignment
  let score_label = 'COLD';
  if (score >= 70) {
    score_label = 'HOT';
  } else if (score >= 45) {
    score_label = 'WARM';
  }

  return { score, score_label };
}

// ============================================================================
// SAMPLE DATA DEFINITIONS
// ============================================================================

const DEVELOPERS_DATA = [
  { id: 1, name: 'Aura Development Group', specialty: 'Ultra-Luxury Waterfront & Private Islands', founded_year: 2012, headquarters: 'DIFC, Dubai', total_projects: 14, description: 'Bespoke architectural masterminds crafting iconic coastal sanctuaries and private frond estates.' },
  { id: 2, name: 'Omnia Prestige Developments', specialty: 'High-Rise Architectural Sky Mansions', founded_year: 2015, headquarters: 'Downtown Dubai', total_projects: 9, description: 'Renowned for gravity-defying residential skyscrapers with private cantilevered pools.' },
  { id: 3, name: 'Elysian Living Group', specialty: 'Palm Jumeirah & Prime Coastal Enclaves', founded_year: 2010, headquarters: 'Dubai Marina', total_projects: 18, description: 'Curators of timeless bespoke beachfront villas with private yacht berths.' },
  { id: 4, name: 'Solarium Properties', specialty: 'Sustainable Biophilic Urban Luxury', founded_year: 2018, headquarters: 'Business Bay, Dubai', total_projects: 8, description: 'Pioneers in passive-energy luxury towers wrapped in vertical forests and hanging gardens.' },
  { id: 5, name: 'Verdant Hills Estates', specialty: 'Championship Golf Estates & Private Manors', founded_year: 2014, headquarters: 'Dubai Hills, Dubai', total_projects: 11, description: 'Specialists in expansive multi-acre manicured estates and golf-front architectural compounds.' }
];

const AGENTS_DATA = [
  { id: 1, name: 'Alexander Wright', role: 'Senior Managing Partner', email: 'alexander@emmanuelrealestate.ae', phone: '+971 4 820 9001', focus: 'Palm Jumeirah & Crown Penthouses', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80', experience_years: 14, monthly_target_aed: 80000000, closed_month_aed: 62000000 },
  { id: 2, name: 'Elena Rostova', role: 'Private Client Partner', email: 'elena@emmanuelrealestate.ae', phone: '+971 4 820 9002', focus: 'International UHNW & Off-Plan Advisory', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80', experience_years: 11, monthly_target_aed: 60000000, closed_month_aed: 55800000 },
  { id: 3, name: 'Tariq Al-Mansoor', role: 'Senior Associate Director', email: 'tariq@emmanuelrealestate.ae', phone: '+971 4 820 9003', focus: 'Emirates Hills, Dubai Hills & Estates', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80', experience_years: 9, monthly_target_aed: 50000000, closed_month_aed: 49500000 }
];

const STAFF_LOGINS_DATA = [
  { id: 1, name: 'Principal Director', email: 'admin@emmanuelrealestate.ae', password: 'EmmanuelLuxury2026!', role: 'admin', active: true },
  { id: 2, name: 'Alexander Wright', email: 'alexander@emmanuelrealestate.ae', password: 'agent123', role: 'agent', agent_id: 1, active: true },
  { id: 3, name: 'Elena Rostova', email: 'elena@emmanuelrealestate.ae', password: 'agent123', role: 'agent', agent_id: 2, active: true },
  { id: 4, name: 'Tariq Al-Mansoor', email: 'tariq@emmanuelrealestate.ae', password: 'agent123', role: 'agent', agent_id: 3, active: true },
  // Compatibility logins
  { id: 5, name: 'Principal Director', email: 'admin@jayrealestate.ae', password: 'JayLuxury2026!', role: 'admin', active: true },
  { id: 6, name: 'Principal Director', email: 'admin@emmanuelrealestate.ae', password: 'JayLuxury2026!', role: 'admin', active: true },
  { id: 7, name: 'Principal Director', email: 'admin@jayrealestate.ae', password: 'EmmanuelLuxury2026!', role: 'admin', active: true },
  { id: 8, name: 'Alexander Wright', email: 'alexander@jayrealestate.ae', password: 'agent123', role: 'agent', agent_id: 1, active: true },
  { id: 9, name: 'Elena Rostova', email: 'elena@jayrealestate.ae', password: 'agent123', role: 'agent', agent_id: 2, active: true },
  { id: 10, name: 'Tariq Al-Mansoor', email: 'tariq@jayrealestate.ae', password: 'agent123', role: 'agent', agent_id: 3, active: true }
];

const OFFPLAN_PROJECTS_DATA = [
  { id: 1, developer_id: 4, developer_name: 'Solarium Properties', title: 'Solarium Bay Residences', community: 'Dubai Marina', community_slug: 'dubai-marina', starting_price_aed: 8900000, handover_date: 'Q4 2027', payment_plan: '70/30 Post-Handover (10% Booking)', project_type: 'High-Rise Architectural Landmark', image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1600&q=85', est_roi: '8.4% Net Projected Yield', overview: 'Aerodynamic tower suspended over Dubai Marina channel with cascading private sky gardens and private yacht basin rights.', features: ['Level 54 cantilever infinity pool', 'Private yacht club membership included', 'Soundproof acoustic glass facades', 'Smart Creston home automation'] },
  { id: 2, developer_id: 2, developer_name: 'Omnia Prestige Developments', title: 'The Horizon Sanctuary Towers', community: 'Downtown', community_slug: 'downtown', starting_price_aed: 14200000, handover_date: 'Q2 2028', payment_plan: '60/40 Construction-Linked', project_type: 'Twin Crown Skyscraper Residences', image: 'https://images.unsplash.com/photo-1571888160334-1194796400d4?auto=format&fit=crop&w=1600&q=85', est_roi: '9.1% Capital Appreciation Target', overview: 'Twin glass monoliths joined by an elevated double-deck sky bridge hosting private dining salons and panoramic Downtown views.', features: ['Direct air-conditioned skybridge connection', '24/7 in-residence butler service', 'Valet parking for up to 4 vehicles', 'Private climate-controlled art vaults'] },
  { id: 3, developer_id: 1, developer_name: 'Aura Development Group', title: 'Aura Ocean Crest', community: 'Palm Jumeirah', community_slug: 'palm-jumeirah', starting_price_aed: 38000000, handover_date: 'Q1 2028', payment_plan: '50/50 on Handover (20% Down)', project_type: 'Ultra-Prime Island Beachfront Residences', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=85', est_roi: '11.5% Projected Value on Handover', overview: 'Limited collection of only 28 full-floor residences situated on the prestigious western crescent of Palm Jumeirah with private turquoise beach access.', features: ['Exclusive 120-meter private beach', 'Full-floor floorplates with 360-degree sea views', 'Subterranean private car galleries', 'Private marina mooring facilities'] },
  { id: 4, developer_id: 5, developer_name: 'Verdant Hills Estates', title: 'Verdant Fairway Mansions', community: 'Dubai Hills', community_slug: 'dubai-hills', starting_price_aed: 22500000, handover_date: 'Q3 2027', payment_plan: '80/20 on Handover (10% Booking)', project_type: 'Custom Golf Course Enclave', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85', est_roi: '8.8% Expected Net Rental ROI', overview: 'A boutique enclave of 18 grand architectural estates overlooking championship 18-hole fairways with private infinity pools and internal courtyards.', features: ['Direct buggy access to championship clubhouse', 'Private 25m lap pools with Baja sun shelves', 'Dedicated staff accommodations', 'Triple-volume glass living pavilions'] },
  { id: 5, developer_id: 2, developer_name: 'Omnia Prestige Developments', title: 'Omnia Canal Heights', community: 'Business Bay', community_slug: 'business-bay', starting_price_aed: 4600000, handover_date: 'Q4 2026', payment_plan: '60/40 Flexible Schedule', project_type: 'Waterfront Designer Residences', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=85', est_roi: '9.4% Premium Rental Yield', overview: 'Sophisticated canal-front suites with bespoke Italian finishings, private plunge terraces, and rapid access to DIFC and Downtown.', features: ['Dubai Water Canal promenade frontage', 'Rooftop sky lounge and infinity pool', 'Gaggenau designer kitchens', 'Dedicated EV fast-charging bays'] },
  { id: 6, developer_id: 3, developer_name: 'Elysian Living Group', title: 'Elysian Grove Residences', community: 'JVC', community_slug: 'jvc', starting_price_aed: 1850000, handover_date: 'Q2 2027', payment_plan: '50/50 2-Year Post Handover (10% Down)', project_type: 'Boutique Garden Residences', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85', est_roi: '9.8% High Rental Yield', overview: 'High-yielding luxury boutique development in vibrant JVC featuring private plunge pools on balconies, rooftop zen gardens, and European minimalist interiors.', features: ['Private balcony plunge pools', 'Biophilic garden atrium', 'Zero service charge for year one', 'Fully fitted European appliances'] }
];

const PROPERTIES_DATA = [
  // PALM JUMEIRAH
  { id: 1, title: 'The Palm Crest Sanctuary', community: 'Palm Jumeirah', community_slug: 'palm-jumeirah', type: 'Villa', bedrooms: 6, bathrooms: 8, built_up_sqft: 12850, price_aed: 48000000, status: 'Available', tag: 'Private Beachfront', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=85', description: 'An architectural magnum opus featuring 40 meters of private powder-white beach, acoustic underwater sound system in the pool, and an underground 6-car gallery.', features: ['Direct beach access', 'Infinity pool with swim-up bar', 'Subterranean 6-car showroom', 'Private spa & sauna', 'Smart automated lighting'] },
  { id: 2, title: 'The Elysian Sunset Frond Villa', community: 'Palm Jumeirah', community_slug: 'palm-jumeirah', type: 'Villa', bedrooms: 6, bathrooms: 7, built_up_sqft: 14400, price_aed: 65000000, status: 'Available', tag: 'West Frond Sunset', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=85', description: 'Positioned on a prime western frond capturing unobstructed Arabian Gulf sunsets, with a cantilevered master wing and custom bronze spiral staircase.', features: ['West-facing sunset orientation', 'Cantilevered master suite', 'Cryotherapy wellness pavilion', 'Private boat slip', 'Staff quarters for 4'] },
  { id: 3, title: 'Azure Tiara Penthouse', community: 'Palm Jumeirah', community_slug: 'palm-jumeirah', type: 'Penthouse', bedrooms: 4, bathrooms: 5, built_up_sqft: 7200, price_aed: 28500000, status: 'Available', tag: 'Crown Duplex', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=85', description: 'Crown duplex penthouse atop Palm Jumeirah with wraparound teak observation terrace, private heated jacuzzi, and 360-degree ocean panorama.', features: ['Wraparound terrace', 'Private heated jacuzzi', 'Italian Calacatta marble', 'Direct private elevator', '24/7 concierge'] },

  // DOWNTOWN
  { id: 4, title: 'Celestia Sky Penthouse', community: 'Downtown', community_slug: 'downtown', type: 'Penthouse', bedrooms: 4, bathrooms: 5, built_up_sqft: 8420, price_aed: 32500000, status: 'Available', tag: 'Burj View Duplex', image: 'https://images.unsplash.com/photo-1571888160334-1194796400d4?auto=format&fit=crop&w=1600&q=85', description: '7.2-meter double-height living room gazing directly at the world-famous Burj Khalifa and Dubai Fountain with private elevator and rooftop plunge pool.', features: ['Double-height ceilings', 'Direct Burj Khalifa view', 'Gourmet Gaggenau kitchen', 'Biometric private elevator', '4 reserved parking bays'] },
  { id: 5, title: 'Luminary Grand Boulevard Residence', community: 'Downtown', community_slug: 'downtown', type: 'Apartment', bedrooms: 3, bathrooms: 4, built_up_sqft: 3250, price_aed: 14800000, status: 'Available', tag: 'Turnkey Luxury', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85', description: 'Furnished by top Parisian interior designers with bespoke chevron oak flooring, marble bathrooms, and full panoramic boulevard views.', features: ['Designer furnished turnkey', 'Floor-to-ceiling glass', 'Dual walk-in dressing boudoirs', 'Valet & bellboy service', 'Integrated wine chiller'] },
  { id: 6, title: 'Opera District Executive Suite', community: 'Downtown', community_slug: 'downtown', type: 'Apartment', bedrooms: 2, bathrooms: 3, built_up_sqft: 1950, price_aed: 7900000, status: 'Available', tag: 'Culture Quarter', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=85', description: 'Steps from Dubai Opera, this high-floor suite features an expansive terrace, contemporary minimalist aesthetic, and high rental demand.', features: ['Dubai Opera proximity', 'Spacious corner terrace', 'High rental yield track record', 'High-speed fiber connectivity', 'Infinity pool access'] },

  // DUBAI MARINA
  { id: 7, title: 'Azure Water Frontage Villa', community: 'Dubai Marina', community_slug: 'dubai-marina', type: 'Villa', bedrooms: 5, bathrooms: 6, built_up_sqft: 7950, price_aed: 26000000, status: 'Available', tag: 'Private Yacht Berth', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=85', description: 'A rare marina waterfront villa featuring direct private mooring for yachts up to 75ft, wraparound deck, and stunning evening skyline reflections.', features: ['Direct yacht mooring', 'Teak sun deck & plunge pool', 'Chefs catering kitchen', 'Private office suite', 'Marina walk access'] },
  { id: 8, title: 'Marina Promenade Sky Villa', community: 'Dubai Marina', community_slug: 'dubai-marina', type: 'Penthouse', bedrooms: 4, bathrooms: 5, built_up_sqft: 5800, price_aed: 16500000, status: 'Available', tag: 'Duplex Penthouse', image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1600&q=85', description: 'Perched above the marina inlet with unobstructed open sea and yacht basin views, multiple entertaining terraces, and customized cocktail bar.', features: ['Sea & marina panoramic vistas', 'Built-in bespoke cocktail bar', 'Smart home climate control', 'Direct elevator access', 'Private sauna'] },
  { id: 9, title: 'Caspian Bay Yacht Residence', community: 'Dubai Marina', community_slug: 'dubai-marina', type: 'Apartment', bedrooms: 2, bathrooms: 3, built_up_sqft: 1750, price_aed: 4950000, status: 'Available', tag: 'Prime Marina Walk', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85', description: 'Immaculately renovated apartment with front-row view of passing yachts, custom Italian kitchen, and immediate access to luxury dining.', features: ['Unobstructed marina channel view', 'Custom Italian finishes', 'Covered secure parking', 'High ROI potential', 'Modern gym and spa'] },

  // BUSINESS BAY
  { id: 10, title: 'Canal Crown Duplex Penthouse', community: 'Business Bay', community_slug: 'business-bay', type: 'Penthouse', bedrooms: 4, bathrooms: 5, built_up_sqft: 6100, price_aed: 18200000, status: 'Available', tag: 'Canal Front', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=85', description: 'Dramatic double-height duplex overlooking the illuminated Dubai Water Canal, featuring private terrace swimming pool and executive board salon.', features: ['Private canal plunge pool', 'Executive conference salon', 'Gaggenau wine room', '24/7 dedicated security', 'DIFC adjacent'] },
  { id: 11, title: 'Marasi Waterfront Tower Residence', community: 'Business Bay', community_slug: 'business-bay', type: 'Apartment', bedrooms: 3, bathrooms: 3, built_up_sqft: 2800, price_aed: 8400000, status: 'Available', tag: 'Marasi Marina', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=85', description: 'Water-level residence on Marasi Drive with floor-to-ceiling glass doors opening onto an extended terrace right at the water promenade.', features: ['Water promenade terrace', 'Floor-to-ceiling Schuco glass', 'Modern open floor plan', '2 dedicated parking slots', 'Fitness & wellness center'] },
  { id: 12, title: 'Peninsula Skyline Suite', community: 'Business Bay', community_slug: 'business-bay', type: 'Apartment', bedrooms: 1, bathrooms: 2, built_up_sqft: 1120, price_aed: 2450000, status: 'Available', tag: 'High Yield Asset', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85', description: 'Prime investment apartment with direct Burj Khalifa skyline vistas, high rental yield profile, and turnkey luxury furnishings included.', features: ['Burj Khalifa skyline view', 'Turnkey designer package', 'Strong short-term rental ROI', 'Infinity pool & squash courts', '24/7 reception'] },

  // DUBAI HILLS
  { id: 13, title: 'The Mirage Golf Manor', community: 'Dubai Hills', community_slug: 'dubai-hills', type: 'Mansion', bedrooms: 7, bathrooms: 9, built_up_sqft: 15200, price_aed: 54000000, status: 'Available', tag: 'Championship Fairway', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85', description: 'A modern trophy estate sitting directly on the 18th hole fairway with private cinema, internal atrium featuring 200-year-old olive trees, and staff lodge.', features: ['18th hole fairway frontage', 'Private Dolby Atmos cinema', '200-year olive tree courtyard', 'Staff quarters for 6', 'Wine cellar (1200 bottles)'] },
  { id: 14, title: 'Parkway Vistas Modern Villa', community: 'Dubai Hills', community_slug: 'dubai-hills', type: 'Villa', bedrooms: 5, bathrooms: 6, built_up_sqft: 8600, price_aed: 24000000, status: 'Available', tag: 'Park Facing', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=85', description: 'Pristine family estate with expansive manicured gardens, private temperature-controlled pool, contemporary white stone facade, and park access.', features: ['Direct Dubai Hills park access', 'Temperature-controlled lap pool', 'Triple-car garage', 'Smart irrigation system', 'Separate dirty kitchen'] },

  // JVC
  { id: 15, title: 'L’Acacia Luxury Townhouse Villa', community: 'JVC', community_slug: 'jvc', type: 'Townhouse', bedrooms: 4, bathrooms: 5, built_up_sqft: 3900, price_aed: 3850000, status: 'Available', tag: 'Private Garden Villa', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=85', description: 'Custom-upgraded four-bedroom corner townhouse with private rooftop plunge jacuzzi, landscaped garden, elevator, and exceptional rental returns.', features: ['Rooftop plunge jacuzzi', 'Private internal elevator', 'Corner plot with private garden', 'Low annual service fees', 'Maids suite included'] }
];

// Helper to generate 40 sample leads with realistic scores (HOT/WARM/COLD), stages, and timestamps
const RAW_LEADS_SOURCE = [
  { name: 'Lord Julian Sterling', phone: '+447700900123', email: 'j.sterling@sterling-holdings.co.uk', budget_aed: 50000000, preferred_community: 'Palm Jumeirah', property_type: 'Villa', property_name: 'The Palm Crest Sanctuary', source_form: 'Home Register Form', stage: 'Viewing', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Alexander Wright', days_ago: 0 },
  { name: 'Sheikh Fahad Al-Qasimi', phone: '+971501112233', email: 'fahad@familyoffice.ae', budget_aed: 65000000, preferred_community: 'Palm Jumeirah', property_type: 'Villa', property_name: 'The Elysian Sunset Frond Villa', source_form: 'Property Detail Viewing', stage: 'Offer', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Alexander Wright', days_ago: 1 },
  { name: 'Dr. Evelyn Vance', phone: '+12125550199', email: 'e.vance@vancemedical.com', budget_aed: 15000000, preferred_community: 'Downtown', property_type: 'Penthouse', property_name: 'Celestia Sky Penthouse', source_form: 'Property Enquire Form', stage: 'Contacted', payment_method: 'Mortgage', timeframe: '1-3 Months', agent_name: 'Elena Rostova', days_ago: 1 },
  { name: 'Maximilian Von Bauer', phone: '+491712345678', email: 'm.bauer@munichcapital.de', budget_aed: 35000000, preferred_community: 'Dubai Marina', property_type: 'Waterfront Villa', property_name: 'Azure Water Frontage Villa', source_form: 'Off-Plan Brochure Download', stage: 'Viewing', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Elena Rostova', days_ago: 2 },
  { name: 'Sarah Lin', phone: '+6591234567', email: 'sarah.lin@singaporeinvest.sg', budget_aed: 18000000, preferred_community: 'Downtown', property_type: 'Apartment', property_name: 'Luminary Grand Boulevard Residence', source_form: 'Mortgage Advisor Form', stage: 'New', payment_method: 'Mortgage', timeframe: '3-6 Months', agent_name: 'Elena Rostova', days_ago: 0 },
  { name: 'Henri de Montmirail', phone: '+33612345678', email: 'henri@montmirail.fr', budget_aed: 28000000, preferred_community: 'Palm Jumeirah', property_type: 'Penthouse', property_name: 'Azure Tiara Penthouse', source_form: 'Property Detail Viewing', stage: 'Viewing', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Alexander Wright', days_ago: 0 },
  { name: 'Vikram Malhotra', phone: '+919820012345', email: 'vikram@malhotragroup.in', budget_aed: 25000000, preferred_community: 'Dubai Hills', property_type: 'Villa', property_name: 'Parkway Vistas Modern Villa', source_form: 'Hero Search Form', stage: 'Contacted', payment_method: 'Cash', timeframe: '1-3 Months', agent_name: 'Tariq Al-Mansoor', days_ago: 4 }, // Stale lead (4 days)
  { name: 'Anastasia Romanova', phone: '+971559876543', email: 'anastasia@auroraglobal.ae', budget_aed: 40000000, preferred_community: 'Downtown', property_type: 'Penthouse', property_name: 'Celestia Sky Penthouse', source_form: 'Header Register Interest', stage: 'Offer', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Elena Rostova', days_ago: 1 },
  { name: 'Tariq Hashmi', phone: '+966503334455', email: 'tariq@hashmi-holdings.sa', budget_aed: 55000000, preferred_community: 'Dubai Hills', property_type: 'Mansion', property_name: 'The Mirage Golf Manor', source_form: 'Floating Callback Button', stage: 'Contacted', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Tariq Al-Mansoor', days_ago: 5 }, // Stale lead (5 days)
  { name: 'Oliver Crawford', phone: '+447800654321', email: 'o.crawford@mayfairtrust.co.uk', budget_aed: 12000000, preferred_community: 'Business Bay', property_type: 'Apartment', property_name: 'Canal Crown Duplex Penthouse', source_form: 'Mortgage Advisor Form', stage: 'New', payment_method: 'Mortgage', timeframe: '1-3 Months', agent_name: 'Alexander Wright', days_ago: 0 },
  { name: 'Fatima Al-Nuaimi', phone: '+971524448899', email: 'fatima.alnuaimi@ad-invest.ae', budget_aed: 30000000, preferred_community: 'Palm Jumeirah', property_type: 'Villa', property_name: '', source_form: 'Sell Valuation Form', stage: 'Contacted', payment_method: 'Cash', timeframe: '1-3 Months', agent_name: 'Alexander Wright', days_ago: 1 },
  { name: 'Arthur Pendelton', phone: '+14155550142', email: 'arthur@siliconventures.vc', budget_aed: 22000000, preferred_community: 'Dubai Marina', property_type: 'Penthouse', property_name: 'Marina Promenade Sky Villa', source_form: 'Off-Plan Brochure Download', stage: 'Viewing', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Elena Rostova', days_ago: 2 },
  { name: 'Clara Sorensen', phone: '+4520123456', email: 'clara@nordicdesigns.dk', budget_aed: 9000000, preferred_community: 'Dubai Marina', property_type: 'Apartment', property_name: 'Caspian Bay Yacht Residence', source_form: 'Home Register Form', stage: 'New', payment_method: 'Mortgage', timeframe: '3-6 Months', agent_name: 'Elena Rostova', days_ago: 0 },
  { name: 'Zaid Al-Harbi', phone: '+96599887766', email: 'zaid@kuwaitprivate.kw', budget_aed: 45000000, preferred_community: 'Palm Jumeirah', property_type: 'Villa', property_name: 'The Palm Crest Sanctuary', source_form: 'Property Detail Viewing', stage: 'Offer', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Alexander Wright', days_ago: 1 },
  { name: 'Elena Petrova', phone: '+971542223344', email: 'elena.p@petrovagroup.com', budget_aed: 16000000, preferred_community: 'Business Bay', property_type: 'Penthouse', property_name: 'Canal Crown Duplex Penthouse', source_form: 'Floating Callback Button', stage: 'New', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Elena Rostova', days_ago: 0 },
  { name: 'David Chen', phone: '+85298765432', email: 'david.chen@pacificwealth.hk', budget_aed: 35000000, preferred_community: 'Downtown', property_type: 'Penthouse', property_name: 'Celestia Sky Penthouse', source_form: 'WhatsApp Concierge', stage: 'Viewing', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Elena Rostova', days_ago: 0 },
  { name: 'Beatrice DuPont', phone: '+32470123456', email: 'beatrice@dupontart.be', budget_aed: 14000000, preferred_community: 'Downtown', property_type: 'Apartment', property_name: '', source_form: 'Mortgage Advisor Form', stage: 'Contacted', payment_method: 'Mortgage', timeframe: '1-3 Months', agent_name: 'Alexander Wright', days_ago: 6 }, // Stale lead (6 days)
  { name: 'Nasser Al-Subaie', phone: '+97455667788', email: 'nasser@dohacapital.qa', budget_aed: 60000000, preferred_community: 'Dubai Hills', property_type: 'Mansion', property_name: 'The Mirage Golf Manor', source_form: 'Floating Callback Button', stage: 'Viewing', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Tariq Al-Mansoor', days_ago: 1 },
  { name: 'Lucas Rossi', phone: '+393351234567', email: 'lucas@rossimilano.it', budget_aed: 8000000, preferred_community: 'Business Bay', property_type: 'Apartment', property_name: 'Marasi Waterfront Tower Residence', source_form: 'Home Register Form', stage: 'New', payment_method: 'Cash', timeframe: '1-3 Months', agent_name: 'Alexander Wright', days_ago: 0 },
  { name: 'Amina Al-Falasi', phone: '+971508889900', email: 'amina@emiratesfamily.ae', budget_aed: 24000000, preferred_community: 'Dubai Hills', property_type: 'Villa', property_name: 'Parkway Vistas Modern Villa', source_form: 'Sell Valuation Form', stage: 'Viewing', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Tariq Al-Mansoor', days_ago: 2 },
  { name: 'George Hamilton', phone: '+13125550188', email: 'ghamilton@chicagotrust.com', budget_aed: 19000000, preferred_community: 'Dubai Marina', property_type: 'Penthouse', property_name: '', source_form: 'Off-Plan Brochure Download', stage: 'Contacted', payment_method: 'Mortgage', timeframe: '3-6 Months', agent_name: 'Elena Rostova', days_ago: 4 }, // Stale
  { name: 'Yulia Morozova', phone: '+971561237890', email: 'yulia@morozova.ae', budget_aed: 52000000, preferred_community: 'Palm Jumeirah', property_type: 'Villa', property_name: 'The Elysian Sunset Frond Villa', source_form: 'Property Detail Viewing', stage: 'Offer', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Alexander Wright', days_ago: 0 },
  { name: 'Hamad Al-Thani', phone: '+97466112233', email: 'h.thani@gulfpearl.qa', budget_aed: 70000000, preferred_community: 'Palm Jumeirah', property_type: 'Villa', property_name: 'The Elysian Sunset Frond Villa', source_form: 'Contact Page Appointment', stage: 'Viewing', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Alexander Wright', days_ago: 1 },
  { name: 'Chloe Laurent', phone: '+33698765432', email: 'chloe@laurentparis.fr', budget_aed: 4500000, preferred_community: 'JVC', property_type: 'Townhouse', property_name: 'L’Acacia Luxury Townhouse Villa', source_form: 'Home Register Form', stage: 'New', payment_method: 'Mortgage', timeframe: '1-3 Months', agent_name: 'Tariq Al-Mansoor', days_ago: 0 },
  { name: 'Rohan Gupta', phone: '+919900054321', email: 'rohan@guptatech.in', budget_aed: 11000000, preferred_community: 'Business Bay', property_type: 'Apartment', property_name: '', source_form: 'Mortgage Advisor Form', stage: 'Contacted', payment_method: 'Mortgage', timeframe: '1-3 Months', agent_name: 'Elena Rostova', days_ago: 2 },
  { name: 'Klaus Lindner', phone: '+436641234567', email: 'k.lindner@viennaholdings.at', budget_aed: 27000000, preferred_community: 'Dubai Marina', property_type: 'Waterfront Villa', property_name: 'Azure Water Frontage Villa', source_form: 'Property Detail Viewing', stage: 'Viewing', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Elena Rostova', days_ago: 1 },
  { name: 'Mariam Al-Mansouri', phone: '+971506781234', email: 'mariam.m@dubaiadvisory.ae', budget_aed: 33000000, preferred_community: 'Downtown', property_type: 'Penthouse', property_name: 'Celestia Sky Penthouse', source_form: 'Header Register Interest', stage: 'Contacted', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Elena Rostova', days_ago: 3 }, // Stale
  { name: 'Marcus Sterling', phone: '+447900112233', email: 'marcus@sterlinginvest.co.uk', budget_aed: 15000000, preferred_community: 'Downtown', property_type: 'Apartment', property_name: 'Opera District Executive Suite', source_form: 'Off-Plan Brochure Download', stage: 'New', payment_method: 'Cash', timeframe: '1-3 Months', agent_name: 'Elena Rostova', days_ago: 0 },
  { name: 'Sunil Varma', phone: '+971554567890', email: 's.varma@varmacorp.ae', budget_aed: 21000000, preferred_community: 'Dubai Hills', property_type: 'Villa', property_name: '', source_form: 'Sell Valuation Form', stage: 'Contacted', payment_method: 'Cash', timeframe: '1-3 Months', agent_name: 'Tariq Al-Mansoor', days_ago: 5 }, // Stale
  { name: 'Astrid Lindholm', phone: '+46701234567', email: 'astrid@stockholmcap.se', budget_aed: 8500000, preferred_community: 'Dubai Marina', property_type: 'Apartment', property_name: 'Caspian Bay Yacht Residence', source_form: 'Home Register Form', stage: 'New', payment_method: 'Mortgage', timeframe: '3-6 Months', agent_name: 'Elena Rostova', days_ago: 0 },
  { name: 'Mansoor Al-Hajri', phone: '+96891234567', email: 'mansoor@muscatwealth.om', budget_aed: 42000000, preferred_community: 'Palm Jumeirah', property_type: 'Villa', property_name: 'The Palm Crest Sanctuary', source_form: 'Floating Callback Button', stage: 'Viewing', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Alexander Wright', days_ago: 1 },
  { name: 'Valerie Dubois', phone: '+41791234567', email: 'valerie@genevatrust.ch', budget_aed: 36000000, preferred_community: 'Downtown', property_type: 'Penthouse', property_name: 'Celestia Sky Penthouse', source_form: 'Property Detail Viewing', stage: 'Offer', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Elena Rostova', days_ago: 0 },
  { name: 'James Thornton', phone: '+12025550177', email: 'jthornton@dcpartners.com', budget_aed: 13500000, preferred_community: 'Business Bay', property_type: 'Apartment', property_name: '', source_form: 'Mortgage Advisor Form', stage: 'Contacted', payment_method: 'Mortgage', timeframe: '3-6 Months', agent_name: 'Alexander Wright', days_ago: 4 }, // Stale
  { name: 'Reem Al-Otaiba', phone: '+971529991122', email: 'reem@otaibafamily.ae', budget_aed: 58000000, preferred_community: 'Dubai Hills', property_type: 'Mansion', property_name: 'The Mirage Golf Manor', source_form: 'Contact Page Appointment', stage: 'Viewing', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Tariq Al-Mansoor', days_ago: 1 },
  { name: 'Charles Montgomery', phone: '+447711223344', email: 'c.montgomery@chelseaestates.co.uk', budget_aed: 29000000, preferred_community: 'Palm Jumeirah', property_type: 'Penthouse', property_name: 'Azure Tiara Penthouse', source_form: 'Off-Plan Brochure Download', stage: 'New', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Alexander Wright', days_ago: 0 },
  { name: 'Natalia Volkova', phone: '+971587776655', email: 'natalia@volkovagroup.com', budget_aed: 17500000, preferred_community: 'Dubai Marina', property_type: 'Penthouse', property_name: 'Marina Promenade Sky Villa', source_form: 'WhatsApp Concierge', stage: 'Contacted', payment_method: 'Cash', timeframe: '1-3 Months', agent_name: 'Elena Rostova', days_ago: 1 },
  { name: 'Bader Al-Mutawa', phone: '+96597654321', email: 'bader@mutawafamily.kw', budget_aed: 48000000, preferred_community: 'Palm Jumeirah', property_type: 'Villa', property_name: 'The Palm Crest Sanctuary', source_form: 'Property Detail Viewing', stage: 'Viewing', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Alexander Wright', days_ago: 2 },
  { name: 'Liam O’Connor', phone: '+353871234567', email: 'liam@dublincapital.ie', budget_aed: 3900000, preferred_community: 'JVC', property_type: 'Townhouse', property_name: 'L’Acacia Luxury Townhouse Villa', source_form: 'Home Register Form', stage: 'New', payment_method: 'Mortgage', timeframe: '3-6 Months', agent_name: 'Tariq Al-Mansoor', days_ago: 0 },
  { name: 'Sofia Hernandez', phone: '+34600123456', email: 'sofia@madridlux.es', budget_aed: 10500000, preferred_community: 'Business Bay', property_type: 'Apartment', property_name: '', source_form: 'Mortgage Advisor Form', stage: 'Contacted', payment_method: 'Mortgage', timeframe: '1-3 Months', agent_name: 'Alexander Wright', days_ago: 3 }, // Stale
  { name: 'Hassan Al-Majid', phone: '+971503219876', email: 'hassan@almajidholdings.ae', budget_aed: 62000000, preferred_community: 'Palm Jumeirah', property_type: 'Villa', property_name: 'The Palm Crest Sanctuary', source_form: 'Private Referral', stage: 'Won', payment_method: 'Cash', timeframe: 'Immediate', agent_name: 'Alexander Wright', days_ago: 0 }
];

// Initialize sample leads with exact scoring and timestamps
const BUYER_LEADS_DATA = RAW_LEADS_SOURCE.map((item, idx) => {
  const { score, score_label } = calculateLeadScore(item);
  const date = new Date();
  date.setDate(date.getDate() - (item.days_ago || 0));

  return {
    id: idx + 1,
    ...item,
    score,
    score_label,
    source: item.source_form,
    status: item.stage,
    created_at: date.toISOString(),
    last_activity_date: date.toISOString()
  };
});

const VIEWINGS_DATA = [
  { id: 1, lead_name: 'Lord Julian Sterling', property_name: 'The Palm Crest Sanctuary', agent_name: 'Alexander Wright', viewing_date: '2026-10-04 11:00 AM', status: 'Confirmed', notes: 'Client arriving via chauffeured helicopter transfer.' },
  { id: 2, lead_name: 'Sheikh Fahad Al-Qasimi', property_name: 'The Elysian Sunset Frond Villa', agent_name: 'Alexander Wright', viewing_date: '2026-10-05 04:30 PM', status: 'Confirmed', notes: 'Private inspection of west sunset orientation and yacht slip.' },
  { id: 3, lead_name: 'Henri de Montmirail', property_name: 'Azure Tiara Penthouse', agent_name: 'Alexander Wright', viewing_date: '2026-10-06 02:00 PM', status: 'Confirmed', notes: 'Requires full Calacatta marble provenance dossier.' },
  { id: 4, lead_name: 'Anastasia Romanova', property_name: 'Celestia Sky Penthouse', agent_name: 'Elena Rostova', viewing_date: '2026-10-03 06:00 PM', status: 'Confirmed', notes: 'Sunset viewing to witness Dubai Fountain lighting ceremony.' },
  { id: 5, lead_name: 'Arthur Pendelton', property_name: 'Azure Water Frontage Villa', agent_name: 'Elena Rostova', viewing_date: '2026-10-07 10:30 AM', status: 'Scheduled', notes: 'Inspection of 75ft marina mooring depth and tender access.' },
  { id: 6, lead_name: 'David Chen', property_name: 'Luminary Grand Boulevard Residence', agent_name: 'Elena Rostova', viewing_date: '2026-10-05 01:00 PM', status: 'Scheduled', notes: 'Reviewing furniture appraisal list from Parisian artisans.' },
  { id: 7, lead_name: 'Klaus Lindner', property_name: 'Marina Promenade Sky Villa', agent_name: 'Elena Rostova', viewing_date: '2026-10-08 03:00 PM', status: 'Scheduled', notes: 'Focus on outdoor terrace square footage for entertaining.' },
  { id: 8, lead_name: 'Amina Al-Falasi', property_name: 'Parkway Vistas Modern Villa', agent_name: 'Tariq Al-Mansoor', viewing_date: '2026-10-04 09:30 AM', status: 'Confirmed', notes: 'Private gate access test and golf club buggy trail inspection.' },
  { id: 9, lead_name: 'Mansoor Al-Hajri', property_name: 'The Palm Crest Sanctuary', agent_name: 'Alexander Wright', viewing_date: '2026-10-09 11:30 AM', status: 'Scheduled', notes: 'Second viewing with family architectural advisor.' },
  { id: 10, lead_name: 'Bader Al-Mutawa', property_name: 'The Mirage Golf Manor', agent_name: 'Tariq Al-Mansoor', viewing_date: '2026-10-06 10:00 AM', status: 'Confirmed', notes: 'Inspection of private basement cinema and 18th hole perimeter.' }
];

const COMPLETED_SALES_DATA = [
  { id: 1, property_name: 'The Palm Sunset Frond Estate', community: 'Palm Jumeirah', sale_price_aed: 62000000, buyer_name: 'Baroness Charlotte von Hesse', agent_name: 'Alexander Wright', completion_date: '2026-09-15', commission_aed: 1240000 },
  { id: 2, property_name: 'Crown Royal Penthouse', community: 'Downtown', sale_price_aed: 31000000, buyer_name: 'Maximilian Sterling', agent_name: 'Elena Rostova', completion_date: '2026-09-20', commission_aed: 620000 },
  { id: 3, property_name: 'The Fairway Sanctuary Villa', community: 'Dubai Hills', sale_price_aed: 49500000, buyer_name: 'Dr. Tariq Al-Ghanem', agent_name: 'Tariq Al-Mansoor', completion_date: '2026-09-22', commission_aed: 990000 },
  { id: 4, property_name: 'Marina Yachtmaster Residence', community: 'Dubai Marina', sale_price_aed: 24800000, buyer_name: 'Dmitri Voronov', agent_name: 'Elena Rostova', completion_date: '2026-09-25', commission_aed: 496000 },
  { id: 5, property_name: 'Canalview Executive Duplex', community: 'Business Bay', sale_price_aed: 16900000, buyer_name: 'Lady Vivienne Cross', agent_name: 'Alexander Wright', completion_date: '2026-09-28', commission_aed: 338000 }
];

const NOTES_DATA = [
  { id: 1, lead_id: 1, author: 'Alexander Wright', content: 'Client prefers off-market fronds. Cash buyer with funds ready in Emirates NBD private banking.', created_at: '2026-09-25 10:30' },
  { id: 2, lead_id: 2, author: 'Alexander Wright', content: 'Requested NDA signing before providing structural laser scan drawings.', created_at: '2026-09-26 14:15' },
  { id: 3, lead_id: 4, author: 'Elena Rostova', content: 'Interested in Golden Visa residency for 4 family dependents.', created_at: '2026-09-27 16:40' },
  { id: 4, lead_id: 8, author: 'Elena Rostova', content: 'Submitted formal letter of intent for Celestia Sky Penthouse at AED 32M.', created_at: '2026-09-28 11:20' },
  { id: 5, lead_id: 9, author: 'Tariq Al-Mansoor', content: 'Scheduled private salon consultation at DIFC Gate Precinct next Tuesday.', created_at: '2026-09-29 09:00' }
];

// In-Memory store
let memoryStore = {
  developers: [...DEVELOPERS_DATA],
  offplan_projects: [...OFFPLAN_PROJECTS_DATA],
  properties: [...PROPERTIES_DATA],
  agents: [...AGENTS_DATA],
  buyer_leads: [...BUYER_LEADS_DATA],
  viewings: [...VIEWINGS_DATA],
  completed_sales: [...COMPLETED_SALES_DATA],
  staff_logins: [...STAFF_LOGINS_DATA],
  notes: [...NOTES_DATA]
};

// ============================================================================
// DATABASE INITIALIZATION & SCHEMA CREATION
// ============================================================================

async function initDatabase() {
  if (!pool) {
    console.log('[Database] Operating with active in-memory seeded store (5 Developers, 6 Off-Plan, 15 Properties, 3 Agents, 40 Scored Leads, 10 Viewings, 5 Sales).');
    return;
  }

  try {
    const client = await pool.connect();
    isNeonConnected = true;
    console.log('[Database] Connected to Neon PostgreSQL cloud instance.');

    // Ensure all tables and updated columns exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS developers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        specialty VARCHAR(255),
        founded_year INT,
        headquarters VARCHAR(255),
        total_projects INT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS agents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        focus VARCHAR(255),
        phone VARCHAR(100),
        email VARCHAR(255) UNIQUE,
        image TEXT,
        experience_years INT,
        monthly_target_aed BIGINT DEFAULT 50000000,
        closed_month_aed BIGINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS staff_logins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        agent_id INT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS offplan_projects (
        id SERIAL PRIMARY KEY,
        developer_id INT,
        developer_name VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        community VARCHAR(255),
        community_slug VARCHAR(255),
        starting_price_aed BIGINT NOT NULL,
        handover_date VARCHAR(100),
        payment_plan VARCHAR(255),
        project_type VARCHAR(255),
        image TEXT,
        est_roi VARCHAR(100),
        overview TEXT,
        features TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        community VARCHAR(255) NOT NULL,
        community_slug VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        bedrooms INT NOT NULL,
        bathrooms INT NOT NULL,
        built_up_sqft INT NOT NULL,
        price_aed BIGINT NOT NULL,
        status VARCHAR(50) DEFAULT 'Available',
        tag VARCHAR(100),
        image TEXT NOT NULL,
        description TEXT,
        features TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS buyer_leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        budget_aed BIGINT,
        preferred_community VARCHAR(255),
        property_type VARCHAR(100),
        property_name VARCHAR(255),
        source_form VARCHAR(255),
        source VARCHAR(100),
        status VARCHAR(100) DEFAULT 'New',
        score INT DEFAULT 50,
        score_label VARCHAR(50) DEFAULT 'WARM',
        payment_method VARCHAR(100),
        timeframe VARCHAR(100),
        agent_name VARCHAR(255),
        message TEXT,
        last_activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS viewings (
        id SERIAL PRIMARY KEY,
        lead_id INT,
        lead_name VARCHAR(255) NOT NULL,
        property_id INT,
        property_name VARCHAR(255) NOT NULL,
        agent_name VARCHAR(255),
        viewing_date VARCHAR(100),
        status VARCHAR(100) DEFAULT 'Scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS completed_sales (
        id SERIAL PRIMARY KEY,
        property_name VARCHAR(255) NOT NULL,
        community VARCHAR(255) NOT NULL,
        sale_price_aed BIGINT NOT NULL,
        buyer_name VARCHAR(255) NOT NULL,
        agent_name VARCHAR(255) NOT NULL,
        completion_date VARCHAR(100),
        commission_aed BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        lead_id INT,
        author VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Verify seed counts
    const devCountRes = await client.query('SELECT COUNT(*) FROM developers');
    if (parseInt(devCountRes.rows[0].count, 10) === 0) {
      console.log('[Database] Seeding fresh Neon instance with complete portfolio...');
      for (const d of DEVELOPERS_DATA) await client.query('INSERT INTO developers (id, name, specialty, founded_year, headquarters, total_projects, description) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING', [d.id, d.name, d.specialty, d.founded_year, d.headquarters, d.total_projects, d.description]);
      for (const a of AGENTS_DATA) await client.query('INSERT INTO agents (id, name, role, focus, phone, email, image, experience_years, monthly_target_aed, closed_month_aed) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING', [a.id, a.name, a.role, a.focus, a.phone, a.email, a.image, a.experience_years, a.monthly_target_aed, a.closed_month_aed]);
      for (const s of STAFF_LOGINS_DATA) await client.query('INSERT INTO staff_logins (id, name, email, password, role, agent_id) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING', [s.id, s.name, s.email, s.password, s.role, s.agent_id || null]);
      for (const o of OFFPLAN_PROJECTS_DATA) await client.query('INSERT INTO offplan_projects (id, developer_id, developer_name, title, community, community_slug, starting_price_aed, handover_date, payment_plan, project_type, image, est_roi, overview, features) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (id) DO NOTHING', [o.id, o.developer_id, o.developer_name, o.title, o.community, o.community_slug, o.starting_price_aed, o.handover_date, o.payment_plan, o.project_type, o.image, o.est_roi, o.overview, o.features]);
      for (const p of PROPERTIES_DATA) await client.query('INSERT INTO properties (id, title, community, community_slug, type, bedrooms, bathrooms, built_up_sqft, price_aed, status, tag, image, description, features) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (id) DO NOTHING', [p.id, p.title, p.community, p.community_slug, p.type, p.bedrooms, p.bathrooms, p.built_up_sqft, p.price_aed, p.status, p.tag, p.image, p.description, p.features]);
      for (const l of BUYER_LEADS_DATA) await client.query('INSERT INTO buyer_leads (id, name, phone, email, budget_aed, preferred_community, property_type, property_name, source_form, source, status, score, score_label, payment_method, timeframe, agent_name, last_activity_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) ON CONFLICT (id) DO NOTHING', [l.id, l.name, l.phone, l.email, l.budget_aed, l.preferred_community, l.property_type, l.property_name, l.source_form, l.source, l.status, l.score, l.score_label, l.payment_method, l.timeframe, l.agent_name, l.last_activity_date]);
      for (const v of VIEWINGS_DATA) await client.query('INSERT INTO viewings (id, lead_name, property_name, agent_name, viewing_date, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING', [v.id, v.lead_name, v.property_name, v.agent_name, v.viewing_date, v.status, v.notes]);
      for (const sale of COMPLETED_SALES_DATA) await client.query('INSERT INTO completed_sales (id, property_name, community, sale_price_aed, buyer_name, agent_name, completion_date, commission_aed) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING', [sale.id, sale.property_name, sale.community, sale.sale_price_aed, sale.buyer_name, sale.agent_name, sale.completion_date, sale.commission_aed]);
      for (const n of NOTES_DATA) await client.query('INSERT INTO notes (id, lead_id, author, content) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING', [n.id, n.lead_id, n.author, n.content]);
    }
    client.release();
  } catch (err) {
    isNeonConnected = false;
    console.error('[Database] Neon initialization warning:', err.message);
  }
}

// ============================================================================
// DATA ACCESS METHODS
// ============================================================================

async function verifyStaffLogin(email, password) {
  if (isNeonConnected && pool) {
    const res = await pool.query('SELECT id, name, email, role, agent_id, active FROM staff_logins WHERE LOWER(email) = LOWER($1) AND password = $2', [email, password]);
    return res.rows[0] || null;
  }
  return memoryStore.staff_logins.find(s => s.email.toLowerCase() === email.toLowerCase() && s.password === password) || null;
}

async function getDevelopers() {
  if (isNeonConnected && pool) {
    const res = await pool.query('SELECT * FROM developers ORDER BY id ASC');
    return res.rows;
  }
  return memoryStore.developers;
}

async function getAgents() {
  if (isNeonConnected && pool) {
    const res = await pool.query('SELECT * FROM agents ORDER BY id ASC');
    return res.rows;
  }
  return memoryStore.agents;
}

async function getProperties(filters = {}) {
  let list = [];
  if (isNeonConnected && pool) {
    let query = 'SELECT * FROM properties WHERE 1=1';
    const params = [];
    if (filters.community && filters.community !== 'all') {
      params.push(filters.community);
      query += ` AND community_slug = $${params.length}`;
    }
    if (filters.type && filters.type !== 'all') {
      params.push(filters.type);
      query += ` AND LOWER(type) = LOWER($${params.length})`;
    }
    if (filters.bedrooms && filters.bedrooms !== 'all') {
      params.push(parseInt(filters.bedrooms, 10));
      query += ` AND bedrooms = $${params.length}`;
    }
    if (filters.max_price && filters.max_price !== 'all') {
      params.push(parseInt(filters.max_price, 10));
      query += ` AND price_aed <= $${params.length}`;
    }
    query += ' ORDER BY price_aed DESC';
    const res = await pool.query(query, params);
    list = res.rows;
  } else {
    list = [...memoryStore.properties];
    if (filters.community && filters.community !== 'all') list = list.filter(p => p.community_slug === filters.community);
    if (filters.type && filters.type !== 'all') list = list.filter(p => p.type.toLowerCase() === filters.type.toLowerCase());
    if (filters.bedrooms && filters.bedrooms !== 'all') list = list.filter(p => p.bedrooms === parseInt(filters.bedrooms, 10));
    if (filters.max_price && filters.max_price !== 'all') list = list.filter(p => p.price_aed <= parseInt(filters.max_price, 10));
  }
  return list;
}

async function getPropertyById(id) {
  const numericId = parseInt(id, 10);
  if (isNeonConnected && pool) {
    const res = await pool.query('SELECT * FROM properties WHERE id = $1', [numericId]);
    return res.rows[0] || null;
  }
  return memoryStore.properties.find(p => p.id === numericId) || null;
}

async function saveProperty(data, id = null) {
  if (id) {
    const numericId = parseInt(id, 10);
    if (isNeonConnected && pool) {
      const res = await pool.query(`
        UPDATE properties 
        SET title = $1, community = $2, community_slug = $3, type = $4, bedrooms = $5, bathrooms = $6, built_up_sqft = $7, price_aed = $8, status = $9, tag = $10, image = $11, description = $12
        WHERE id = $13 RETURNING *
      `, [data.title, data.community, data.community_slug || data.community.toLowerCase().replace(/\s+/g, '-'), data.type, parseInt(data.bedrooms, 10), parseInt(data.bathrooms, 10), parseInt(data.built_up_sqft, 10), parseInt(data.price_aed, 10), data.status || 'Available', data.tag, data.image, data.description, numericId]);
      return res.rows[0];
    } else {
      const idx = memoryStore.properties.findIndex(p => p.id === numericId);
      if (idx !== -1) {
        memoryStore.properties[idx] = { ...memoryStore.properties[idx], ...data, id: numericId };
        return memoryStore.properties[idx];
      }
    }
  } else {
    if (isNeonConnected && pool) {
      const res = await pool.query(`
        INSERT INTO properties (title, community, community_slug, type, bedrooms, bathrooms, built_up_sqft, price_aed, status, tag, image, description, features)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *
      `, [data.title, data.community, data.community_slug || data.community.toLowerCase().replace(/\s+/g, '-'), data.type, parseInt(data.bedrooms, 10) || 3, parseInt(data.bathrooms, 10) || 4, parseInt(data.built_up_sqft, 10) || 3500, parseInt(data.price_aed, 10) || 10000000, 'Available', data.tag || 'Luxury', data.image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=85', data.description || '', ['Prime Location', 'High Ceiling', '24/7 Security']]);
      return res.rows[0];
    } else {
      const newProp = {
        id: memoryStore.properties.length + 1,
        status: 'Available',
        features: ['Prime Location', 'High Ceiling', '24/7 Security'],
        ...data
      };
      memoryStore.properties.unshift(newProp);
      return newProp;
    }
  }
}

async function deleteProperty(id) {
  const numericId = parseInt(id, 10);
  if (isNeonConnected && pool) {
    await pool.query('DELETE FROM properties WHERE id = $1', [numericId]);
    return true;
  }
  memoryStore.properties = memoryStore.properties.filter(p => p.id !== numericId);
  return true;
}

async function getOffPlanProjects() {
  if (isNeonConnected && pool) {
    const res = await pool.query('SELECT * FROM offplan_projects ORDER BY id ASC');
    return res.rows;
  }
  return memoryStore.offplan_projects;
}

async function getOffPlanProjectById(id) {
  const numericId = parseInt(id, 10);
  if (isNeonConnected && pool) {
    const res = await pool.query('SELECT * FROM offplan_projects WHERE id = $1', [numericId]);
    return res.rows[0] || null;
  }
  return memoryStore.offplan_projects.find(p => p.id === numericId) || null;
}

async function saveOffPlanProject(data, id = null) {
  if (id) {
    const numericId = parseInt(id, 10);
    if (isNeonConnected && pool) {
      const res = await pool.query(`
        UPDATE offplan_projects 
        SET title = $1, developer_name = $2, community = $3, starting_price_aed = $4, handover_date = $5, payment_plan = $6, project_type = $7, est_roi = $8, image = $9, overview = $10
        WHERE id = $11 RETURNING *
      `, [data.title, data.developer_name, data.community, parseInt(data.starting_price_aed, 10), data.handover_date, data.payment_plan, data.project_type, data.est_roi, data.image, data.overview, numericId]);
      return res.rows[0];
    } else {
      const idx = memoryStore.offplan_projects.findIndex(o => o.id === numericId);
      if (idx !== -1) {
        memoryStore.offplan_projects[idx] = { ...memoryStore.offplan_projects[idx], ...data, id: numericId };
        return memoryStore.offplan_projects[idx];
      }
    }
  } else {
    if (isNeonConnected && pool) {
      const res = await pool.query(`
        INSERT INTO offplan_projects (developer_name, title, community, community_slug, starting_price_aed, handover_date, payment_plan, project_type, est_roi, image, overview, features)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *
      `, [data.developer_name || 'Omnia Prestige', data.title, data.community, data.community.toLowerCase().replace(/\s+/g, '-'), parseInt(data.starting_price_aed, 10) || 5000000, data.handover_date || 'Q4 2027', data.payment_plan || '60/40 Construction-Linked', data.project_type || 'Architectural Landmark', data.est_roi || '8.5% Net Yield', data.image || 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1600&q=85', data.overview || '', ['Private pool', 'Sky gardens', 'Concierge']]);
      return res.rows[0];
    } else {
      const newProj = {
        id: memoryStore.offplan_projects.length + 1,
        features: ['Private pool', 'Sky gardens', 'Concierge'],
        ...data
      };
      memoryStore.offplan_projects.unshift(newProj);
      return newProj;
    }
  }
}

async function deleteOffPlanProject(id) {
  const numericId = parseInt(id, 10);
  if (isNeonConnected && pool) {
    await pool.query('DELETE FROM offplan_projects WHERE id = $1', [numericId]);
    return true;
  }
  memoryStore.offplan_projects = memoryStore.offplan_projects.filter(p => p.id !== numericId);
  return true;
}

// Create new buyer lead with scoring (0 to 100) & source form tracking
async function createLead(data) {
  const { score, score_label } = calculateLeadScore(data);

  // Assign agent cyclically or based on community
  let agentName = data.agent_name;
  if (!agentName) {
    if (data.preferred_community === 'Palm Jumeirah') agentName = 'Alexander Wright';
    else if (data.preferred_community === 'Downtown' || data.preferred_community === 'Dubai Marina') agentName = 'Elena Rostova';
    else agentName = 'Tariq Al-Mansoor';
  }

  const now = new Date().toISOString();

  if (isNeonConnected && pool) {
    const res = await pool.query(`
      INSERT INTO buyer_leads (name, phone, email, budget_aed, preferred_community, property_type, property_name, source_form, source, status, score, score_label, payment_method, timeframe, agent_name, message, last_activity_date, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      data.name,
      data.phone,
      data.email || null,
      data.budget_aed ? parseInt(data.budget_aed, 10) : null,
      data.preferred_community || null,
      data.property_type || null,
      data.property_name || null,
      data.source_form || 'Website',
      data.source || data.source_form || 'Website',
      'New',
      score,
      score_label,
      data.payment_method || (data.message && data.message.toLowerCase().includes('cash') ? 'Cash' : 'Mortgage'),
      data.timeframe || 'Immediate',
      agentName,
      data.message || null,
      now,
      now
    ]);
    return res.rows[0];
  } else {
    const newLead = {
      id: memoryStore.buyer_leads.length + 1,
      ...data,
      source_form: data.source_form || 'Website',
      source: data.source_form || 'Website',
      status: 'New',
      score,
      score_label,
      agent_name: agentName,
      created_at: now,
      last_activity_date: now
    };
    memoryStore.buyer_leads.unshift(newLead);
    return newLead;
  }
}

// Get all leads (with agent role filtering)
async function getLeads(filters = {}, userRole = 'admin', currentAgentName = '') {
  let list = [];
  if (isNeonConnected && pool) {
    let query = 'SELECT * FROM buyer_leads WHERE 1=1';
    const params = [];

    // Role-based security: Agents only see their own leads
    if (userRole === 'agent' && currentAgentName) {
      params.push(currentAgentName);
      query += ` AND agent_name = $${params.length}`;
    }

    if (filters.status && filters.status !== 'all') {
      params.push(filters.status);
      query += ` AND status = $${params.length}`;
    }

    if (filters.score_label && filters.score_label !== 'all') {
      params.push(filters.score_label);
      query += ` AND score_label = $${params.length}`;
    }

    if (filters.agent && filters.agent !== 'all') {
      params.push(filters.agent);
      query += ` AND agent_name = $${params.length}`;
    }

    if (filters.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length} OR email ILIKE $${params.length} OR preferred_community ILIKE $${params.length} OR property_name ILIKE $${params.length})`;
    }

    query += ' ORDER BY id DESC';
    const res = await pool.query(query, params);
    list = res.rows;
  } else {
    list = [...memoryStore.buyer_leads];
    if (userRole === 'agent' && currentAgentName) {
      list = list.filter(l => l.agent_name === currentAgentName);
    }
    if (filters.status && filters.status !== 'all') {
      list = list.filter(l => l.status === filters.status);
    }
    if (filters.score_label && filters.score_label !== 'all') {
      list = list.filter(l => l.score_label === filters.score_label);
    }
    if (filters.agent && filters.agent !== 'all') {
      list = list.filter(l => l.agent_name === filters.agent);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(l => (l.name && l.name.toLowerCase().includes(q)) || (l.phone && l.phone.includes(q)) || (l.email && l.email.toLowerCase().includes(q)) || (l.preferred_community && l.preferred_community.toLowerCase().includes(q)));
    }
  }
  return list;
}

// Get single lead with its notes
async function getLeadById(id) {
  const numericId = parseInt(id, 10);
  let lead = null;
  let notes = [];

  if (isNeonConnected && pool) {
    const res = await pool.query('SELECT * FROM buyer_leads WHERE id = $1', [numericId]);
    lead = res.rows[0] || null;
    if (lead) {
      const notesRes = await pool.query('SELECT * FROM notes WHERE lead_id = $1 ORDER BY id DESC', [numericId]);
      notes = notesRes.rows;
    }
  } else {
    lead = memoryStore.buyer_leads.find(l => l.id === numericId) || null;
    if (lead) {
      notes = memoryStore.notes.filter(n => n.lead_id === numericId);
    }
  }

  if (lead) lead.notesList = notes;
  return lead;
}

// Update lead stage / assigned agent
async function updateLead(id, updates) {
  const numericId = parseInt(id, 10);
  const now = new Date().toISOString();

  if (isNeonConnected && pool) {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      fields.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }

    fields.push(`last_activity_date = $${idx}`);
    values.push(now);
    idx++;

    values.push(numericId);
    const query = `UPDATE buyer_leads SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await pool.query(query, values);
    return res.rows[0];
  } else {
    const lIdx = memoryStore.buyer_leads.findIndex(l => l.id === numericId);
    if (lIdx !== -1) {
      memoryStore.buyer_leads[lIdx] = {
        ...memoryStore.buyer_leads[lIdx],
        ...updates,
        last_activity_date: now
      };
      return memoryStore.buyer_leads[lIdx];
    }
  }
  return null;
}

// Add note to lead
async function addLeadNote(leadId, author, content) {
  const numericId = parseInt(leadId, 10);
  const now = new Date().toISOString();

  if (isNeonConnected && pool) {
    const res = await pool.query('INSERT INTO notes (lead_id, author, content) VALUES ($1, $2, $3) RETURNING *', [numericId, author, content]);
    await pool.query('UPDATE buyer_leads SET last_activity_date = $1 WHERE id = $2', [now, numericId]);
    return res.rows[0];
  } else {
    const newNote = {
      id: memoryStore.notes.length + 1,
      lead_id: numericId,
      author,
      content,
      created_at: now
    };
    memoryStore.notes.unshift(newNote);
    const l = memoryStore.buyer_leads.find(x => x.id === numericId);
    if (l) l.last_activity_date = now;
    return newNote;
  }
}

// Close deal: Mark lead as 'Won', work out 2% commission, record sale, and mark property as Sold!
async function markLeadWon(leadId, salePriceAed, propertyTitle, agentName) {
  const numericId = parseInt(leadId, 10);
  const price = Number(salePriceAed) || 0;
  const commission = Math.round(price * 0.02); // 2% Commission
  const today = new Date().toISOString().split('T')[0];

  // 1. Update lead stage to Won
  await updateLead(numericId, { status: 'Won' });

  // 2. Mark property as Sold
  if (propertyTitle) {
    if (isNeonConnected && pool) {
      await pool.query('UPDATE properties SET status = $1 WHERE title ILIKE $2', ['Sold', `%${propertyTitle}%`]);
    } else {
      const p = memoryStore.properties.find(x => x.title.toLowerCase().includes(propertyTitle.toLowerCase()));
      if (p) p.status = 'Sold';
    }
  }

  // 3. Record Completed Sale
  const lead = await getLeadById(numericId);
  const buyerName = lead ? lead.name : 'Private VIP Buyer';

  if (isNeonConnected && pool) {
    const res = await pool.query(`
      INSERT INTO completed_sales (property_name, community, sale_price_aed, buyer_name, agent_name, completion_date, commission_aed)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [propertyTitle || 'Prime Dubai Residence', lead ? lead.preferred_community || 'Dubai' : 'Dubai', price, buyerName, agentName || 'Alexander Wright', today, commission]);
    return res.rows[0];
  } else {
    const newSale = {
      id: memoryStore.completed_sales.length + 1,
      property_name: propertyTitle || 'Prime Dubai Residence',
      community: lead ? lead.preferred_community || 'Dubai' : 'Dubai',
      sale_price_aed: price,
      buyer_name: buyerName,
      agent_name: agentName || 'Alexander Wright',
      completion_date: today,
      commission_aed: commission
    };
    memoryStore.completed_sales.unshift(newSale);
    return newSale;
  }
}

// Viewings list & booking
async function getViewings() {
  if (isNeonConnected && pool) {
    const res = await pool.query('SELECT * FROM viewings ORDER BY id DESC');
    return res.rows;
  }
  return memoryStore.viewings;
}

async function createViewing(data) {
  if (isNeonConnected && pool) {
    const res = await pool.query(`
      INSERT INTO viewings (lead_name, property_name, agent_name, viewing_date, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [data.lead_name, data.property_name, data.agent_name || 'Alexander Wright', data.viewing_date, 'Scheduled', data.notes || null]);
    return res.rows[0];
  } else {
    const newViewing = {
      id: memoryStore.viewings.length + 1,
      ...data,
      agent_name: data.agent_name || 'Alexander Wright',
      status: 'Scheduled',
      created_at: new Date().toISOString()
    };
    memoryStore.viewings.unshift(newViewing);
    return newViewing;
  }
}

// Stale Leads: Leads with no activity for 3+ days
async function getStaleLeads() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const allLeads = await getLeads();
  return allLeads.filter(l => {
    if (l.status === 'Won' || l.status === 'Lost') return false;
    const lastDate = l.last_activity_date ? new Date(l.last_activity_date) : new Date(l.created_at);
    return lastDate < threeDaysAgo;
  });
}

// Admin Dashboard Summary Metrics
async function getAdminDashboardStats(userRole = 'admin', agentName = '') {
  const leads = await getLeads({}, userRole, agentName);
  const viewings = await getViewings();
  const sales = isNeonConnected && pool ? (await pool.query('SELECT * FROM completed_sales')).rows : memoryStore.completed_sales;

  // New leads today
  const todayStr = new Date().toISOString().split('T')[0];
  const newLeadsToday = leads.filter(l => l.status === 'New' && l.created_at && l.created_at.startsWith(todayStr)).length;
  const totalNewLeads = leads.filter(l => l.status === 'New').length;

  // Total deal value in pipeline
  const totalPipelineValue = leads.reduce((sum, l) => sum + (Number(l.budget_aed) || 0), 0);

  // Viewings this week
  const viewingsThisWeek = viewings.length;

  // Sales & commission this month
  const totalSalesThisMonth = sales.reduce((sum, s) => sum + (Number(s.sale_price_aed) || 0), 0);
  const totalCommissionThisMonth = sales.reduce((sum, s) => sum + (Number(s.commission_aed) || 0), 0);

  // Stage distribution
  const stages = { 'New': 0, 'Contacted': 0, 'Viewing': 0, 'Offer': 0, 'Won': 0, 'Lost': 0 };
  leads.forEach(l => {
    if (stages[l.status] !== undefined) stages[l.status]++;
    else stages['New']++;
  });

  // Score distribution
  const scores = { 'HOT': 0, 'WARM': 0, 'COLD': 0 };
  leads.forEach(l => {
    if (scores[l.score_label] !== undefined) scores[l.score_label]++;
  });

  return {
    newLeadsToday,
    totalNewLeads,
    totalPipelineValue,
    viewingsThisWeek,
    totalSalesThisMonth,
    totalCommissionThisMonth,
    stages,
    scores,
    totalLeads: leads.length,
    activeProperties: memoryStore.properties.filter(p => p.status !== 'Sold').length
  };
}

module.exports = {
  initDatabase,
  verifyStaffLogin,
  getDevelopers,
  getAgents,
  getProperties,
  getPropertyById,
  saveProperty,
  deleteProperty,
  getOffPlanProjects,
  getOffPlanProjectById,
  saveOffPlanProject,
  deleteOffPlanProject,
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  addLeadNote,
  markLeadWon,
  getViewings,
  createViewing,
  getStaleLeads,
  getAdminDashboardStats
};
