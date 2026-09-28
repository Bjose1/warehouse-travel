import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, CalendarDays, Users, MapPin, SlidersHorizontal, X, ArrowLeft, ShieldCheck, Headphones, PackageCheck,
  Minus, Plus, Clock, CheckCircle2, Building2, Plane, Luggage, Ticket, AlertTriangle, Pencil, Compass, SearchX,
} from 'lucide-react';
import { useStore } from '../App.jsx';
import { money, moneyShort, fmtDate, quote, TODAY, TRANSPORT, destinations as DESTS, addDays } from '../data.js';
import {
  cx, Button, Badge, Card, Img, Rating, Route, ServiceIcons, Input, Select, Textarea, Toggle, Chip, Modal, Drawer,
  EmptyState, Skeleton, PriceLines, Segmented, serviceList,
} from '../ui.jsx';
import { PackageCard, durationText, ServicesDetail, Note, clientName, InvoiceView } from './shared.jsx';
import { BookingFlow, ReservedView, OrderView, CheckoutView, PaidView } from './booking.jsx';

export default function ClientApp() {
  const { nav, go } = useStore();
  const views = {
    home: <Home />,
    destinations: <Destinations />,
    offers: <Offers />,
    catalog: <Catalog />,
    detail: <Detail />,
    register: <Register />,
    book: <BookingFlow />,
    reserved: <ReservedView />,
    order: <OrderView />,
    checkout: <CheckoutView />,
    paid: <PaidView />,
    invoice: <Page><InvoiceView invoiceId={nav.invoiceId} onBack={() => go(nav.back || 'trips', nav.backParams)} backLabel="Volver" /></Page>,
    trips: <Trips />,
    trip: <Trip />,
    profile: <Profile />,
  };
  return (
    <>
      <div key={nav.name + (nav.id || nav.resId || '')} className="animate-fade">{views[nav.name] || <Home />}</div>
      <Footer />
    </>
  );
}

export function Page({ children, className }) {
  return <main className={cx('mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10', className)}>{children}</main>;
}

const activePackages = (db) => db.packages.filter((p) => p.status === 'Activo');

/* ---------------- Departures board (hero signature) ---------------- */

function FlapText({ text, delay = 0, className }) {
  return (
    <span className={cx('inline-flex gap-[2px]', className)} aria-label={text}>
      {text.split('').map((ch, i) => (
        <span key={text + i} className="flap-cell" aria-hidden="true">
          <span className="inline-block min-w-[0.62em] animate-flap rounded-[3px] bg-white/[0.07] px-[1px] text-center" style={{ animationDelay: `${delay + i * 35}ms` }}>
            {ch === ' ' ? ' ' : ch}
          </span>
        </span>
      ))}
    </span>
  );
}

function DeparturesBoard() {
  const { db, go } = useStore();
  const list = useMemo(() => activePackages(db).filter((p) => p.transport.type === 'air' || p.transport.type === 'sea'), [db]);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || list.length < 6) return;
    const t = setInterval(() => setOffset((o) => (o + 1) % list.length), 5200);
    return () => clearInterval(t);
  }, [list.length]);
  const rows = Array.from({ length: Math.min(5, list.length) }, (_, i) => list[(i + offset) % list.length]);
  const times = ['06:40', '08:15', '10:55', '13:20', '16:05'];
  return (
    <div className="rounded-3xl bg-navy-900 p-4 text-white shadow-pop ring-1 ring-white/10 sm:p-5">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="flex items-center gap-2 font-board text-lg font-semibold tracking-[0.12em]"><Plane className="h-4 w-4 -rotate-45 text-signal-100" />SALIDAS</span>
        <span className="flex items-center gap-1.5 text-xs text-white/50"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />Cupos en vivo</span>
      </div>
      <div className="grid grid-cols-[4rem_1fr_auto] gap-x-3 border-b border-white/10 px-1 pb-2 text-[11px] text-white/40 sm:grid-cols-[4.25rem_4rem_1fr_auto]">
        <span>Hora</span><span className="hidden sm:block">Ruta</span><span>Destino</span><span className="text-right">Desde</span>
      </div>
      <ul>
        {rows.map((p, i) => (
          <li key={p.id + offset}>
            <button onClick={() => go('detail', { id: p.id })}
              className="grid w-full grid-cols-[4rem_1fr_auto] items-center gap-x-3 rounded-lg px-1 py-2.5 text-left font-board text-[19px] font-semibold tracking-wide hover:bg-white/5 sm:grid-cols-[4.25rem_4rem_1fr_auto]">
              <FlapText text={times[i]} delay={i * 90} className="text-amber-300" />
              <FlapText text={p.code} delay={i * 90 + 120} className="hidden sm:inline-flex" />
              <FlapText text={p.destination.toUpperCase().slice(0, 12)} delay={i * 90 + 200} className="truncate" />
              <span className="text-right text-base text-white/80 tnum">{moneyShort(p.price)}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 px-1 text-xs text-white/40">Precios por persona con transporte, alojamiento y seguro. Toca un destino para verlo.</p>
    </div>
  );
}

/* ---------------- Search bar ---------------- */

function Stepper({ value, onChange, min = 1, max = 12, label }) {
  return (
    <div className="flex items-center gap-2" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="grid h-8 w-8 place-items-center rounded-full border border-line hover:bg-mist disabled:opacity-40" disabled={value <= min} aria-label="Quitar viajero"><Minus className="h-3.5 w-3.5" /></button>
      <span className="w-6 text-center text-sm font-semibold tnum">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="grid h-8 w-8 place-items-center rounded-full border border-line hover:bg-mist disabled:opacity-40" disabled={value >= max} aria-label="Agregar viajero"><Plus className="h-3.5 w-3.5" /></button>
    </div>
  );
}
export { Stepper as CountStepper };

function HeroSearch() {
  const { go } = useStore();
  const [dest, setDest] = useState('');
  const [from, setFrom] = useState(addDays(TODAY, 30));
  const [to, setTo] = useState(addDays(TODAY, 36));
  const [trav, setTrav] = useState(2);
  const field = 'flex flex-col justify-center gap-0.5 rounded-2xl px-4 py-2.5 hover:bg-mist focus-within:bg-mist';
  const lbl = 'flex items-center gap-1.5 text-xs font-semibold text-slate-500';
  return (
    <form onSubmit={(e) => { e.preventDefault(); go('catalog', { q: dest, travelers: trav, from }); }}
      className="grid gap-1 rounded-3xl bg-white p-2 text-ink shadow-pop md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-center">
      <label className={field}>
        <span className={lbl}><MapPin className="h-3.5 w-3.5" />Destino</span>
        <input list="dest-list" value={dest} onChange={(e) => setDest(e.target.value)} placeholder="¿A dónde quieres viajar?" className="bg-transparent text-[15px] font-semibold placeholder:font-normal placeholder:text-slate-400 focus:outline-none" />
        <datalist id="dest-list">{DESTS.map((d) => <option key={d.name} value={d.name} />)}</datalist>
      </label>
      <label className={field}>
        <span className={lbl}><CalendarDays className="h-3.5 w-3.5" />Fecha de salida</span>
        <input type="date" value={from} min={TODAY} onChange={(e) => { setFrom(e.target.value); if (e.target.value > to) setTo(addDays(e.target.value, 5)); }} className="bg-transparent text-[15px] font-semibold focus:outline-none" />
      </label>
      <label className={field}>
        <span className={lbl}><CalendarDays className="h-3.5 w-3.5" />Fecha de regreso</span>
        <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="bg-transparent text-[15px] font-semibold focus:outline-none" />
      </label>
      <div className={field}>
        <span className={lbl}><Users className="h-3.5 w-3.5" />Viajeros</span>
        <Stepper value={trav} onChange={setTrav} label="Viajeros" />
      </div>
      <Button type="submit" size="lg" icon={Search} className="h-14 rounded-2xl px-7">Buscar viajes</Button>
    </form>
  );
}

/* ---------------- Home ---------------- */

function Home() {
  const { db, go } = useStore();
  const offers = activePackages(db).filter((p) => p.oldPrice).slice(0, 4);
  const recommended = [...activePackages(db)].sort((a, b) => b.rating - a.rating || b.sales - a.sales).slice(0, 3);
  return (
    <>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
        <div className="relative mx-auto grid max-w-[1400px] gap-10 px-4 pb-10 pt-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:pb-16 lg:pt-20">
          <div>
            <h1 className="max-w-xl text-[44px] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[76px]">Descubre tu próximo destino.</h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/70">Viajes completos. Transporte, alojamiento, movilidad y seguro en un solo paquete.</p>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-signal-100" />Seguro incluido</li>
              <li className="flex items-center gap-2"><Headphones className="h-4 w-4 text-signal-100" />Agente asignado</li>
              <li className="flex items-center gap-2"><PackageCheck className="h-4 w-4 text-signal-100" />Un solo pago</li>
            </ul>
          </div>
          <DeparturesBoard />
        </div>
        <div className="relative mx-auto max-w-[1400px] px-4 pb-10 sm:px-6 lg:pb-14"><HeroSearch /></div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pt-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Destinos populares</h2>
          <Button variant="ghost" onClick={() => go('destinations')}>Ver todos</Button>
        </div>
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
          {DESTS.map((d, i) => (
            <button key={d.name} onClick={() => go('catalog', { q: d.name })}
              className={cx('group relative w-44 shrink-0 snap-start overflow-hidden rounded-2xl text-left sm:w-auto', i < 2 || i > 5 ? 'aspect-[3/4] sm:col-span-2 sm:aspect-[16/10]' : 'aspect-[3/4] sm:aspect-[4/3]')}>
              <Img src={d.image} code={d.code} alt={d.name} className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-navy-900/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4 text-white">
                <p className="font-board text-sm font-semibold tracking-[0.14em] text-white/70">{d.code}</p>
                <p className="text-xl font-bold leading-tight">{d.name}</p>
                <p className="text-[13px] text-white/70">{d.country}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pt-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ofertas que no querrás perderte</h2>
            <p className="mt-1 text-sm text-slate-500">Precios rebajados por tiempo limitado, con todo incluido.</p>
          </div>
          <Button variant="ghost" onClick={() => go('offers')}>Ver ofertas</Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">{offers.map((p) => <OfferCard key={p.id} pkg={p} />)}</div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pt-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Los mejor calificados</h2>
          <Button variant="ghost" onClick={() => go('catalog')}>Explorar catálogo</Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((p) => <PackageCard key={p.id} pkg={p} onView={() => go('detail', { id: p.id })} onBook={() => go('book', { packageId: p.id })} />)}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
          {[
            [PackageCheck, 'Todo en un solo paquete', 'Transporte, hotel, auto y seguro coordinados. Sin reservar por partes.'],
            [ShieldCheck, 'Pagos protegidos', 'Tarjeta, PSE, transferencia o PayPal. Tu factura llega al instante.'],
            [Headphones, 'Un agente para ti', 'Una persona real acompaña tu viaje antes, durante y después.'],
          ].map(([I, t, d]) => (
            <div key={t} className="bg-white p-7">
              <I className="h-6 w-6 text-signal" />
              <h3 className="mt-4 font-bold">{t}</h3>
              <p className="mt-1 text-sm text-slate-500">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function OfferCard({ pkg }) {
  const { go } = useStore();
  const off = Math.round((1 - pkg.price / pkg.oldPrice) * 100);
  return (
    <article className="group grid overflow-hidden rounded-2xl border border-line bg-white sm:grid-cols-[42%_1fr]">
      <div className="relative aspect-[16/10] overflow-hidden sm:aspect-auto">
        <Img src={pkg.image} code={pkg.code} alt={pkg.destination} className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-sm font-bold text-white tnum">-{off}%</span>
      </div>
      <div className="flex flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <Route from={pkg.origin} to={pkg.code} className="text-slate-500" />
          <Rating value={pkg.rating} />
        </div>
        <h3 className="mt-2 text-lg font-bold leading-snug">{pkg.name}</h3>
        <p className="text-[13px] text-slate-500">{pkg.destination}, {durationText(pkg)}</p>
        <div className="mt-3"><ServiceIcons pkg={pkg} /></div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-[13px] text-slate-400 line-through tnum">{money(pkg.oldPrice)}</p>
            <p className="text-2xl font-extrabold leading-none tracking-tight tnum">{money(pkg.price)}</p>
            <p className="mt-1 text-xs text-slate-500">por persona</p>
          </div>
          <Button onClick={() => go('detail', { id: pkg.id })}>Explorar oferta</Button>
        </div>
      </div>
    </article>
  );
}

/* ---------------- Destinations & offers ---------------- */

function Destinations() {
  const { db, go } = useStore();
  const byDest = useMemo(() => {
    const m = {};
    activePackages(db).forEach((p) => {
      m[p.destination] = m[p.destination] || { name: p.destination, country: p.country, code: p.code, image: p.image, count: 0, from: Infinity };
      m[p.destination].count++;
      m[p.destination].from = Math.min(m[p.destination].from, p.price);
    });
    return Object.values(m).sort((a, b) => b.count - a.count || a.from - b.from);
  }, [db]);
  return (
    <Page>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Destinos</h1>
      <p className="mt-2 text-slate-500">Elige a dónde ir. Nosotros armamos el resto del viaje.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {byDest.map((d) => (
          <button key={d.name} onClick={() => go('catalog', { q: d.name })} className="group overflow-hidden rounded-2xl border border-line bg-white text-left hover:shadow-lift">
            <div className="relative aspect-[16/9] overflow-hidden">
              <Img src={d.image} code={d.code} alt={d.name} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="flex items-center justify-between gap-3 p-5">
              <div>
                <p className="text-lg font-bold">{d.name}</p>
                <p className="text-[13px] text-slate-500">{d.country}, {d.count} {d.count === 1 ? 'paquete' : 'paquetes'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">desde</p>
                <p className="font-bold tnum">{money(d.from)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </Page>
  );
}

function Offers() {
  const { db } = useStore();
  const offers = activePackages(db).filter((p) => p.oldPrice).sort((a, b) => (1 - a.price / a.oldPrice > 1 - b.price / b.oldPrice ? -1 : 1));
  return (
    <Page>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Ofertas que no querrás perderte</h1>
      <p className="mt-2 text-slate-500">Paquetes completos con precio rebajado. El descuento ya está aplicado.</p>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {offers.length ? offers.map((p) => <OfferCard key={p.id} pkg={p} />) : <EmptyState title="No hay ofertas activas" text="Vuelve pronto: publicamos nuevas rebajas cada semana." />}
      </div>
    </Page>
  );
}

/* ---------------- Catalog ---------------- */

const DURATIONS = [{ v: 'short', l: 'Hasta 5 días', t: (d) => d <= 5 }, { v: 'mid', l: '6 a 8 días', t: (d) => d >= 6 && d <= 8 }, { v: 'long', l: '9 días o más', t: (d) => d >= 9 }];
const initFilters = { destination: '', maxPrice: 12000000, transport: [], lodging: [], insurance: [], car: [], duration: '' };
const toggleIn = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

function FilterPanel({ f, setF, dests }) {
  const group = (title, key, opts) => (
    <fieldset className="border-t border-line py-5">
      <legend className="mb-3 text-sm font-bold">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {opts.map(([v, l]) => <Chip key={v} active={f[key].includes(v)} onClick={() => setF({ ...f, [key]: toggleIn(f[key], v) })}>{l}</Chip>)}
      </div>
    </fieldset>
  );
  return (
    <div>
      <div className="pb-5">
        <Select label="Destino" value={f.destination} onChange={(e) => setF({ ...f, destination: e.target.value })} options={[{ value: '', label: 'Todos los destinos' }, ...dests.map((d) => ({ value: d, label: d }))]} />
      </div>
      <fieldset className="border-t border-line py-5">
        <legend className="mb-1 text-sm font-bold">Precio por persona</legend>
        <p className="mb-3 text-[13px] text-slate-500">Hasta <span className="font-semibold text-ink tnum">{money(f.maxPrice)}</span></p>
        <input type="range" min={1000000} max={12000000} step={250000} value={f.maxPrice} onChange={(e) => setF({ ...f, maxPrice: Number(e.target.value) })} className="w-full accent-signal" aria-label="Precio máximo" />
      </fieldset>
      {group('Transporte', 'transport', Object.entries(TRANSPORT))}
      {group('Alojamiento', 'lodging', [['Hotel', 'Hotel'], ['Hostal', 'Hostal']])}
      {group('Seguro', 'insurance', [['Básico', 'Básico'], ['Internacional', 'Internacional'], ['Total', 'Total']])}
      {group('Renta de auto', 'car', [['Económico', 'Económico'], ['SUV', 'SUV'], ['Premium', 'Premium']])}
      <fieldset className="border-t border-line py-5">
        <legend className="mb-3 text-sm font-bold">Duración</legend>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => <Chip key={d.v} active={f.duration === d.v} onClick={() => setF({ ...f, duration: f.duration === d.v ? '' : d.v })}>{d.l}</Chip>)}
        </div>
      </fieldset>
    </div>
  );
}

function Catalog() {
  const { db, nav, go } = useStore();
  const [q, setQ] = useState(nav.q || '');
  const [f, setF] = useState(initFilters);
  const [sort, setSort] = useState('rec');
  const [mobileFilters, setMobileFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setQ(nav.q || ''); }, [nav.q]);
  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 380); return () => clearTimeout(t); }, [q, f, sort]);

  const all = activePackages(db);
  const dests = [...new Set(all.map((p) => p.destination))].sort();
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    let r = all.filter((p) =>
      (!term || `${p.name} ${p.destination} ${p.country} ${p.code}`.toLowerCase().includes(term)) &&
      (!f.destination || p.destination === f.destination) &&
      p.price <= f.maxPrice &&
      (!f.transport.length || f.transport.includes(p.transport.type)) &&
      (!f.lodging.length || f.lodging.includes(p.lodging.type)) &&
      (!f.insurance.length || f.insurance.includes(p.insurance)) &&
      (!f.car.length || (p.car && f.car.includes(p.car.category))) &&
      (!f.duration || DURATIONS.find((d) => d.v === f.duration).t(p.days)));
    const s = { rec: (a, b) => b.sales - a.sales, low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, rating: (a, b) => b.rating - a.rating }[sort];
    return [...r].sort(s);
  }, [all, q, f, sort]);

  const activeCount = (f.destination ? 1 : 0) + (f.maxPrice < 12000000 ? 1 : 0) + f.transport.length + f.lodging.length + f.insurance.length + f.car.length + (f.duration ? 1 : 0);
  const clear = () => { setF(initFilters); setQ(''); };

  return (
    <Page>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Explora nuestros viajes</h1>
          <p className="mt-2 text-slate-500">{nav.travelers ? `Precios por persona para tu grupo de ${nav.travelers}. ` : ''}Todos los paquetes incluyen transporte, alojamiento y seguro.</p>
        </div>
        <div className="flex gap-2">
          <Input icon={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="¿A dónde quieres viajar?" aria-label="Buscar" className="flex-1 md:w-64" />
          <Button variant="secondary" icon={SlidersHorizontal} className="h-11 lg:hidden" onClick={() => setMobileFilters(true)}>Filtros{activeCount ? ` (${activeCount})` : ''}</Button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-[120px] rounded-2xl border border-line bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold">Filtros</p>
              {activeCount > 0 && <button onClick={clear} className="text-[13px] font-semibold text-signal hover:underline">Limpiar</button>}
            </div>
            <FilterPanel f={f} setF={setF} dests={dests} />
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500"><span className="font-semibold text-ink tnum">{results.length}</span> {results.length === 1 ? 'viaje encontrado' : 'viajes encontrados'}{q && <> para “{q}”</>}</p>
            <Select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar" className="w-52" options={[
              { value: 'rec', label: 'Más vendidos' }, { value: 'low', label: 'Precio: menor a mayor' }, { value: 'high', label: 'Precio: mayor a menor' }, { value: 'rating', label: 'Mejor calificados' },
            ]} />
          </div>
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white"><Skeleton className="aspect-[4/3] rounded-none" /><div className="space-y-3 p-5"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-8 w-1/2" /></div></div>)}
            </div>
          ) : results.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p) => <PackageCard key={p.id} pkg={p} onView={() => go('detail', { id: p.id, travelers: nav.travelers })} onBook={() => go('book', { packageId: p.id, travelers: nav.travelers })} />)}
            </div>
          ) : (
            <Card><EmptyState icon={SearchX} title="No encontramos viajes con esos filtros" text="Prueba con otro destino, sube el precio máximo o quita algún filtro." action={<Button variant="secondary" onClick={clear}>Limpiar filtros</Button>} /></Card>
          )}
        </div>
      </div>

      <Drawer open={mobileFilters} onClose={() => setMobileFilters(false)} title="Filtros" width="max-w-sm"
        footer={<><Button variant="secondary" className="flex-1" onClick={clear}>Limpiar</Button><Button className="flex-1" onClick={() => setMobileFilters(false)}>Ver {results.length} viajes</Button></>}>
        <FilterPanel f={f} setF={setF} dests={dests} />
      </Drawer>
    </Page>
  );
}

/* ---------------- Package detail ---------------- */

function Detail() {
  const { db, nav, go } = useStore();
  const pkg = db.packages.find((p) => p.id === nav.id);
  const upcoming = pkg ? pkg.departures.filter((d) => d >= TODAY) : [];
  const [date, setDate] = useState(upcoming[0] || '');
  const [trav, setTrav] = useState(nav.travelers || 2);
  if (!pkg) return <Page><EmptyState icon={Compass} title="Este viaje ya no está disponible" text="Puede que se haya retirado del catálogo." action={<Button onClick={() => go('catalog')}>Explorar viajes</Button>} /></Page>;
  const q = quote(pkg, trav);
  const unavailable = pkg.status !== 'Activo';
  const book = () => go('book', { packageId: pkg.id, date, travelers: trav });

  return (
    <>
      <section className="relative h-[52vh] min-h-[380px] overflow-hidden bg-navy">
        <Img src={pkg.image} code={pkg.code} alt={pkg.destination} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/30 to-navy-900/20" />
        <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-between px-4 py-6 sm:px-6 sm:py-8">
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => go('catalog')} className="self-start !border-white/20 !bg-white/10 !text-white backdrop-blur hover:!bg-white/20">Volver al catálogo</Button>
          <div className="text-white">
            <Route from={pkg.origin} to={pkg.code} className="text-xl text-white/80" />
            <h1 className="mt-2 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-6xl">{pkg.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{pkg.destination}, {pkg.country}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{durationText(pkg)}</span>
              <Rating value={pkg.rating} reviews={pkg.reviews} light />
            </div>
            <Button size="lg" onClick={book} disabled={unavailable} className="mt-6 lg:hidden">Reservar desde {money(pkg.price)}</Button>
          </div>
        </div>
      </section>

      <Page className="!pt-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-10">
            {unavailable && <Note tone="amber">Este paquete no está disponible para reservas en este momento.</Note>}
            <section>
              <p className="max-w-2xl text-lg leading-relaxed text-slate-600">{pkg.description}</p>
            </section>
            <section>
              <h2 className="mb-4 text-xl font-bold">Incluye</h2>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {serviceList(pkg).map(({ key, icon: I, label }) => (
                  <div key={key} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-signal-50 text-signal"><I className="h-5 w-5" /></span>
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                ))}
              </div>
              <ServicesDetail pkg={pkg} />
            </section>
            <section>
              <h2 className="mb-4 text-xl font-bold">Próximas salidas</h2>
              <div className="flex flex-wrap gap-2">
                {upcoming.map((d) => (
                  <button key={d} onClick={() => setDate(d)} aria-pressed={date === d}
                    className={cx('rounded-xl border px-4 py-3 text-left transition-colors', date === d ? 'border-navy bg-navy text-white' : 'border-line bg-white hover:border-slate-300')}>
                    <p className="text-sm font-semibold">{fmtDate(d)}</p>
                    <p className={cx('text-xs', date === d ? 'text-white/60' : 'text-slate-500')}>Regreso {fmtDate(addDays(d, pkg.days - 1))}</p>
                  </button>
                ))}
              </div>
            </section>
            <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
              <h2 className="text-base font-bold">Condiciones claras</h2>
              <ul className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Reserva sin pago por 48 horas.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Cancelación revisada por tu agente.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Precio final con impuestos antes de pagar.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Factura electrónica inmediata.</li>
              </ul>
            </section>
          </div>

          <aside>
            <div className="sticky top-[120px] overflow-hidden rounded-3xl border border-line bg-white shadow-lift">
              <div className="p-6">
                <div className="flex items-baseline justify-between">
                  <div>
                    {pkg.oldPrice && <p className="text-sm text-slate-400 line-through tnum">{money(pkg.oldPrice)}</p>}
                    <p className="text-3xl font-extrabold tracking-tight tnum">{money(pkg.price)}</p>
                    <p className="text-[13px] text-slate-500">por persona</p>
                  </div>
                  {pkg.oldPrice && <Badge tone="red" dot={false}>-{Math.round((1 - pkg.price / pkg.oldPrice) * 100)}%</Badge>}
                </div>
                <div className="mt-5 grid gap-3">
                  <Select label="Fecha de salida" value={date} onChange={(e) => setDate(e.target.value)} options={upcoming.length ? upcoming.map((d) => ({ value: d, label: fmtDate(d) })) : [{ value: '', label: 'Sin salidas programadas' }]} />
                  <div className="flex items-center justify-between rounded-xl border border-line px-3.5 py-2.5">
                    <span className="text-sm font-medium">Viajeros</span>
                    <Stepper value={trav} onChange={setTrav} label="Viajeros" />
                  </div>
                </div>
              </div>
              <div className="perforation" style={{ '--notch': '#F4F6F9' }} />
              <div className="p-6">
                <PriceLines total={q.total} lines={[
                  ['Precio por persona', money(q.list)],
                  ['Cantidad de viajeros', `× ${trav}`],
                  ['Subtotal', money(q.subtotal)],
                  q.discount ? ['Descuento', `-${money(q.discount)}`, 'green'] : ['Descuento', money(0)],
                  ['Impuestos y tasas', money(q.taxes)],
                ]} />
                <Button size="lg" className="mt-5 w-full" onClick={book} disabled={unavailable || !date}>Reservar ahora</Button>
                <p className="mt-3 text-center text-xs text-slate-500">No se cobra nada hasta que confirmes el pago.</p>
              </div>
            </div>
          </aside>
        </div>
      </Page>
    </>
  );
}

/* ---------------- Register ---------------- */

function Register() {
  const { actions, go } = useStore();
  const [f, setF] = useState({ first: '', last: '', doc: '', email: '', phone: '', password: '', company: '', nit: '' });
  const [corp, setCorp] = useState(false);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if (!f.first.trim()) err.first = 'Escribe tu nombre.';
    if (!f.last.trim()) err.last = 'Escribe tu apellido.';
    if (!/^\d{6,12}$/.test(f.doc.replace(/\D/g, ''))) err.doc = 'Ingresa un número de documento válido.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) err.email = 'Revisa el formato del email.';
    if (f.phone.replace(/\D/g, '').length < 7) err.phone = 'Ingresa un teléfono de contacto.';
    if (f.password.length < 8) err.password = 'Usa al menos 8 caracteres.';
    if (corp && !f.company.trim()) err.company = 'Escribe el nombre de la empresa.';
    if (corp && !/^[\d.\-]{8,}$/.test(f.nit)) err.nit = 'Ingresa el NIT con dígito de verificación.';
    setErrors(err);
    if (Object.keys(err).length) return;
    setSaving(true);
    setTimeout(() => {
      actions.registerClient({ first: f.first.trim(), last: f.last.trim(), doc: 'CC ' + f.doc, email: f.email, phone: f.phone, company: corp ? f.company : null, nit: corp ? f.nit : null });
      setSaving(false);
      setDone(true);
    }, 900);
  };

  if (done) {
    return (
      <Page className="grid min-h-[70vh] place-items-center">
        <div className="max-w-md animate-rise text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-8 w-8" /></span>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight">¡Bienvenido a Warehouse Travel!</h1>
          <p className="mt-3 text-slate-500">Tu cuenta está lista. Ahora puedes comenzar a planear tu próximo viaje.</p>
          <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
            <Button size="lg" onClick={() => go('catalog')}>Explorar viajes</Button>
            <Button size="lg" variant="secondary" onClick={() => go('profile')}>Ver mi perfil</Button>
          </div>
        </div>
      </Page>
    );
  }

  const passenger = `${f.first || 'Tu nombre'} ${f.last}`.trim().toUpperCase();
  return (
    <Page>
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-line bg-white shadow-lift lg:grid-cols-[1fr_1.1fr]">
        <div className="relative hidden flex-col justify-between bg-navy p-10 text-white lg:flex">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight">Tu próximo viaje empieza con tu nombre.</h1>
            <p className="mt-3 text-white/60">Crea tu cuenta para reservar, pagar y seguir tus viajes en un solo lugar.</p>
          </div>
          <div className="rounded-2xl bg-white text-ink shadow-pop" style={{ '--notch': '#0A2342' }}>
            <div className="flex items-center justify-between px-5 pt-4 text-xs text-slate-500"><span>Pase de abordar</span><span className="font-board text-sm font-semibold tracking-wider text-signal">WAREHOUSE</span></div>
            <div className="px-5 pb-4 pt-2">
              <p className="text-[11px] text-slate-500">Pasajero</p>
              <p className="truncate font-board text-2xl font-semibold tracking-wide">{passenger}</p>
              {corp && <p className="truncate text-xs text-violet-700">{f.company || 'Tu empresa'}</p>}
            </div>
            <div className="perforation" />
            <div className="flex items-center justify-between px-5 py-4 font-board text-3xl font-semibold tracking-wide">
              <span>BOG</span><Plane className="h-5 w-5 text-slate-300" /><span className="text-signal">???</span>
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="p-6 sm:p-10" noValidate>
          <h2 className="text-2xl font-bold tracking-tight lg:hidden">Crea tu cuenta</h2>
          <p className="mb-6 text-sm text-slate-500 lg:mt-0">¿Ya tienes cuenta? <button type="button" onClick={() => go('profile')} className="font-semibold text-signal hover:underline">Ir a mi perfil</button></p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nombre" value={f.first} onChange={set('first')} error={errors.first} autoComplete="given-name" />
            <Input label="Apellido" value={f.last} onChange={set('last')} error={errors.last} autoComplete="family-name" />
            <Input label="Documento" value={f.doc} onChange={set('doc')} error={errors.doc} inputMode="numeric" placeholder="Cédula o pasaporte" />
            <Input label="Teléfono" value={f.phone} onChange={set('phone')} error={errors.phone} inputMode="tel" autoComplete="tel" />
            <Input label="Email" type="email" value={f.email} onChange={set('email')} error={errors.email} autoComplete="email" className="sm:col-span-2" />
            <Input label="Contraseña" type="password" value={f.password} onChange={set('password')} error={errors.password} hint="Mínimo 8 caracteres." autoComplete="new-password" className="sm:col-span-2" />
          </div>
          <div className={cx('mt-5 rounded-2xl border p-4 transition-colors', corp ? 'border-violet-200 bg-violet-50/50' : 'border-line')}>
            <Toggle checked={corp} onChange={setCorp} label="¿Viajas como empresa?" description="Factura a nombre de tu empresa y accede a tarifas corporativas." />
            {corp && (
              <div className="mt-4 grid animate-rise gap-4 sm:grid-cols-2">
                <Input label="Empresa" value={f.company} onChange={set('company')} error={errors.company} icon={Building2} />
                <Input label="NIT" value={f.nit} onChange={set('nit')} error={errors.nit} placeholder="900.123.456-7" />
              </div>
            )}
          </div>
          <Button type="submit" size="lg" loading={saving} className="mt-6 w-full">Crear cuenta</Button>
          <p className="mt-3 text-center text-xs text-slate-500">Al crear tu cuenta aceptas los términos del servicio y la política de datos.</p>
        </form>
      </div>
    </Page>
  );
}

/* ---------------- My trips (travel wallet) ---------------- */

function tripGroups(res) {
  return {
    upcoming: res.filter((r) => r.date >= TODAY && ['Pagada', 'Cancelación pendiente'].includes(r.status)).sort((a, b) => a.date.localeCompare(b.date)),
    pending: res.filter((r) => ['Reservada', 'Comprada'].includes(r.status)),
    completed: res.filter((r) => r.date < TODAY && r.status === 'Pagada'),
    cancelled: res.filter((r) => r.status === 'Cancelada'),
  };
}

function WalletTicket({ r }) {
  const { db, go } = useStore();
  const p = db.packages.find((x) => x.id === r.packageId);
  const days = Math.round((new Date(r.date) - new Date(TODAY)) / 86400000);
  const status = r.status === 'Pagada' && r.date < TODAY ? 'Completado' : r.status;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-lift sm:flex-row">
      <div className="relative h-40 shrink-0 sm:h-auto sm:w-52">
        <Img src={p?.image} code={p?.code} alt={p?.destination} className="absolute inset-0 h-full w-full" />
      </div>
      <div className="flex flex-1 flex-col justify-between gap-3 p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2"><Badge>{status}</Badge>{days > 0 && r.status === 'Pagada' && <span className="text-xs text-slate-500">Faltan {days} días</span>}</div>
          <h3 className="mt-2 text-lg font-bold leading-snug">{p?.name || 'Paquete retirado'}</h3>
          <p className="text-[13px] text-slate-500">{p?.destination}, sale el {fmtDate(r.date)}, {r.travelers} {r.travelers === 1 ? 'viajero' : 'viajeros'}</p>
        </div>
        <Route from={p?.origin || 'BOG'} to={p?.code || '---'} className="text-2xl text-navy" />
      </div>
      <div className="relative flex shrink-0 items-center justify-between gap-4 border-t border-dashed border-slate-300 p-5 sm:w-56 sm:flex-col sm:items-stretch sm:justify-center sm:border-l sm:border-t-0">
        <div>
          <p className="text-[11px] text-slate-500">Código</p>
          <p className="font-board text-lg font-semibold tracking-wide">{r.id}</p>
          <p className="mt-1 text-lg font-bold tnum">{money(r.total)}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          {r.status === 'Reservada' && <Button size="sm" onClick={() => go('order', { resId: r.id })}>Continuar con la compra</Button>}
          {r.status === 'Comprada' && <Button size="sm" onClick={() => go('checkout', { resId: r.id })}>Pagar ahora</Button>}
          <Button size="sm" variant={['Reservada', 'Comprada'].includes(r.status) ? 'secondary' : 'primary'} onClick={() => go('trip', { resId: r.id })}>Ver viaje</Button>
        </div>
      </div>
    </article>
  );
}

function Trips() {
  const { db, currentClient, go } = useStore();
  const mine = db.reservations.filter((r) => r.clientId === currentClient.id);
  const g = tripGroups(mine);
  const [tab, setTab] = useState(g.upcoming.length ? 'upcoming' : g.pending.length ? 'pending' : 'upcoming');
  const labels = { upcoming: 'Próximos viajes', pending: 'Reservas pendientes', completed: 'Viajes completados', cancelled: 'Cancelados' };
  const next = g.upcoming[0];
  const nextPkg = next && db.packages.find((p) => p.id === next.packageId);
  return (
    <Page>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Mis viajes</h1>
          <p className="mt-2 text-slate-500">Tus reservas, pases y facturas, siempre a la mano.</p>
        </div>
      </div>
      {next && nextPkg && (
        <button onClick={() => go('trip', { resId: next.id })} className="mt-8 grid w-full overflow-hidden rounded-3xl bg-navy text-left text-white sm:grid-cols-[1fr_auto]">
          <div className="p-6 sm:p-8">
            <p className="text-sm text-white/60">Tu próximo viaje</p>
            <p className="mt-2 font-board text-5xl font-semibold tracking-wide sm:text-6xl">{nextPkg.origin} <Plane className="inline h-7 w-7 text-white/40" /> {nextPkg.code}</p>
            <p className="mt-2 text-lg font-semibold">{nextPkg.name}</p>
            <p className="text-sm text-white/60">Sale el {fmtDate(next.date)}, {next.travelers} viajeros</p>
          </div>
          <div className="flex items-center gap-6 border-t border-dashed border-white/20 p-6 sm:border-l sm:border-t-0 sm:p-8">
            <div><p className="text-sm text-white/60">Faltan</p><p className="text-5xl font-extrabold tnum">{Math.round((new Date(next.date) - new Date(TODAY)) / 86400000)}</p><p className="text-sm text-white/60">días</p></div>
          </div>
        </button>
      )}
      <div className="mt-8 overflow-x-auto no-scrollbar">
        <Segmented value={tab} onChange={setTab} options={Object.keys(labels).map((k) => ({ value: k, label: labels[k], count: g[k].length }))} />
      </div>
      <div className="mt-5 space-y-3">
        {g[tab].length ? g[tab].map((r) => <WalletTicket key={r.id} r={r} />) : (
          <Card><EmptyState icon={Luggage} title={tab === 'upcoming' ? 'Aún no tienes viajes próximos' : 'Nada por aquí'} text="Cuando reserves un paquete, aparecerá en tu billetera de viajes." action={<Button onClick={() => go('catalog')}>Explorar viajes</Button>} /></Card>
        )}
      </div>
    </Page>
  );
}

/* ---------------- Trip detail + cancellation ---------------- */

const REASONS = ['Cambio de fechas', 'Motivos de salud', 'Motivos laborales', 'Encontré otra opción', 'Otro motivo'];

function Trip() {
  const { db, nav, go, actions } = useStore();
  const r = db.reservations.find((x) => x.id === nav.resId);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState('');
  const [err, setErr] = useState('');
  if (!r) return <Page><EmptyState title="No encontramos esta reserva" action={<Button onClick={() => go('trips')}>Ir a mis viajes</Button>} /></Page>;
  const p = db.packages.find((x) => x.id === r.packageId);
  const inv = db.invoices.find((i) => i.items.some((it) => it.reservationId === r.id));
  const agent = db.agents.find((a) => a.id === db.clients.find((c) => c.id === r.clientId)?.agentId);
  const canCancel = ['Reservada', 'Comprada', 'Pagada'].includes(r.status) && r.date >= TODAY;
  const submit = () => {
    if (reason === 'Otro motivo' && detail.trim().length < 5) { setErr('Cuéntanos brevemente el motivo.'); return; }
    actions.requestCancellation(r.id, detail.trim() ? `${reason}: ${detail.trim()}` : reason);
    setOpen(false);
  };
  const status = r.status === 'Pagada' && r.date < TODAY ? 'Completado' : r.status;
  return (
    <Page>
      <Button variant="ghost" icon={ArrowLeft} onClick={() => go('trips')} className="-ml-3 mb-4">Mis viajes</Button>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-line bg-white">
            <div className="relative h-56 sm:h-72">
              <Img src={p?.image} code={p?.code} alt={p?.destination} className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent" />
              <div className="absolute bottom-5 left-6 text-white">
                <Badge className="!bg-white/15 !text-white !ring-white/20">{status}</Badge>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{p?.name}</h1>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
              {[['Código', r.id], ['Salida', fmtDate(r.date)], ['Regreso', p ? fmtDate(addDays(r.date, p.days - 1)) : '—'], ['Pasajeros', r.travelers]].map(([k, v]) => (
                <div key={k} className="bg-white p-4"><p className="text-xs text-slate-500">{k}</p><p className="mt-0.5 font-semibold">{v}</p></div>
              ))}
            </div>
          </div>
          {r.status === 'Cancelación pendiente' && <Note tone="amber"><b>Cancelación pendiente.</b> Tu solicitud está siendo revisada por tu agente de viajes.</Note>}
          {r.status === 'Cancelada' && <Note tone="red"><b>Viaje cancelado.</b> Tu agente aprobó la cancelación. El reembolso se procesa en 5 a 10 días hábiles.</Note>}
          {p && <ServicesDetail pkg={p} />}
        </div>
        <aside className="space-y-4">
          <Card className="p-6">
            <p className="text-sm text-slate-500">Valor total</p>
            <p className="text-3xl font-extrabold tracking-tight tnum">{money(r.total)}</p>
            <p className="mt-1 text-[13px] text-slate-500">Orden {r.orderId}</p>
            <div className="mt-5 grid gap-2">
              {r.status === 'Reservada' && <Button onClick={() => go('order', { resId: r.id })}>Continuar con la compra</Button>}
              {r.status === 'Comprada' && <Button onClick={() => go('checkout', { resId: r.id })}>Pagar ahora</Button>}
              {inv && <Button variant="secondary" icon={Ticket} onClick={() => go('invoice', { invoiceId: inv.id, back: 'trip', backParams: { resId: r.id } })}>Ver factura {inv.id}</Button>}
              {canCancel && <Button variant="ghost" className="text-rose-600 hover:!bg-rose-50 hover:!text-rose-700" onClick={() => setOpen(true)}>Solicitar cancelación</Button>}
            </div>
          </Card>
          {agent && (
            <Card className="p-6">
              <p className="text-sm text-slate-500">Tu agente de viajes</p>
              <p className="mt-1 font-semibold">{agent.name}</p>
              <p className="text-[13px] text-slate-500">{agent.email}</p>
            </Card>
          )}
        </aside>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Solicitar cancelación" subtitle={`${p?.name}, ${r.id}`}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Mantener mi viaje</Button><Button variant="danger" onClick={submit}>Enviar solicitud</Button></>}>
        <p className="mb-4 text-sm text-slate-600">Tu agente revisará la solicitud según las condiciones del paquete. Tu viaje sigue activo mientras tanto.</p>
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-[13px] font-medium text-slate-700">Motivo</legend>
          {REASONS.map((x) => (
            <label key={x} className={cx('flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm', reason === x ? 'border-navy bg-mist' : 'border-line')}>
              <input type="radio" name="reason" checked={reason === x} onChange={() => setReason(x)} className="accent-navy" />{x}
            </label>
          ))}
        </fieldset>
        <Textarea label="Detalles (opcional)" value={detail} onChange={(e) => { setDetail(e.target.value); setErr(''); }} error={err} className="mt-4" placeholder="Cualquier dato que ayude a tu agente." />
      </Modal>
    </Page>
  );
}

/* ---------------- Profile ---------------- */

function Profile() {
  const { db, currentClient: c, actions, go } = useStore();
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ email: c.email, phone: c.phone });
  const agent = db.agents.find((a) => a.id === c.agentId);
  const invs = db.invoices.filter((i) => i.clientId === c.id);
  return (
    <Page>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Perfil</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Datos personales</h2>
            {!edit && <Button variant="ghost" size="sm" icon={Pencil} onClick={() => { setF({ email: c.email, phone: c.phone }); setEdit(true); }}>Editar</Button>}
          </div>
          {edit ? (
            <div className="mt-4 grid gap-4">
              <Input label="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
              <Input label="Teléfono" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              <div className="flex gap-2"><Button onClick={() => { actions.updateClient(c.id, f); setEdit(false); }}>Guardar cambios</Button><Button variant="secondary" onClick={() => setEdit(false)}>Cancelar</Button></div>
            </div>
          ) : (
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              {[['Nombre', clientName(c)], ['Documento', c.doc], ['Email', c.email], ['Teléfono', c.phone], ['Empresa', c.company || 'Persona natural'], ['NIT', c.nit || '—'], ['Agente asignado', agent?.name], ['Cliente desde', fmtDate(c.since)]].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>
              ))}
            </dl>
          )}
        </Card>
        <Card className="p-6">
          <h2 className="font-bold">Facturas</h2>
          {invs.length ? (
            <ul className="mt-3 divide-y divide-line">
              {invs.map((i) => (
                <li key={i.id}>
                  <button onClick={() => go('invoice', { invoiceId: i.id, back: 'profile' })} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:text-signal">
                    <span><span className="block text-sm font-semibold">{i.id}</span><span className="text-xs text-slate-500">{fmtDate(i.date)}, {i.items.map((x) => x.name).join(', ')}</span></span>
                    <span className="text-sm font-semibold tnum">{money(i.total)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="Aún no tienes facturas" text="Aparecerán aquí cuando pagues tu primer viaje." />}
        </Card>
      </div>
    </Page>
  );
}

/* ---------------- Footer ---------------- */

function Footer() {
  const { go } = useStore();
  return (
    <footer className="mt-10 border-t border-line bg-white">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© 2026 Warehouse Travel S.A.S. Registro Nacional de Turismo 58214.</p>
        <nav className="flex flex-wrap gap-5">
          <button onClick={() => go('catalog')} className="hover:text-ink">Catálogo</button>
          <button onClick={() => go('offers')} className="hover:text-ink">Ofertas</button>
          <button onClick={() => go('register')} className="hover:text-ink">Crear cuenta</button>
          <button onClick={() => go('trips')} className="hover:text-ink">Mis viajes</button>
        </nav>
      </div>
    </footer>
  );
}
