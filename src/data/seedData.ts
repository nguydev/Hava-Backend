/**
 * Seed data for GOODR — ported from the frontend mock (src/mocks/data.ts).
 * Timelines are generated with the same builders the runtime mutations use, so
 * seeded and freshly-created records are structurally identical.
 */
import { makeDeliveryTimeline, makeOrderTimeline } from '../lib/domain';

const IMG = {
  condenser: 'https://images.unsplash.com/photo-1631545805968-2a3d24d0b7c4?auto=format&fit=crop&w=800&q=80',
  industrial: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80',
  heatpump: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
  boiler: 'https://images.unsplash.com/photo-1635048424329-a9bfb146d7aa?auto=format&fit=crop&w=800&q=80',
  airhandler: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80',
  condenser2: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?auto=format&fit=crop&w=800&q=80',
};

/* -------------------------------- Categories ------------------------------ */

export const categories = [
  { id: 'ac-systems', name: 'AC Systems', icon: 'air-conditioner', blurb: 'Split & packaged cooling systems' },
  { id: 'furnaces', name: 'Furnaces', icon: 'fire', blurb: 'Gas & electric heating furnaces' },
  { id: 'heat-pumps', name: 'Heat Pumps', icon: 'sun-snowflake', blurb: 'All-season heating & cooling' },
  { id: 'air-handlers', name: 'Air Handlers', icon: 'fan', blurb: 'Variable-speed indoor air movers' },
  { id: 'mini-splits', name: 'Ductless Mini Splits', icon: 'air-filter', blurb: 'Zoned ductless comfort' },
  { id: 'thermostats', name: 'Thermostats', icon: 'thermostat', blurb: 'Smart & programmable controls' },
  { id: 'rooftop-units', name: 'Rooftop Units', icon: 'home-roof', blurb: 'Commercial packaged RTUs' },
  { id: 'accessories', name: 'Accessories', icon: 'tools', blurb: 'Parts, pads, line sets & more' },
];

/* --------------------------------- Products ------------------------------- */

export const products = [
  {
    id: 'p-goodman-3t',
    name: 'Goodman 3 Ton Split System',
    brand: 'Goodman',
    categoryId: 'ac-systems',
    model: 'GSXH503610',
    capacity: '3 Ton · 36,000 BTU',
    seerRating: '15.2 SEER2',
    efficiency: '15.2 SEER2',
    warranty: '10-Year Parts Limited',
    dimensions: '35.5" H × 29" W × 29" D',
    weight: '181 lb',
    price: 3250,
    availability: 'In Stock',
    image: IMG.condenser,
    rating: 4.6,
    reviews: 128,
    description:
      'Reliable, energy-efficient residential split system with quiet operation and a durable single-stage compressor. A field-favorite workhorse for standard residential retrofits and new installs.',
    specs: [
      { label: 'Compressor', value: 'Single-stage' },
      { label: 'Refrigerant', value: 'R-32' },
      { label: 'Sound Level', value: '71 dB' },
      { label: 'Voltage', value: '208/230V' },
    ],
  },
  {
    id: 'p-daikin-4t',
    name: 'Daikin FIT 4 Ton Condenser',
    brand: 'Daikin',
    categoryId: 'ac-systems',
    model: 'DZ6VSA48',
    capacity: '4 Ton · 48,000 BTU',
    seerRating: '18 SEER2',
    efficiency: '18 SEER2',
    warranty: '12-Year Parts',
    dimensions: '33" H × 31" W × 13" D',
    weight: '176 lb',
    price: 3890,
    availability: 'In Stock',
    image: IMG.condenser2,
    exclusive: true,
    rating: 4.8,
    reviews: 94,
    description:
      'The exclusive Daikin FIT condenser — a slim side-discharge inverter unit ideal for tight-lot residential installs where footprint matters. Pairs with the Daikin FIT air handler.',
    specs: [
      { label: 'Compressor', value: 'Inverter' },
      { label: 'Discharge', value: 'Side' },
      { label: 'Sound Level', value: '62 dB' },
      { label: 'Refrigerant', value: 'R-32' },
    ],
  },
  {
    id: 'p-lennox-hp',
    name: 'Amana 2.5 Ton Heat Pump',
    brand: 'Amana',
    categoryId: 'heat-pumps',
    model: 'ASZC402510',
    capacity: '2.5 Ton · 30,000 BTU',
    seerRating: '17.2 SEER2',
    efficiency: '17.2 SEER2 · 8.1 HSPF2',
    warranty: '10-Year Parts + Lifetime Compressor',
    dimensions: '39" H × 35" W × 35" D',
    weight: '298 lb',
    price: 4100,
    availability: 'Limited Stock',
    image: IMG.heatpump,
    rating: 4.9,
    reviews: 61,
    description:
      'High-efficiency two-stage Amana heat pump with a durable, all-aluminum coil and a lifetime compressor warranty. Quiet, dependable all-season comfort for residential retrofits.',
    specs: [
      { label: 'Compressor', value: 'Two-stage' },
      { label: 'Refrigerant', value: 'R-32' },
      { label: 'Sound Level', value: '59 dB' },
      { label: 'Warranty', value: 'Lifetime compressor' },
    ],
  },
  {
    id: 'p-bosch-hp',
    name: 'Daikin FIT 3 Ton Heat Pump',
    brand: 'Daikin',
    categoryId: 'heat-pumps',
    model: 'DZ6VSA36',
    capacity: '3 Ton · 36,000 BTU',
    seerRating: '20.5 SEER2',
    efficiency: '20.5 SEER2 · 10 HSPF2',
    warranty: '12-Year Parts (registered)',
    dimensions: '33" H × 31" W × 13" D',
    weight: '198 lb',
    price: 3760,
    availability: 'In Stock',
    image: IMG.heatpump,
    exclusive: true,
    rating: 4.8,
    reviews: 73,
    description:
      'Part of the exclusive Daikin FIT lineup — a slim side-discharge inverter heat pump with strong low-ambient heating and a small footprint for tight-lot installs.',
    specs: [
      { label: 'Compressor', value: 'Inverter (variable-speed)' },
      { label: 'Refrigerant', value: 'R-32' },
      { label: 'Sound Level', value: '58 dB' },
      { label: 'Low-Ambient Heat', value: 'To 5°F' },
    ],
  },
  {
    id: 'p-daikinfit-ah',
    name: 'Daikin FIT Variable-Speed Air Handler',
    brand: 'Daikin',
    categoryId: 'air-handlers',
    model: 'DAM97A0361',
    capacity: '3 Ton · 36,000 BTU',
    efficiency: 'Inverter ECM',
    warranty: '12-Year Parts (registered)',
    dimensions: '49" H × 21" W × 21" D',
    weight: '128 lb',
    price: 2090,
    availability: 'In Stock',
    image: IMG.airhandler,
    exclusive: true,
    rating: 4.9,
    reviews: 47,
    description:
      'The matched air handler for the exclusive Daikin FIT system. Inverter-driven ECM blower for precise airflow, superior dehumidification, and whisper-quiet comfort.',
    specs: [
      { label: 'Motor', value: 'Inverter ECM' },
      { label: 'Coil', value: 'All-aluminum' },
      { label: 'Cabinet', value: 'Insulated, corrosion-resistant' },
      { label: 'Match', value: 'Daikin FIT condensers' },
    ],
  },
  {
    id: 'p-trane-ah',
    name: 'Daikin Variable-Speed Air Handler',
    brand: 'Daikin',
    categoryId: 'air-handlers',
    model: 'DAM90361',
    capacity: '3 Ton · 36,000 BTU',
    efficiency: 'ECM Motor',
    warranty: '12-Year Parts (registered)',
    dimensions: '53" H × 22" W × 21" D',
    weight: '135 lb',
    price: 1850,
    availability: 'In Stock',
    image: IMG.airhandler,
    rating: 4.5,
    reviews: 88,
    description:
      'Durable variable-speed air handler with a high-efficiency ECM blower motor. Precision comfort and enhanced humidity control for residential systems.',
    specs: [
      { label: 'Motor', value: 'Variable-speed ECM' },
      { label: 'Coil', value: 'All-aluminum' },
      { label: 'Cabinet', value: 'Insulated, corrosion-resistant' },
      { label: 'Filter', value: 'Field-installed rack' },
    ],
  },
  {
    id: 'p-goodman-furnace',
    name: 'Goodman 80% Gas Furnace',
    brand: 'Goodman',
    categoryId: 'furnaces',
    model: 'GR9S800603BN',
    capacity: '60,000 BTU Input',
    fuelType: 'Natural Gas / LP',
    efficiency: '80% AFUE',
    warranty: '10-Year Parts + Lifetime Heat Exchanger',
    dimensions: '34.5" H × 17.5" W × 28" D',
    weight: '110 lb',
    price: 1420,
    availability: 'In Stock',
    image: IMG.industrial,
    rating: 4.4,
    reviews: 142,
    description:
      'Dependable single-stage gas furnace with a durable tubular stainless-steel heat exchanger. Multi-position install and quiet multi-speed blower.',
    specs: [
      { label: 'Stages', value: 'Single-stage' },
      { label: 'Ignition', value: 'Silicon nitride igniter' },
      { label: 'Blower', value: 'Multi-speed' },
      { label: 'Orientation', value: 'Multi-position' },
    ],
  },
  {
    id: 'p-mitsubishi-mini',
    name: 'Daikin 1.5 Ton Ductless Mini Split',
    brand: 'Daikin',
    categoryId: 'mini-splits',
    model: 'FTXB18AXVJU',
    capacity: '1.5 Ton · 18,000 BTU',
    seerRating: '20.3 SEER2',
    efficiency: '20.3 SEER2',
    warranty: '12-Year Parts (registered)',
    dimensions: 'Indoor 12" H × 43" W × 9" D',
    weight: '24 lb (indoor)',
    price: 2180,
    availability: 'In Stock',
    image: IMG.condenser,
    rating: 4.8,
    reviews: 205,
    description:
      'Single-zone Daikin ductless heat pump system with hyper-quiet indoor operation. Ideal for additions, garages, and spaces without existing ductwork.',
    specs: [
      { label: 'Zones', value: 'Single-zone' },
      { label: 'Refrigerant', value: 'R-32' },
      { label: 'Indoor Sound', value: '19 dB' },
      { label: 'Control', value: 'Wireless remote + app' },
    ],
  },
  {
    id: 'p-honeywell-t6',
    name: 'Amana Programmable Thermostat',
    brand: 'Amana',
    categoryId: 'thermostats',
    model: 'APNT-WF2',
    capacity: 'Up to 2H/1C',
    efficiency: 'ENERGY STAR',
    warranty: '5-Year Limited',
    dimensions: '3.9" × 3.9" × 1.1"',
    weight: '0.4 lb',
    price: 129,
    availability: 'In Stock',
    image: IMG.industrial,
    rating: 4.5,
    reviews: 341,
    description:
      'Reliable Wi-Fi programmable thermostat with a clean install and flexible staging. A dependable spec for standard residential Amana and Goodman systems.',
    specs: [
      { label: 'Connectivity', value: 'Wi-Fi' },
      { label: 'Staging', value: '2 Heat / 1 Cool' },
      { label: 'Backlight', value: 'Adjustable' },
      { label: 'Scheduling', value: '7-day' },
    ],
  },
  {
    id: 'p-carrier-rtu',
    name: 'Daikin 5 Ton Packaged Rooftop Unit',
    brand: 'Daikin',
    categoryId: 'rooftop-units',
    model: 'DSC060',
    capacity: '5 Ton · 60,000 BTU',
    efficiency: '14 IEER',
    warranty: '5-Year Compressor',
    dimensions: '46" H × 74" W × 60" D',
    weight: '695 lb',
    price: null,
    availability: 'Special Order',
    image: IMG.industrial,
    rating: 4.6,
    reviews: 22,
    description:
      'Daikin light-commercial packaged rooftop unit. Configurable economizer and gas heat options. Pricing varies by configuration — request a quote.',
    specs: [
      { label: 'Stages', value: '2-stage cooling' },
      { label: 'Economizer', value: 'Optional' },
      { label: 'Gas Heat', value: 'Available' },
      { label: 'Curb', value: '14 in. roof curb' },
    ],
  },
  {
    id: 'p-lineset',
    name: 'Copper Line Set — 3/8" × 3/4" (25 ft)',
    brand: 'GOODR',
    categoryId: 'accessories',
    model: 'LS-3834-25',
    capacity: '25 ft',
    warranty: '1-Year Limited',
    dimensions: '25 ft coil',
    weight: '14 lb',
    price: 89,
    availability: 'In Stock',
    image: IMG.condenser2,
    rating: 4.3,
    reviews: 76,
    description:
      'Insulated copper line set for residential split-system installs. Pre-flared ends and 1/2" closed-cell insulation on the suction line.',
    specs: [
      { label: 'Liquid Line', value: '3/8"' },
      { label: 'Suction Line', value: '3/4"' },
      { label: 'Insulation', value: '1/2" closed-cell' },
      { label: 'Length', value: '25 ft' },
    ],
  },
  {
    id: 'p-eq-pad',
    name: 'Composite Equipment Pad — 36" × 36"',
    brand: 'GOODR',
    categoryId: 'accessories',
    model: 'PAD-3636',
    capacity: '36" × 36" × 3"',
    warranty: 'Lifetime',
    dimensions: '36" × 36" × 3"',
    weight: '18 lb',
    price: 46,
    availability: 'In Stock',
    image: IMG.industrial,
    rating: 4.6,
    reviews: 54,
    description:
      'Lightweight, rot-proof composite condenser pad. Will not crack, chip, or absorb water — a durable base for outdoor equipment.',
    specs: [
      { label: 'Material', value: 'Recycled composite' },
      { label: 'Thickness', value: '3 in.' },
      { label: 'Load', value: 'Up to 500 lb' },
      { label: 'Finish', value: 'Textured non-slip' },
    ],
  },
];

/* ----------------------------- Users & drivers ---------------------------- */

export const users = [
  {
    id: 'u-contractor',
    role: 'contractor',
    name: 'Michael Reyes',
    email: 'michael@summitcomfort.co',
    phone: '(303) 555-0100',
    company: 'Summit Comfort Systems',
    businessType: 'Commercial Contractor',
    approval: 'Approved',
    address: '740 Industrial Pkwy, Denver, CO 80216',
    rating: 4.8,
    isDemo: true,
    passwordHash: null,
  },
  {
    id: 'u-driver',
    role: 'driver',
    name: 'Carlos Mendez',
    email: 'carlos.m@goodr.com',
    phone: '(720) 555-0199',
    vehicle: 'Isuzu NPR Box Truck · GD-7',
    driverStatus: 'On Delivery',
    completedDeliveries: 312,
    rating: 4.9,
    isDemo: true,
    passwordHash: null,
  },
];

const driverCarlos = {
  id: 'd-carlos',
  name: 'Carlos Mendez',
  phone: '(720) 555-0199',
  vehicle: 'Isuzu NPR · MH-7',
  rating: 4.9,
};

const driverAnita = {
  id: 'd-anita',
  name: 'Anita Shaw',
  phone: '(720) 555-0155',
  vehicle: 'Ford Transit · MH-3',
  rating: 4.8,
};

/* -------------------------------- Addresses ------------------------------- */

export const addresses: any[] = [];

/* --------------------------------- Orders --------------------------------- */

export const orders: any[] = [];

/* --------------------------------- Quotes --------------------------------- */

export const quotes: any[] = [];

/* -------------------------------- Deliveries ------------------------------ */

export const deliveries: any[] = [
  {
    id: 'DEL-1061',
    orderId: 'MH-1061',
    driverId: 'u-driver',
    driverName: 'Carlos Mendez',
    status: 'En Route',
    priority: 'Urgent',
    company: 'Summit Comfort Systems',
    contractorName: 'Michael Reyes',
    contactPhone: '(303) 555-0100',
    jobSite: 'Apex Medical Center — Rooftop Bay 4',
    address: {
      id: 'addr-1',
      label: 'Apex Medical Center',
      line1: '14200 E Colfax Ave',
      city: 'Aurora',
      state: 'CO',
      zip: '80011',
      contactName: 'Michael Reyes',
      contactPhone: '(303) 555-0100',
    },
    timeWindow: 'Morning (8:00 AM - 11:00 AM)',
    scheduledDate: new Date().toLocaleDateString(),
    eta: 'Today · 45 mins',
    distanceMi: 14.2,
    instructions: 'Use rear loading dock #2. Call site manager upon arrival.',
    items: [
      { productId: 'p-goodman-3t', name: 'Goodman 3 Ton Split System', brand: 'Goodman', quantity: 2, unitPrice: 3250 },
    ],
    notes: 'Crane scheduled for 10:30 AM lift.',
    timeline: makeDeliveryTimeline('En Route'),
  },
  {
    id: 'DEL-1062',
    orderId: 'MH-1062',
    driverId: 'u-driver',
    driverName: 'Carlos Mendez',
    status: 'Assigned',
    priority: 'Normal',
    company: 'Alpine HVAC Corp',
    contractorName: 'David Miller',
    contactPhone: '(720) 555-0188',
    jobSite: 'Highland Park Condo Project',
    address: {
      id: 'addr-2',
      label: 'Highland Park Site',
      line1: '2800 Speer Blvd',
      city: 'Denver',
      state: 'CO',
      zip: '80211',
      contactName: 'David Miller',
      contactPhone: '(720) 555-0188',
    },
    timeWindow: 'Afternoon (1:00 PM - 4:00 PM)',
    scheduledDate: new Date().toLocaleDateString(),
    eta: 'Today · 3.5 hrs',
    distanceMi: 8.7,
    instructions: 'Gate code #4492. Liftgate required.',
    items: [
      { productId: 'p-daikin-4t', name: 'Daikin FIT 4 Ton Condenser', brand: 'Daikin', quantity: 1, unitPrice: 3890 },
      { productId: 'p-lineset', name: 'Copper Line Set — 3/8" × 3/4"', brand: 'GOODR', quantity: 2, unitPrice: 89 },
    ],
    notes: 'Contact foreman on arrival.',
    timeline: makeDeliveryTimeline('Assigned'),
  },
  {
    id: 'DEL-1063',
    orderId: 'MH-1063',
    driverId: null,
    driverName: null,
    status: 'Available',
    priority: 'Normal',
    company: 'Front Range Heating',
    contractorName: 'Sarah Jenkins',
    contactPhone: '(303) 555-0144',
    jobSite: 'Cherry Creek Residential Retrofit',
    address: {
      id: 'addr-3',
      label: 'Cherry Creek Site',
      line1: '500 University Blvd',
      city: 'Denver',
      state: 'CO',
      zip: '80206',
      contactName: 'Sarah Jenkins',
      contactPhone: '(303) 555-0144',
    },
    timeWindow: 'Today · Flexible',
    scheduledDate: new Date().toLocaleDateString(),
    eta: 'Ready for Pick Up',
    distanceMi: 6.4,
    instructions: 'Warehouse pickup at Depot B.',
    items: [
      { productId: 'p-bosch-hp', name: 'Daikin FIT 3 Ton Heat Pump', brand: 'Daikin', quantity: 1, unitPrice: 3760 },
    ],
    notes: 'Open delivery available for any driver to claim.',
    timeline: makeDeliveryTimeline('Unassigned'),
  },
  {
    id: 'DEL-1064',
    orderId: 'MH-1064',
    driverId: null,
    driverName: null,
    status: 'Available',
    priority: 'Urgent',
    company: 'Mile High Mechanical',
    contractorName: 'Robert Vance',
    contactPhone: '(720) 555-0122',
    jobSite: 'Downtown Commercial Plaza',
    address: {
      id: 'addr-4',
      label: 'Downtown Plaza',
      line1: '1600 17th St',
      city: 'Denver',
      state: 'CO',
      zip: '80202',
      contactName: 'Robert Vance',
      contactPhone: '(720) 555-0122',
    },
    timeWindow: 'Today · ASAP',
    scheduledDate: new Date().toLocaleDateString(),
    eta: 'Ready for Pick Up',
    distanceMi: 11.8,
    instructions: 'Express delivery. Park in alleyway delivery zone.',
    items: [
      { productId: 'p-honeywell-t6', name: 'Amana Programmable Thermostat', brand: 'Amana', quantity: 5, unitPrice: 129 },
      { productId: 'p-eq-pad', name: 'Composite Equipment Pad', brand: 'GOODR', quantity: 3, unitPrice: 46 },
    ],
    notes: 'Urgent commercial repair job.',
    timeline: makeDeliveryTimeline('Unassigned'),
  },
];

/* ------------------------------ Notifications ----------------------------- */

export const notifications: any[] = [];

/* ----------------------------- Payment Methods ---------------------------- */

export const paymentMethods: any[] = [];

/* -------------------------------- Invoices -------------------------------- */

export const invoices: any[] = [];
