// Mock data for Warehouse Travel. Everything is related by id:
// client → agent, reservation → client + package, invoice → reservations, payment → invoice.

export const TODAY = '2026-09-28';
export const TAX_RATE = 0.05; // "Impuestos y tasas"
export const CORPORATE_DISCOUNT = 0.15;

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;

export const money = (n) => '$' + Math.round(n || 0).toLocaleString('es-CO');
export const moneyShort = (n) => {
  if (n >= 1e9) return '$' + (n / 1e9).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' mil M';
  if (n >= 1e6) return '$' + (n / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M';
  return money(n);
};
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const fmtDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
export const addDays = (iso, n) => {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const TRANSPORT = { air: 'Aéreo', train: 'Tren', sea: 'Marítimo', land: 'Terrestre' };
export const INSURANCE = {
  Básico: 'Asistencia médica hasta USD 30.000 en Colombia, equipaje y cancelación por fuerza mayor.',
  Internacional: 'Asistencia médica hasta USD 60.000, COVID-19, equipaje, demora de vuelo y cancelación.',
  Total: 'Cobertura médica hasta USD 150.000, cancelación por cualquier causa (75%), deportes y equipaje premium.',
};

// Price quote for a package and a number of travelers. List price comes from oldPrice when on offer.
export function quote(pkg, travelers = 1) {
  const list = pkg.oldPrice || pkg.price;
  const subtotal = list * travelers;
  const discount = (list - pkg.price) * travelers;
  const taxes = Math.round((subtotal - discount) * TAX_RATE);
  return { unit: pkg.price, list, subtotal, discount, taxes, total: subtotal - discount + taxes };
}

// Totals for an invoice made of whole packages, with an optional extra discount rate.
export function invoiceTotals(items, discountRate = 0) {
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const discount = Math.round(subtotal * discountRate);
  const taxes = Math.round((subtotal - discount) * TAX_RATE);
  return { subtotal, discount, taxes, total: subtotal - discount + taxes };
}

export const agents = [
  { id: 'a1', name: 'Carlos Rincón', email: 'carlos.rincon@warehousetravel.co', region: 'Bogotá', status: 'Activo', conversion: 0.38, sales: 64200000, joined: '2022-02-01' },
  { id: 'a2', name: 'Valentina Ortiz', email: 'valentina.ortiz@warehousetravel.co', region: 'Medellín', status: 'Activo', conversion: 0.34, sales: 58900000, joined: '2021-08-16' },
  { id: 'a3', name: 'Andrés Mejía', email: 'andres.mejia@warehousetravel.co', region: 'Cali', status: 'Activo', conversion: 0.29, sales: 41300000, joined: '2023-01-09' },
  { id: 'a4', name: 'Juliana Restrepo', email: 'juliana.restrepo@warehousetravel.co', region: 'Barranquilla', status: 'Activo', conversion: 0.31, sales: 47600000, joined: '2022-11-21' },
  { id: 'a5', name: 'Mateo Salazar', email: 'mateo.salazar@warehousetravel.co', region: 'Bucaramanga', status: 'Inactivo', conversion: 0.22, sales: 36500000, joined: '2024-04-02' },
];

export const packages = [
  {
    id: 'p1', name: 'Cartagena amurallada', destination: 'Cartagena', country: 'Colombia', code: 'CTG', origin: 'BOG',
    image: img('1583531352515-8884af319dc1'), days: 5, nights: 4, price: 2890000, oldPrice: 3390000, rating: 4.8, reviews: 412, status: 'Activo', sales: 186, featured: true,
    description: 'Calles coloniales, atardeceres en la muralla y un día completo en Islas del Rosario.',
    transport: { type: 'air', carrier: 'Avianca', detail: 'Vuelo directo BOG → CTG, 1 h 25 min. Equipaje de 23 kg incluido.' },
    lodging: { type: 'Hotel', name: 'Hotel Muralla Real', stars: 5, nights: 4 },
    car: { category: 'Económico', model: 'Kia Picanto o similar' },
    insurance: 'Básico',
    departures: ['2026-10-16', '2026-11-20', '2026-12-04', '2027-01-15'],
  },
  {
    id: 'p2', name: 'San Andrés todo incluido', destination: 'San Andrés', country: 'Colombia', code: 'ADZ', origin: 'BOG',
    image: img('1506929562872-bb421503ef21'), days: 6, nights: 5, price: 3450000, oldPrice: null, rating: 4.7, reviews: 530, status: 'Activo', sales: 214, featured: true,
    description: 'El mar de los siete colores con plan todo incluido, tour por Johnny Cay y el Acuario.',
    transport: { type: 'air', carrier: 'LATAM', detail: 'Vuelo directo BOG → ADZ, 2 h 05 min. Equipaje de 23 kg incluido.' },
    lodging: { type: 'Hotel', name: 'Hotel Arrecife Azul', stars: 4, nights: 5 },
    car: null,
    insurance: 'Básico',
    departures: ['2026-10-30', '2026-11-13', '2026-12-18', '2027-02-05'],
  },
  {
    id: 'p3', name: 'Medellín, eterna primavera', destination: 'Medellín', country: 'Colombia', code: 'MDE', origin: 'BOG',
    image: img('1599413987323-b2b8c0d7d9c8'), days: 4, nights: 3, price: 1290000, oldPrice: null, rating: 4.6, reviews: 288, status: 'Activo', sales: 158,
    description: 'Comuna 13, Guatapé y la escena gastronómica de El Poblado, con auto para moverte a tu ritmo.',
    transport: { type: 'land', carrier: 'Expreso Bolivariano', detail: 'Bus premium BOG → MDE, 9 h con sillas reclinables y wifi.' },
    lodging: { type: 'Hostal', name: 'Casa Laureles Hostal Boutique', stars: 3, nights: 3 },
    car: { category: 'SUV', model: 'Renault Duster o similar' },
    insurance: 'Básico',
    departures: ['2026-10-09', '2026-11-06', '2026-12-11'],
  },
  {
    id: 'p4', name: 'Cancún y Riviera Maya', destination: 'Cancún', country: 'México', code: 'CUN', origin: 'BOG',
    image: img('1510097467424-192d713fd8b2'), days: 7, nights: 6, price: 5690000, oldPrice: 6490000, rating: 4.9, reviews: 689, status: 'Activo', sales: 241, featured: true,
    description: 'Playas del Caribe mexicano, cenotes y Tulum con auto para recorrer la Riviera Maya.',
    transport: { type: 'air', carrier: 'Viva Aerobus', detail: 'Vuelo directo BOG → CUN, 3 h 20 min. Equipaje de 25 kg incluido.' },
    lodging: { type: 'Hotel', name: 'Solaz Riviera Resort', stars: 5, nights: 6 },
    car: { category: 'SUV', model: 'Jeep Compass o similar' },
    insurance: 'Internacional',
    departures: ['2026-11-14', '2026-12-12', '2027-01-23', '2027-03-06'],
  },
  {
    id: 'p5', name: 'Madrid y Toledo', destination: 'Madrid', country: 'España', code: 'MAD', origin: 'BOG',
    image: img('1539037116277-4db20889f2d4'), days: 9, nights: 8, price: 8990000, oldPrice: null, rating: 4.8, reviews: 342, status: 'Activo', sales: 97,
    description: 'Museos del Prado y Reina Sofía, tapas en La Latina y una escapada a la ciudad imperial de Toledo.',
    transport: { type: 'air', carrier: 'Iberia', detail: 'Vuelo directo BOG → MAD, 10 h 05 min. Equipaje de 23 kg incluido.' },
    lodging: { type: 'Hotel', name: 'Hotel Gran Vía Palacio', stars: 4, nights: 8 },
    car: { category: 'Premium', model: 'Audi A4 o similar' },
    insurance: 'Internacional',
    departures: ['2026-10-24', '2027-02-06', '2027-04-10'],
  },
  {
    id: 'p6', name: 'Miami Beach y Everglades', destination: 'Miami', country: 'Estados Unidos', code: 'MIA', origin: 'BOG',
    image: img('1533106497176-45ae19e68ba2'), days: 6, nights: 5, price: 4890000, oldPrice: 5590000, rating: 4.7, reviews: 455, status: 'Activo', sales: 173, featured: true,
    description: 'Art Deco en South Beach, compras en Brickell y un recorrido en aerobote por los Everglades.',
    transport: { type: 'air', carrier: 'American Airlines', detail: 'Vuelo directo BOG → MIA, 3 h 40 min. Equipaje de 23 kg incluido.' },
    lodging: { type: 'Hotel', name: 'Ocean Drive Suites', stars: 4, nights: 5 },
    car: { category: 'Premium', model: 'Ford Mustang convertible o similar' },
    insurance: 'Internacional',
    departures: ['2026-10-22', '2026-12-10', '2027-01-29'],
  },
  {
    id: 'p7', name: 'París esencial', destination: 'París', country: 'Francia', code: 'CDG', origin: 'BOG',
    image: img('1502602898657-3e91760cbb34'), days: 8, nights: 7, price: 9450000, oldPrice: null, rating: 4.9, reviews: 377, status: 'Activo', sales: 88,
    description: 'Louvre sin filas, crucero por el Sena y un día en Versalles. Seguro total incluido.',
    transport: { type: 'air', carrier: 'Air France', detail: 'Vuelo directo BOG → CDG, 10 h 45 min. Equipaje de 23 kg incluido.' },
    lodging: { type: 'Hotel', name: 'Maison Saint-Germain', stars: 4, nights: 7 },
    car: null,
    insurance: 'Total',
    departures: ['2026-10-18', '2027-03-19', '2027-05-14'],
  },
  {
    id: 'p8', name: 'Roma y la Costa Amalfitana', destination: 'Roma', country: 'Italia', code: 'FCO', origin: 'BOG',
    image: img('1552832230-c0197dd311b5'), days: 10, nights: 9, price: 10890000, oldPrice: 11990000, rating: 4.9, reviews: 264, status: 'Activo', sales: 76, featured: true,
    description: 'El Coliseo y el Vaticano, y luego la carretera de Amalfi en un auto premium.',
    transport: { type: 'air', carrier: 'ITA Airways', detail: 'Vuelo BOG → FCO con una escala en Madrid, 13 h 30 min.' },
    lodging: { type: 'Hotel', name: 'Palazzo Navona', stars: 5, nights: 9 },
    car: { category: 'Premium', model: 'Alfa Romeo Giulia o similar' },
    insurance: 'Total',
    departures: ['2027-04-12', '2027-05-21', '2027-06-18'],
  },
  {
    id: 'p9', name: 'Eje Cafetero en familia', destination: 'Eje Cafetero', country: 'Colombia', code: 'PEI', origin: 'BOG',
    image: img('1447933601403-0c6688de566e'), days: 5, nights: 4, price: 1890000, oldPrice: 2190000, rating: 4.6, reviews: 198, status: 'Activo', sales: 132,
    description: 'Valle de Cocora, termales de Santa Rosa y una finca cafetera con catación guiada.',
    transport: { type: 'land', carrier: 'Transportes Flota Occidental', detail: 'Bus ejecutivo BOG → Pereira, 8 h 30 min.' },
    lodging: { type: 'Hostal', name: 'Hacienda Buenavista Hostal', stars: 3, nights: 4 },
    car: { category: 'SUV', model: 'Toyota Fortuner o similar' },
    insurance: 'Básico',
    departures: ['2026-11-02', '2026-12-26', '2027-01-08'],
  },
  {
    id: 'p10', name: 'Crucero Caribe: Aruba y Curazao', destination: 'Aruba', country: 'Aruba', code: 'AUA', origin: 'CTG',
    image: img('1548574505-5e239809ee19'), days: 8, nights: 7, price: 6790000, oldPrice: null, rating: 4.5, reviews: 221, status: 'Activo', sales: 64,
    description: 'Zarpa desde Cartagena con paradas en Aruba, Curazao y Bonaire. Camarote con balcón.',
    transport: { type: 'sea', carrier: 'Caribbean Pearl Cruises', detail: 'Crucero de 7 noches desde el puerto de Cartagena, pensión completa.' },
    lodging: { type: 'Hotel', name: 'Camarote con balcón + 1 noche en Hotel Bocagrande', stars: 4, nights: 1 },
    car: null,
    insurance: 'Internacional',
    departures: ['2026-12-20', '2027-02-14'],
  },
  {
    id: 'p11', name: 'Madrid y Barcelona en tren', destination: 'Barcelona', country: 'España', code: 'BCN', origin: 'MAD',
    image: img('1583422409516-2895a77efded'), days: 10, nights: 9, price: 9790000, oldPrice: null, rating: 4.8, reviews: 156, status: 'Activo', sales: 58,
    description: 'Dos capitales conectadas en alta velocidad: Gaudí, el Barrio Gótico y el Mediterráneo.',
    transport: { type: 'train', carrier: 'Renfe AVE', detail: 'Vuelo BOG → MAD y tren de alta velocidad MAD → BCN, 2 h 30 min.' },
    lodging: { type: 'Hotel', name: 'Hotel Passeig Modernista', stars: 4, nights: 9 },
    car: null,
    insurance: 'Internacional',
    departures: ['2027-01-15', '2027-03-12'],
  },
  {
    id: 'p12', name: 'Cusco y Machu Picchu', destination: 'Cusco', country: 'Perú', code: 'CUZ', origin: 'LIM',
    image: img('1587595431973-160d0d94add1'), days: 6, nights: 5, price: 4390000, oldPrice: 4790000, rating: 4.9, reviews: 318, status: 'Inactivo', sales: 71,
    description: 'Valle Sagrado, tren panorámico a Aguas Calientes y ascenso a Machu Picchu con guía.',
    transport: { type: 'train', carrier: 'PeruRail Vistadome', detail: 'Vuelo BOG → CUZ y tren panorámico Ollantaytambo → Aguas Calientes.' },
    lodging: { type: 'Hotel', name: 'Casona del Inka', stars: 4, nights: 5 },
    car: { category: 'Económico', model: 'Hyundai Accent o similar' },
    insurance: 'Total',
    departures: ['2026-10-22', '2027-05-07'],
  },
];

export const clients = [
  { id: 'c1', first: 'Laura', last: 'Gómez Pardo', doc: 'CC 1.020.456.789', email: 'laura.gomez@correo.co', phone: '310 555 0142', company: null, nit: null, agentId: 'a1', status: 'Activo', since: '2024-03-12', lastActivity: '2026-09-26', city: 'Bogotá' },
  { id: 'c2', first: 'Andrés Felipe', last: 'Ruiz', doc: 'CC 80.234.118', email: 'afruiz@correo.co', phone: '315 555 0199', company: null, nit: null, agentId: 'a1', status: 'Activo', since: '2023-07-04', lastActivity: '2026-09-25', city: 'Bogotá' },
  { id: 'c3', first: 'Catalina', last: 'Herrera', doc: 'CC 52.876.330', email: 'catalina.herrera@andinalogistica.co', phone: '601 555 0110', company: 'Andina Logística S.A.S.', nit: '901.234.567-8', agentId: 'a1', status: 'Activo', since: '2022-10-18', lastActivity: '2026-09-27', city: 'Bogotá' },
  { id: 'c4', first: 'Santiago', last: 'Morales', doc: 'CC 1.017.223.908', email: 'santi.morales@correo.co', phone: '300 555 0177', company: null, nit: null, agentId: 'a2', status: 'Activo', since: '2025-01-22', lastActivity: '2026-09-24', city: 'Medellín' },
  { id: 'c5', first: 'María José', last: 'Castaño', doc: 'CC 43.998.215', email: 'mjcastano@grupocafetal.com', phone: '604 555 0133', company: 'Grupo Cafetal S.A.', nit: '900.765.432-1', agentId: 'a2', status: 'Activo', since: '2023-02-28', lastActivity: '2026-09-20', city: 'Manizales' },
  { id: 'c6', first: 'Daniel', last: 'Ospina', doc: 'CC 16.789.402', email: 'dospina@correo.co', phone: '317 555 0120', company: null, nit: null, agentId: 'a3', status: 'Inactivo', since: '2022-05-09', lastActivity: '2026-07-29', city: 'Cali' },
  { id: 'c7', first: 'Valeria', last: 'Quintero', doc: 'CC 1.032.554.671', email: 'vale.quintero@correo.co', phone: '312 555 0164', company: null, nit: null, agentId: 'a1', status: 'Activo', since: '2025-06-13', lastActivity: '2026-09-22', city: 'Bogotá' },
  { id: 'c8', first: 'Felipe', last: 'Arango', doc: 'CC 71.654.329', email: 'felipe.arango@nexodigital.co', phone: '605 555 0188', company: 'Nexo Digital S.A.S.', nit: '901.555.210-3', agentId: 'a4', status: 'Activo', since: '2024-09-01', lastActivity: '2026-09-23', city: 'Barranquilla' },
  { id: 'c9', first: 'Isabella', last: 'Duarte', doc: 'CC 1.098.776.540', email: 'isa.duarte@correo.co', phone: '318 555 0105', company: null, nit: null, agentId: 'a5', status: 'Activo', since: '2025-11-30', lastActivity: '2026-09-18', city: 'Bucaramanga' },
  { id: 'c10', first: 'Juan Pablo', last: 'Cárdenas', doc: 'CC 79.332.910', email: 'jpcardenas@correo.co', phone: '313 555 0157', company: null, nit: null, agentId: 'a1', status: 'Inactivo', since: '2021-12-06', lastActivity: '2026-05-14', city: 'Bogotá' },
  { id: 'c11', first: 'Sofía', last: 'Mendoza', doc: 'CC 1.020.887.113', email: 'sofia.mendoza@tropicalfoods.co', phone: '601 555 0171', company: 'Tropical Foods Ltda.', nit: '800.321.987-4', agentId: 'a1', status: 'Activo', since: '2023-04-17', lastActivity: '2026-09-21', city: 'Bogotá' },
];

const pk = (id) => packages.find((p) => p.id === id);
const r = (id, clientId, packageId, date, travelers, status, createdAt, extra = {}) => ({
  id, clientId, packageId, date, travelers, status, createdAt,
  orderId: 'ORD-2026-' + id.slice(4).padStart(5, '0'),
  total: quote(pk(packageId), travelers).total,
  ...extra,
});

export const reservations = [
  r('RES-8801', 'c1', 'p4', '2026-11-14', 2, 'Pagada', '2026-08-30'),
  r('RES-8795', 'c1', 'p1', '2026-06-20', 2, 'Pagada', '2026-05-02'),
  r('RES-8810', 'c1', 'p5', '2027-02-06', 2, 'Reservada', '2026-09-26'),
  r('RES-8812', 'c2', 'p6', '2026-12-10', 3, 'Cancelación pendiente', '2026-09-04', { prevStatus: 'Pagada' }),
  r('RES-8790', 'c3', 'p7', '2026-10-18', 4, 'Pagada', '2026-07-19'),
  r('RES-8805', 'c4', 'p2', '2026-10-30', 2, 'Cancelación pendiente', '2026-09-10', { prevStatus: 'Pagada' }),
  r('RES-8808', 'c5', 'p9', '2026-11-02', 6, 'Pagada', '2026-09-12'),
  r('RES-8811', 'c7', 'p8', '2027-04-12', 2, 'Reservada', '2026-09-22'),
  r('RES-8799', 'c8', 'p10', '2026-12-20', 2, 'Cancelación pendiente', '2026-08-21', { prevStatus: 'Pagada' }),
  r('RES-8803', 'c9', 'p12', '2026-10-22', 1, 'Pagada', '2026-09-01'),
  r('RES-8797', 'c11', 'p3', '2026-09-05', 5, 'Pagada', '2026-08-02'),
  r('RES-8806', 'c3', 'p1', '2026-11-20', 3, 'Reservada', '2026-09-27'),
  r('RES-8807', 'c3', 'p4', '2026-12-12', 2, 'Reservada', '2026-09-27'),
  r('RES-8813', 'c6', 'p4', '2026-08-01', 2, 'Cancelada', '2026-06-11'),
  r('RES-8815', 'c5', 'p11', '2027-01-15', 2, 'Reservada', '2026-09-19'),
  r('RES-8816', 'c10', 'p3', '2026-07-10', 1, 'Cancelada', '2026-05-14'),
  r('RES-8814', 'c11', 'p6', '2026-12-10', 2, 'Comprada', '2026-09-24'),
];

const inv = (n, clientId, resIds, date, method, discountRate = 0) => {
  const items = resIds.map((rid) => {
    const res = reservations.find((x) => x.id === rid);
    const p = pk(res.packageId);
    return { reservationId: rid, packageId: p.id, name: p.name, travelers: res.travelers, amount: p.price * res.travelers };
  });
  return { id: 'FAC-2026-' + String(n).padStart(5, '0'), clientId, items, date, method, discountRate, ...invoiceTotals(items, discountRate) };
};

export const invoices = [
  inv(98, 'c1', ['RES-8795'], '2026-05-03', 'Tarjeta'),
  inv(104, 'c3', ['RES-8790'], '2026-07-20', 'Transferencia', CORPORATE_DISCOUNT),
  inv(106, 'c11', ['RES-8797'], '2026-08-03', 'PSE'),
  inv(109, 'c8', ['RES-8799'], '2026-08-22', 'Transferencia', CORPORATE_DISCOUNT),
  inv(112, 'c1', ['RES-8801'], '2026-08-31', 'Tarjeta'),
  inv(114, 'c9', ['RES-8803'], '2026-09-02', 'PayPal'),
  inv(116, 'c2', ['RES-8812'], '2026-09-05', 'Tarjeta'),
  inv(118, 'c4', ['RES-8805'], '2026-09-11', 'PSE'),
  inv(119, 'c5', ['RES-8808'], '2026-09-13', 'Transferencia', CORPORATE_DISCOUNT),
  inv(121, 'c11', ['RES-8814'], '2026-09-24', 'Transferencia', CORPORATE_DISCOUNT),
];

const pay = (txn, invId, date, status) => {
  const i = invoices.find((x) => x.id === invId);
  return { id: txn, invoiceId: invId, clientId: i.clientId, method: i.method, date, amount: i.total, status };
};

export const payments = [
  pay('TXN-845512', 'FAC-2026-00098', '2026-05-03', 'Aprobado'),
  pay('TXN-846930', 'FAC-2026-00104', '2026-07-21', 'Aprobado'),
  pay('TXN-847204', 'FAC-2026-00106', '2026-08-03', 'Aprobado'),
  pay('TXN-847781', 'FAC-2026-00109', '2026-08-23', 'Aprobado'),
  pay('TXN-848120', 'FAC-2026-00112', '2026-08-31', 'Aprobado'),
  pay('TXN-848356', 'FAC-2026-00114', '2026-09-02', 'Aprobado'),
  pay('TXN-848402', 'FAC-2026-00116', '2026-09-05', 'Aprobado'),
  pay('TXN-848690', 'FAC-2026-00118', '2026-09-11', 'Aprobado'),
  pay('TXN-848701', 'FAC-2026-00119', '2026-09-13', 'Aprobado'),
  pay('TXN-849015', 'FAC-2026-00121', '2026-09-24', 'Pendiente'),
  { id: 'TXN-848977', invoiceId: 'FAC-2026-00121', clientId: 'c11', method: 'Tarjeta', date: '2026-09-24', amount: invoices[9].total, status: 'Rechazado' },
];

export const cancellations = [
  { id: 'CAN-301', reservationId: 'RES-8812', clientId: 'c2', reason: 'Cambio de fechas laborales: no obtuve las vacaciones aprobadas.', date: '2026-09-25', status: 'Pendiente' },
  { id: 'CAN-302', reservationId: 'RES-8805', clientId: 'c4', reason: 'Motivos de salud de un acompañante.', date: '2026-09-26', status: 'Pendiente' },
  { id: 'CAN-303', reservationId: 'RES-8799', clientId: 'c8', reason: 'La empresa aplazó el viaje de incentivos para el próximo año.', date: '2026-09-27', status: 'Pendiente' },
  { id: 'CAN-298', reservationId: 'RES-8813', clientId: 'c6', reason: 'Viaje de trabajo inesperado en la misma fecha.', date: '2026-06-28', status: 'Aprobada' },
  { id: 'CAN-296', reservationId: 'RES-8816', clientId: 'c10', reason: 'Prefiero otro destino.', date: '2026-06-02', status: 'Aprobada' },
  { id: 'CAN-294', reservationId: 'RES-8790', clientId: 'c3', reason: 'Queríamos cambiar el hotel.', date: '2026-08-10', status: 'Rechazada' },
];

export const activity = [
  { id: 'e1', type: 'reserva', text: 'Catalina Herrera reservó Cancún y Riviera Maya para 2 viajeros', time: 'Hace 25 min' },
  { id: 'e2', type: 'pago', text: 'Pago recibido de Sofía Mendoza por $10.269.000 vía transferencia', time: 'Hace 2 h' },
  { id: 'e3', type: 'cancelacion', text: 'Felipe Arango solicitó cancelar Crucero Caribe: Aruba y Curazao', time: 'Ayer, 5:42 p. m.' },
  { id: 'e4', type: 'cliente', text: 'Nuevo cliente asignado: Valeria Quintero', time: 'Ayer, 11:10 a. m.' },
  { id: 'e5', type: 'paquete', text: 'Actualizaste las salidas de Cartagena amurallada', time: '25 sep' },
];

// Business history for the admin dashboard (COP, last 12 months).
export const monthly = [
  { m: 'oct', sales: 16.2e6, res: 88 }, { m: 'nov', sales: 18.9e6, res: 97 }, { m: 'dic', sales: 27.4e6, res: 138 },
  { m: 'ene', sales: 24.1e6, res: 121 }, { m: 'feb', sales: 15.3e6, res: 82 }, { m: 'mar', sales: 17.8e6, res: 94 },
  { m: 'abr', sales: 19.6e6, res: 103 }, { m: 'may', sales: 18.2e6, res: 99 }, { m: 'jun', sales: 26.7e6, res: 131 },
  { m: 'jul', sales: 25.9e6, res: 126 }, { m: 'ago', sales: 19.4e6, res: 104 }, { m: 'sep', sales: 19e6, res: 101 },
];
export const serviceRevenue = [
  { name: 'Transporte', value: 104.4e6 },
  { name: 'Alojamiento', value: 84.5e6 },
  { name: 'Renta de auto', value: 34.8e6 },
  { name: 'Seguro', value: 24.8e6 },
];
export const BUSINESS = { sales: 248500000, reservations: 1284, clients: 742, agents: 24, activePackages: 48 };

export const destinations = [
  { name: 'Cartagena', country: 'Colombia', code: 'CTG', image: img('1583531352515-8884af319dc1') },
  { name: 'San Andrés', country: 'Colombia', code: 'ADZ', image: img('1506929562872-bb421503ef21') },
  { name: 'Medellín', country: 'Colombia', code: 'MDE', image: img('1599413987323-b2b8c0d7d9c8') },
  { name: 'Cancún', country: 'México', code: 'CUN', image: img('1510097467424-192d713fd8b2') },
  { name: 'Madrid', country: 'España', code: 'MAD', image: img('1539037116277-4db20889f2d4') },
  { name: 'Miami', country: 'Estados Unidos', code: 'MIA', image: img('1533106497176-45ae19e68ba2') },
  { name: 'París', country: 'Francia', code: 'CDG', image: img('1502602898657-3e91760cbb34') },
  { name: 'Roma', country: 'Italia', code: 'FCO', image: img('1552832230-c0197dd311b5') },
];

export const seed = () => ({
  packages: packages.map((p) => ({ ...p })),
  clients: clients.map((c) => ({ ...c })),
  agents: agents.map((a) => ({ ...a })),
  reservations: reservations.map((x) => ({ ...x })),
  invoices: invoices.map((x) => ({ ...x })),
  payments: payments.map((x) => ({ ...x })),
  cancellations: cancellations.map((x) => ({ ...x })),
  activity: activity.map((x) => ({ ...x })),
  notifications: [
    { id: 'n1', text: 'Tu viaje a Cancún sale en 47 días. Revisa tu itinerario.', read: false },
    { id: 'n2', text: 'Nueva oferta: Miami Beach con 12% de descuento.', read: false },
    { id: 'n3', text: 'Tu reserva RES-8810 a Madrid está lista para comprar.', read: true },
  ],
});
