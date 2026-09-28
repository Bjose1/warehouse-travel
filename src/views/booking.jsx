import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, CreditCard, Landmark, ArrowLeftRight, Wallet, Lock, CheckCircle2, Copy, Loader2, XCircle, CalendarDays, Users, ShieldCheck, Check,
} from 'lucide-react';
import { useStore } from '../App.jsx';
import { money, fmtDate, quote, TODAY, addDays } from '../data.js';
import { cx, Button, Badge, Card, Img, Route, Input, Select, Stepper, PriceLines, EmptyState, ServiceIcons } from '../ui.jsx';
import { durationText, clientName, Note } from './shared.jsx';
import { Page, CountStepper } from './client.jsx';

function Summary({ pkg, date, travelers, footer, code }) {
  const q = quote(pkg, travelers);
  return (
    <aside className="lg:sticky lg:top-[120px]">
      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-lift">
        <div className="relative h-36">
          <Img src={pkg.image} code={pkg.code} alt={pkg.destination} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent" />
          <div className="absolute bottom-3 left-5 text-white">
            <Route from={pkg.origin} to={pkg.code} className="text-lg" />
            <p className="font-bold">{pkg.name}</p>
          </div>
        </div>
        <div className="space-y-2 p-5 text-sm">
          {code && <div className="flex justify-between"><span className="text-slate-500">Código</span><span className="font-semibold">{code}</span></div>}
          <div className="flex justify-between"><span className="text-slate-500">Salida</span><span className="font-semibold">{date ? fmtDate(date) : 'Por elegir'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Duración</span><span className="font-semibold">{durationText(pkg)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Pasajeros</span><span className="font-semibold">{travelers}</span></div>
          <div className="pt-2"><ServiceIcons pkg={pkg} /></div>
        </div>
        <div className="perforation" />
        <div className="p-5">
          <PriceLines total={q.total} lines={[
            ['Precio por persona', money(q.list)],
            ['Subtotal', money(q.subtotal)],
            ['Descuento', q.discount ? `-${money(q.discount)}` : money(0), q.discount ? 'green' : null],
            ['Impuestos y tasas', money(q.taxes)],
          ]} />
          {footer}
        </div>
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500"><Lock className="h-3.5 w-3.5" />Tus datos viajan cifrados.</p>
    </aside>
  );
}

function FlowHeader({ step, back }) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {back ? <Button variant="ghost" icon={ArrowLeft} onClick={back.fn} className="-ml-3 self-start">{back.label}</Button> : <span />}
      <Stepper current={step} />
    </div>
  );
}

/* ---------- 01 Viaje, 02 Datos, 03 Confirmación ---------- */

export function BookingFlow() {
  const { db, nav, go, currentClient, actions } = useStore();
  const pkg = db.packages.find((p) => p.id === nav.packageId);
  const upcoming = pkg ? pkg.departures.filter((d) => d >= TODAY) : [];
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(nav.date || upcoming[0] || '');
  const [trav, setTrav] = useState(nav.travelers || 2);
  const [contact, setContact] = useState({ name: clientName(currentClient), doc: currentClient.doc, email: currentClient.email, phone: currentClient.phone });
  const [companions, setCompanions] = useState([]);
  const [errors, setErrors] = useState({});
  const [accept, setAccept] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setCompanions((c) => Array.from({ length: trav - 1 }, (_, i) => c[i] || '')); }, [trav]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [step]);
  if (!pkg) return <Page><EmptyState title="Elige un paquete para reservar" action={<Button onClick={() => go('catalog')}>Explorar viajes</Button>} /></Page>;

  const validateData = () => {
    const e = {};
    if (!contact.name.trim()) e.name = 'Escribe el nombre del titular.';
    if (!contact.doc.trim()) e.doc = 'Ingresa el documento.';
    if (!/^\S+@\S+\.\S+$/.test(contact.email)) e.email = 'Revisa el email.';
    if (contact.phone.replace(/\D/g, '').length < 7) e.phone = 'Ingresa un teléfono.';
    companions.forEach((n, i) => { if (!n.trim()) e['c' + i] = 'Escribe el nombre como aparece en el documento.'; });
    setErrors(e);
    return !Object.keys(e).length;
  };
  const nextStep = () => {
    if (step === 0 && !date) return;
    if (step === 1 && !validateData()) return;
    setStep(step + 1);
  };
  const confirm = () => {
    setSaving(true);
    setTimeout(() => {
      const id = actions.createReservation({ packageId: pkg.id, date, travelers: trav, contact: { ...contact, companions } });
      go('reserved', { resId: id });
    }, 800);
  };

  return (
    <Page>
      <FlowHeader step={step} back={{ label: step ? 'Paso anterior' : 'Volver al viaje', fn: () => (step ? setStep(step - 1) : go('detail', { id: pkg.id })) }} />
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          {step === 0 && (
            <Card className="p-6 sm:p-8">
              <h1 className="text-2xl font-bold tracking-tight">Elige tu salida</h1>
              <p className="mt-1 text-sm text-slate-500">El regreso se calcula según la duración del paquete.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {upcoming.map((d) => (
                  <button key={d} onClick={() => setDate(d)} aria-pressed={date === d}
                    className={cx('flex items-center justify-between rounded-2xl border p-4 text-left transition-colors', date === d ? 'border-navy bg-navy text-white' : 'border-line hover:border-slate-300')}>
                    <span>
                      <span className="block font-semibold">{fmtDate(d)}</span>
                      <span className={cx('text-[13px]', date === d ? 'text-white/60' : 'text-slate-500')}>Regreso {fmtDate(addDays(d, pkg.days - 1))}</span>
                    </span>
                    <CalendarDays className={cx('h-5 w-5', date === d ? 'text-white/70' : 'text-slate-400')} />
                  </button>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between rounded-2xl border border-line p-4">
                <span><span className="block font-semibold">Viajeros</span><span className="text-[13px] text-slate-500">Adultos y niños desde 2 años</span></span>
                <CountStepper value={trav} onChange={setTrav} label="Viajeros" />
              </div>
              <div className="mt-8 flex justify-end"><Button size="lg" onClick={nextStep} disabled={!date}>Continuar</Button></div>
            </Card>
          )}
          {step === 1 && (
            <Card className="p-6 sm:p-8">
              <h1 className="text-2xl font-bold tracking-tight">Datos de los viajeros</h1>
              <p className="mt-1 text-sm text-slate-500">Usamos estos datos para emitir tiquetes y el seguro de viaje.</p>
              <h2 className="mt-6 text-sm font-bold">Titular de la reserva</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Input label="Nombre completo" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} error={errors.name} />
                <Input label="Documento" value={contact.doc} onChange={(e) => setContact({ ...contact, doc: e.target.value })} error={errors.doc} />
                <Input label="Email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} error={errors.email} />
                <Input label="Teléfono" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} error={errors.phone} />
              </div>
              {companions.length > 0 && (
                <>
                  <h2 className="mt-8 text-sm font-bold">Acompañantes</h2>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {companions.map((n, i) => (
                      <Input key={i} label={`Viajero ${i + 2}`} value={n} error={errors['c' + i]} placeholder="Nombre y apellido"
                        onChange={(e) => setCompanions(companions.map((x, j) => (j === i ? e.target.value : x)))} />
                    ))}
                  </div>
                </>
              )}
              <div className="mt-8 flex justify-end"><Button size="lg" onClick={nextStep}>Revisar reserva</Button></div>
            </Card>
          )}
          {step === 2 && (
            <Card className="p-6 sm:p-8">
              <h1 className="text-2xl font-bold tracking-tight">Confirma tu reserva</h1>
              <p className="mt-1 text-sm text-slate-500">Reservar no genera cobro. Apartamos tu cupo por 48 horas para que completes la compra.</p>
              <dl className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
                {[['Paquete', pkg.name], ['Destino', `${pkg.destination}, ${pkg.country}`], ['Salida', fmtDate(date)], ['Regreso', fmtDate(addDays(date, pkg.days - 1))], ['Titular', contact.name], ['Pasajeros', [contact.name, ...companions].join(', ')]].map(([k, v]) => (
                  <div key={k} className="bg-white p-4"><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-0.5 text-sm font-semibold">{v}</dd></div>
                ))}
              </dl>
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-mist p-4 text-sm">
                <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 h-4 w-4 accent-signal" />
                <span>Acepto las condiciones del paquete y la política de cancelación. Entiendo que el paquete se compra completo.</span>
              </label>
              <div className="mt-8 flex justify-end"><Button size="lg" onClick={confirm} disabled={!accept} loading={saving}>Confirmar reserva</Button></div>
            </Card>
          )}
        </div>
        <Summary pkg={pkg} date={date} travelers={trav} />
      </div>
    </Page>
  );
}

/* ---------- Reservation confirmed ---------- */

function useReservation() {
  const { db, nav } = useStore();
  const r = db.reservations.find((x) => x.id === nav.resId);
  const pkg = r && db.packages.find((p) => p.id === r.packageId);
  return [r, pkg];
}

export function ReservedView() {
  const { go } = useStore();
  const [r, pkg] = useReservation();
  if (!r || !pkg) return <Page><EmptyState title="No encontramos la reserva" action={<Button onClick={() => go('trips')}>Ir a mis viajes</Button>} /></Page>;
  return (
    <Page>
      <FlowHeader step={3} />
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-lift" style={{ '--notch': '#F4F6F9' }}>
          <div className="bg-navy px-6 py-8 text-center text-white sm:px-10">
            <span className="mx-auto grid h-14 w-14 animate-rise place-items-center rounded-full bg-emerald-500"><Check className="h-7 w-7" /></span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Reserva confirmada</h1>
            <p className="mt-1 text-white/60">Tu cupo está apartado hasta el {fmtDate(addDays(TODAY, 2))}.</p>
            <p className="mt-5 font-board text-4xl font-semibold tracking-[0.08em]">{r.id}</p>
          </div>
          <div className="flex items-center justify-between px-6 py-5 font-board text-3xl font-semibold tracking-wide sm:px-10">
            <span>{pkg.origin}</span><span className="h-px flex-1 border-t border-dashed border-slate-300 mx-4" /><span className="text-signal">{pkg.code}</span>
          </div>
          <div className="perforation" />
          <dl className="grid grid-cols-2 gap-5 px-6 py-6 text-sm sm:grid-cols-3 sm:px-10">
            {[['Destino', pkg.destination], ['Paquete', pkg.name], ['Fecha', fmtDate(r.date)], ['Pasajeros', r.travelers], ['Precio', money(r.total)]].map(([k, v]) => (
              <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>
            ))}
          </dl>
          <div className="flex flex-col gap-2 border-t border-line px-6 py-5 sm:flex-row sm:justify-end sm:px-10">
            <Button variant="secondary" onClick={() => go('trips')}>Ver en mis viajes</Button>
            <Button size="lg" onClick={() => go('order', { resId: r.id })}>Continuar con la compra</Button>
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ---------- Order ---------- */

export function OrderView() {
  const { go, actions } = useStore();
  const [r, pkg] = useReservation();
  if (!r || !pkg) return <Page><EmptyState title="No encontramos la orden" action={<Button onClick={() => go('trips')}>Ir a mis viajes</Button>} /></Page>;
  const q = quote(pkg, r.travelers);
  const buy = () => { actions.purchaseOrder(r.id); go('checkout', { resId: r.id }); };
  return (
    <Page>
      <FlowHeader step={3} back={{ label: 'Mis viajes', fn: () => go('trips') }} />
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <Card className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tu reserva</h1>
              <p className="mt-1 font-board text-xl font-semibold tracking-wide text-slate-500">{r.orderId}</p>
            </div>
            <Badge>{r.status}</Badge>
          </div>
          <h2 className="mt-8 text-sm font-bold">Desglose del paquete</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
            {[
              ['Transporte', `${pkg.transport.carrier}: ${pkg.transport.detail}`],
              ['Alojamiento', `${pkg.lodging.name}, ${pkg.lodging.nights} noches`],
              ['Vehículo', pkg.car ? `${pkg.car.model} (${pkg.car.category})` : 'Traslados aeropuerto–hotel'],
              ['Seguro', `Seguro ${pkg.insurance} para ${r.travelers} ${r.travelers === 1 ? 'viajero' : 'viajeros'}`],
            ].map(([k, v]) => (
              <li key={k} className="flex flex-col gap-0.5 p-4 sm:flex-row sm:gap-6"><span className="w-28 shrink-0 text-sm text-slate-500">{k}</span><span className="text-sm font-medium">{v}</span></li>
            ))}
          </ul>
          <div className="mt-6 max-w-sm sm:ml-auto">
            <PriceLines total={q.total} lines={[
              [`${money(q.list)} × ${r.travelers} viajeros`, money(q.subtotal)],
              ['Descuento', q.discount ? `-${money(q.discount)}` : money(0), q.discount ? 'green' : null],
              ['Impuestos y tasas', money(q.taxes)],
            ]} />
          </div>
          {r.status === 'Reservada' && <div className="mt-8 flex justify-end"><Button size="lg" onClick={buy}>Comprar ahora</Button></div>}
          {r.status === 'Comprada' && <div className="mt-8 flex justify-end"><Button size="lg" onClick={() => go('checkout', { resId: r.id })}>Ir al pago</Button></div>}
          {!['Reservada', 'Comprada'].includes(r.status) && <div className="mt-8"><Note>Esta orden ya está en estado “{r.status}”.</Note></div>}
        </Card>
        <Summary pkg={pkg} date={r.date} travelers={r.travelers} code={r.id} />
      </div>
    </Page>
  );
}

/* ---------- Checkout ---------- */

const METHODS = [
  { id: 'Tarjeta', label: 'Tarjeta', sub: 'Crédito o débito', icon: CreditCard },
  { id: 'PSE', label: 'PSE', sub: 'Débito desde tu banco', icon: Landmark },
  { id: 'Transferencia', label: 'Transferencia', sub: 'Consignación bancaria', icon: ArrowLeftRight },
  { id: 'PayPal', label: 'PayPal', sub: 'Saldo o tarjetas guardadas', icon: Wallet },
];
const BANKS = ['Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA Colombia', 'Banco de Occidente', 'Nequi', 'Scotiabank Colpatria'];

const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtExp = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

function CardPreview({ card }) {
  return (
    <div className="relative aspect-[1.6] w-[300px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-800 to-signal-700 p-5 text-white shadow-pop">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="flex items-center justify-between">
        <span className="h-7 w-10 rounded-md bg-gradient-to-br from-amber-200 to-amber-400" />
        <span className="font-board text-sm font-semibold tracking-[0.2em] text-white/70">WAREHOUSE</span>
      </div>
      <p className="mt-6 font-board text-[22px] font-semibold tracking-[0.12em] tnum">{card.number || '•••• •••• •••• ••••'}</p>
      <div className="mt-4 flex justify-between text-xs">
        <div><p className="text-white/50">Titular</p><p className="truncate font-semibold uppercase">{card.name || 'Nombre en la tarjeta'}</p></div>
        <div className="text-right"><p className="text-white/50">Vence</p><p className="font-semibold">{card.exp || 'MM/AA'}</p></div>
      </div>
    </div>
  );
}

export function CheckoutView() {
  const { go, actions, toast, currentClient } = useStore();
  const [r, pkg] = useReservation();
  const [method, setMethod] = useState('Tarjeta');
  const [card, setCard] = useState({ number: '', name: '', exp: '', cvc: '', installments: '1' });
  const [pse, setPse] = useState({ bank: '', person: 'Natural' });
  const [transfer, setTransfer] = useState(false);
  const [paypal, setPaypal] = useState(false);
  const [errors, setErrors] = useState({});
  const [phase, setPhase] = useState('idle'); // idle | processing | error
  const [stage, setStage] = useState(0);
  // Errors belong to the last attempt; any edit clears them.
  useEffect(() => { setErrors({}); }, [card, pse, transfer, paypal]);
  if (!r || !pkg) return <Page><EmptyState title="No hay nada por pagar" action={<Button onClick={() => go('trips')}>Ir a mis viajes</Button>} /></Page>;
  if (r.status === 'Pagada') return <Page><EmptyState icon={CheckCircle2} title="Esta reserva ya está pagada" action={<Button onClick={() => go('trip', { resId: r.id })}>Ver viaje</Button>} /></Page>;
  const q = quote(pkg, r.travelers);

  const validate = () => {
    const e = {};
    if (method === 'Tarjeta') {
      if (card.number.replace(/\s/g, '').length !== 16) e.number = 'El número debe tener 16 dígitos.';
      if (!card.name.trim()) e.name = 'Escribe el nombre como aparece en la tarjeta.';
      const [mm, yy] = card.exp.split('/').map(Number);
      if (!mm || mm > 12 || !yy || 2000 + yy < 2026) e.exp = 'Fecha inválida.';
      if (!/^\d{3,4}$/.test(card.cvc)) e.cvc = '3 o 4 dígitos.';
    }
    if (method === 'PSE' && !pse.bank) e.bank = 'Elige tu banco.';
    if (method === 'Transferencia' && !transfer) e.transfer = 'Confirma que realizaste la transferencia.';
    if (method === 'PayPal' && !paypal) e.paypal = 'Conecta tu cuenta para continuar.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const pay = () => {
    if (!validate()) return;
    setPhase('processing');
    setStage(0);
    setTimeout(() => setStage(1), 700);
    setTimeout(() => setStage(2), 1400);
    setTimeout(() => {
      if (method === 'Tarjeta' && card.number.replace(/\s/g, '').endsWith('0000')) { setPhase('error'); return; }
      const { txnId, invoiceId } = actions.payReservation(r.id, method);
      toast('Pago aprobado', `${txnId} por ${money(q.total)}`);
      go('paid', { resId: r.id, txnId, invoiceId });
    }, 2100);
  };

  return (
    <Page>
      <FlowHeader step={3} back={{ label: 'Volver a la orden', fn: () => go('order', { resId: r.id }) }} />
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">¿Cómo quieres pagar?</h1>
          <p className="mt-1 text-sm text-slate-500">Orden {r.orderId} para {clientName(currentClient)}.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4" role="radiogroup" aria-label="Método de pago">
            {METHODS.map((m) => (
              <button key={m.id} role="radio" aria-checked={method === m.id} onClick={() => { setMethod(m.id); setErrors({}); setPhase('idle'); }}
                className={cx('rounded-2xl border p-4 text-left transition-colors', method === m.id ? 'border-signal bg-signal-50 ring-4 ring-signal/10' : 'border-line bg-white hover:border-slate-300')}>
                <m.icon className={cx('h-5 w-5', method === m.id ? 'text-signal' : 'text-slate-500')} />
                <p className="mt-3 text-sm font-bold">{m.label}</p>
                <p className="text-xs text-slate-500">{m.sub}</p>
              </button>
            ))}
          </div>

          <Card className="mt-4 p-6 sm:p-8">
            {method === 'Tarjeta' && (
              <div className="grid gap-8 md:grid-cols-[1fr_auto]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Número de tarjeta" className="sm:col-span-2" inputMode="numeric" autoComplete="off" placeholder="0000 0000 0000 0000" value={card.number} error={errors.number} onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })} />
                  <Input label="Nombre del titular" className="sm:col-span-2" autoComplete="off" value={card.name} error={errors.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                  <Input label="Vencimiento" placeholder="MM/AA" inputMode="numeric" autoComplete="off" value={card.exp} error={errors.exp} onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })} />
                  <Input label="CVC" placeholder="123" inputMode="numeric" autoComplete="off" value={card.cvc} error={errors.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
                  <Select label="Cuotas" value={card.installments} onChange={(e) => setCard({ ...card, installments: e.target.value })} options={['1', '3', '6', '12', '24', '36'].map((n) => ({ value: n, label: n === '1' ? '1 cuota' : `${n} cuotas de ${money(q.total / Number(n))}` }))} className="sm:col-span-2" />
                  <p className="text-xs text-slate-500 sm:col-span-2">Simulación: <button type="button" className="font-semibold text-signal hover:underline" onClick={() => setCard({ number: '4242 4242 4242 4242', name: clientName(currentClient), exp: '08/29', cvc: '123', installments: '1' })}>usar tarjeta de prueba</button>. Una tarjeta terminada en 0000 simula un rechazo.</p>
                </div>
                <div className="hidden md:block"><CardPreview card={card} /></div>
              </div>
            )}
            {method === 'PSE' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Banco" value={pse.bank} onChange={(e) => setPse({ ...pse, bank: e.target.value })} options={[{ value: '', label: 'Selecciona tu banco' }, ...BANKS]} className="sm:col-span-2" />
                {errors.bank && <p className="-mt-3 text-xs text-rose-600 sm:col-span-2">{errors.bank}</p>}
                <fieldset className="sm:col-span-2">
                  <legend className="mb-1.5 text-[13px] font-medium text-slate-700">Tipo de persona</legend>
                  <div className="flex gap-2">
                    {['Natural', 'Jurídica'].map((t) => (
                      <button type="button" key={t} onClick={() => setPse({ ...pse, person: t })} className={cx('h-11 flex-1 rounded-xl border text-sm font-semibold', pse.person === t ? 'border-navy bg-navy text-white' : 'border-line')}>{t}</button>
                    ))}
                  </div>
                </fieldset>
                <Input label="Email registrado en PSE" defaultValue={currentClient.email} className="sm:col-span-2" />
                <div className="sm:col-span-2"><Note>Te llevaremos a la página de tu banco para autorizar el débito. En este prototipo el banco responde de inmediato.</Note></div>
              </div>
            )}
            {method === 'Transferencia' && (
              <div>
                <p className="text-sm text-slate-600">Transfiere el valor exacto a esta cuenta y usa tu número de orden como referencia.</p>
                <dl className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
                  {[['Banco', 'Bancolombia'], ['Tipo de cuenta', 'Corriente'], ['Número', '031-845-22710'], ['Titular', 'Warehouse Travel S.A.S.'], ['NIT', '901.482.115-6'], ['Referencia', r.orderId]].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-2 bg-white p-4">
                      <div><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-0.5 text-sm font-semibold">{v}</dd></div>
                      {(k === 'Número' || k === 'Referencia') && (
                        <button type="button" aria-label={`Copiar ${k}`} onClick={() => { navigator.clipboard?.writeText(v); toast('Copiado', v, 'info'); }} className="text-slate-400 hover:text-ink"><Copy className="h-4 w-4" /></button>
                      )}
                    </div>
                  ))}
                </dl>
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-mist p-4 text-sm">
                  <input type="checkbox" checked={transfer} onChange={(e) => setTransfer(e.target.checked)} className="mt-0.5 h-4 w-4 accent-signal" />
                  <span>Ya transferí {money(q.total)} con la referencia {r.orderId}.</span>
                </label>
                {errors.transfer && <p className="mt-2 text-xs text-rose-600">{errors.transfer}</p>}
              </div>
            )}
            {method === 'PayPal' && (
              <div className="flex flex-col items-start gap-4">
                <p className="text-sm text-slate-600">Inicia sesión en tu cuenta en una ventana segura y regresa para confirmar. El cargo se hace en pesos colombianos.</p>
                {paypal ? (
                  <div className="flex w-full items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="h-5 w-5" />Cuenta conectada: {currentClient.email}</div>
                ) : (
                  <Button variant="dark" icon={Wallet} onClick={() => setPaypal(true)}>Conectar cuenta de PayPal</Button>
                )}
                {errors.paypal && <p className="text-xs text-rose-600">{errors.paypal}</p>}
              </div>
            )}
          </Card>

          {phase === 'error' && (
            <div className="mt-4 flex animate-rise items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div><p className="font-semibold">Pago rechazado</p><p>La entidad emisora no autorizó la transacción. Prueba con otra tarjeta o elige otro método.</p></div>
            </div>
          )}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" />Pago protegido. No guardamos los datos de tu tarjeta.</p>
            <Button size="lg" icon={Lock} onClick={pay} loading={phase === 'processing'} className="lg:hidden">Pagar {money(q.total)}</Button>
          </div>
        </div>
        <Summary pkg={pkg} date={r.date} travelers={r.travelers} code={r.orderId}
          footer={<Button size="lg" icon={Lock} onClick={pay} loading={phase === 'processing'} className="mt-5 hidden w-full lg:inline-flex">Pagar {money(q.total)}</Button>} />
      </div>

      {phase === 'processing' && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/60 p-6 backdrop-blur-sm" role="alertdialog" aria-live="assertive" aria-label="Procesando pago">
          <div className="w-full max-w-sm animate-rise rounded-3xl bg-white p-8 text-center shadow-pop">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-signal" />
            <p className="mt-4 text-lg font-bold">Procesando</p>
            <p className="text-sm text-slate-500">No cierres esta ventana.</p>
            <ol className="mt-6 space-y-2 text-left text-sm">
              {['Validando datos', method === 'Tarjeta' ? 'Consultando a la entidad emisora' : `Conectando con ${method}`, 'Confirmando el pago'].map((s, i) => (
                <li key={s} className={cx('flex items-center gap-2', i <= stage ? 'text-ink' : 'text-slate-400')}>
                  {i < stage ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : i === stage ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}{s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Page>
  );
}

/* ---------- Payment approved ---------- */

export function PaidView() {
  const { db, nav, go } = useStore();
  const [r, pkg] = useReservation();
  const pay = db.payments.find((p) => p.id === nav.txnId);
  if (!r || !pay) return <Page><EmptyState title="No encontramos el pago" action={<Button onClick={() => go('trips')}>Ir a mis viajes</Button>} /></Page>;
  return (
    <Page>
      <FlowHeader step={4} />
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto grid h-20 w-20 animate-rise place-items-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50"><CheckCircle2 className="h-10 w-10 text-emerald-600" /></span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">Pago aprobado</h1>
        <p className="mt-2 flex items-center justify-center gap-1.5 font-semibold text-emerald-700"><Check className="h-4 w-4" />Pago realizado correctamente</p>
        <Card className="mt-8 text-left">
          <dl className="divide-y divide-line text-sm">
            {[['Transacción', pay.id], ['Valor', money(pay.amount)], ['Método', pay.method], ['Paquete', pkg?.name], ['Reserva', `${r.id}, sale el ${fmtDate(r.date)}`], ['Factura', nav.invoiceId]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-5 py-3.5"><dt className="text-slate-500">{k}</dt><dd className={cx('text-right font-semibold', k === 'Valor' && 'text-lg tnum')}>{v}</dd></div>
            ))}
          </dl>
        </Card>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button size="lg" onClick={() => go('invoice', { invoiceId: nav.invoiceId, back: 'trips' })}>Ver factura</Button>
          <Button size="lg" variant="secondary" onClick={() => go('trip', { resId: r.id })}>Ver mi viaje</Button>
        </div>
      </div>
    </Page>
  );
}
