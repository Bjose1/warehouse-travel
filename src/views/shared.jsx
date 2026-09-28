import React, { useMemo, useState } from 'react';
import {
  Download, Printer, Building2, Mail, Phone, IdCard, UserCheck, Search, CalendarDays, Plane, Hotel, Car, ShieldCheck,
  ImageIcon, Info, FileText, ArrowLeft,
} from 'lucide-react';
import { useStore, Logo } from '../App.jsx';
import { money, fmtDate, TRANSPORT, INSURANCE, TAX_RATE } from '../data.js';
import {
  cx, Button, Badge, Card, Img, Rating, ServiceIcons, Route, Avatar, Drawer, DataTable, Segmented, Input, Select, Textarea,
  EmptyState, PageHeader, Toggle, TRANSPORT_ICON,
} from '../ui.jsx';

export const clientName = (c) => (c ? `${c.first} ${c.last}` : '—');
export const durationText = (p) => `${p.days} días, ${p.nights} noches`;

/* ---------- Package card: styled like a boarding pass ---------- */

export function PackageCard({ pkg, onView, onBook, notch = '#F4F6F9' }) {
  const off = pkg.oldPrice ? Math.round((1 - pkg.price / pkg.oldPrice) * 100) : 0;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-lift">
      <button onClick={onView} className="relative block aspect-[4/3] overflow-hidden text-left" aria-label={`Ver ${pkg.name}`}>
        <Img src={pkg.image} alt={pkg.destination} code={pkg.code} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy-900/70 to-transparent" />
        <span className="absolute bottom-3 left-4 text-white"><Route from={pkg.origin} to={pkg.code} className="text-lg" /></span>
        {off > 0 && <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-rose-600 tnum">-{off}%</span>}
        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1"><Rating value={pkg.rating} /></span>
      </button>
      <div className="flex flex-1 flex-col px-5 pb-4 pt-4">
        <p className="text-[13px] text-slate-500">{pkg.destination}, {pkg.country}</p>
        <h3 className="mt-0.5 text-[17px] font-bold leading-snug tracking-tight text-ink">{pkg.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-500"><CalendarDays className="h-3.5 w-3.5" />{durationText(pkg)}</p>
        <div className="mt-3"><ServiceIcons pkg={pkg} /></div>
      </div>
      <div className="perforation mx-0" style={{ '--notch': notch }} />
      <div className="flex items-end justify-between gap-3 px-5 pb-5 pt-4">
        <div>
          {pkg.oldPrice && <p className="text-[13px] text-slate-400 line-through tnum">{money(pkg.oldPrice)}</p>}
          <p className="text-[22px] font-extrabold leading-none tracking-tight text-ink tnum">{money(pkg.price)}</p>
          <p className="mt-1 text-xs text-slate-500">por persona</p>
        </div>
        <div className="flex gap-1.5">
          <Button variant="secondary" size="sm" onClick={onView}>Ver viaje</Button>
          <Button size="sm" onClick={onBook}>Reservar</Button>
        </div>
      </div>
    </article>
  );
}

/* ---------- Invoice ---------- */

function invoiceHtml(inv, client, payment) {
  const rows = inv.items.map((i) => `<tr><td>${i.name}<br><small>${i.travelers} viajero(s) · ${i.reservationId}</small></td><td style="text-align:right">${money(i.amount)}</td></tr>`).join('');
  return `<!doctype html><html lang="es"><meta charset="utf-8"><title>${inv.id}</title>
<style>body{font-family:system-ui,sans-serif;color:#141922;max-width:720px;margin:40px auto;padding:0 24px}h1{margin:0}table{width:100%;border-collapse:collapse;margin:24px 0}td,th{padding:10px 0;border-bottom:1px solid #E3E8EF;text-align:left}small{color:#64748b}.t{font-size:20px;font-weight:700}</style>
<h1>Warehouse Travel</h1><p>NIT 901.482.115-6 · Bogotá, Colombia</p><h2>Factura ${inv.id}</h2>
<p>Cliente: ${clientName(client)}${client?.company ? ` — ${client.company} (NIT ${client.nit})` : ''}<br>Fecha: ${fmtDate(inv.date)}<br>Método de pago: ${inv.method}<br>Estado: ${payment?.status || 'Pendiente'}</p>
<table><tr><th>Paquete</th><th style="text-align:right">Valor</th></tr>${rows}</table>
<p>Subtotal: ${money(inv.subtotal)}<br>Descuento: -${money(inv.discount)}<br>Impuestos y tasas: ${money(inv.taxes)}</p><p class="t">Total: ${money(inv.total)}</p></html>`;
}

export function InvoiceView({ invoiceId, onBack, backLabel = 'Volver' }) {
  const { db, toast } = useStore();
  const inv = db.invoices.find((i) => i.id === invoiceId);
  if (!inv) return <EmptyState icon={FileText} title="No encontramos esta factura" text="Puede que aún se esté generando. Vuelve a intentarlo en un momento." />;
  const client = db.clients.find((c) => c.id === inv.clientId);
  const payment = db.payments.find((p) => p.invoiceId === inv.id && p.status !== 'Rechazado');
  const agent = db.agents.find((a) => a.id === client?.agentId);
  const download = () => {
    const blob = new Blob([invoiceHtml(inv, client, payment)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${inv.id}.html`; a.click();
    URL.revokeObjectURL(url);
    toast('Factura descargada', `${inv.id}.html`);
  };
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {onBack ? <Button variant="ghost" icon={ArrowLeft} onClick={onBack} className="-ml-3">{backLabel}</Button> : <span />}
        <div className="flex gap-2">
          <Button variant="secondary" icon={Download} onClick={download}>Descargar</Button>
          <Button variant="dark" icon={Printer} onClick={() => window.print()}>Imprimir</Button>
        </div>
      </div>
      <article id="invoice-print" className="overflow-hidden rounded-3xl border border-line bg-white shadow-lift">
        <div className="flex flex-col gap-6 bg-navy px-6 py-7 text-white sm:flex-row sm:items-start sm:justify-between sm:px-10">
          <div>
            <Logo light />
            <p className="mt-4 text-xs leading-relaxed text-white/60">NIT 901.482.115-6<br />Calle 93 #11-26, Bogotá<br />facturacion@warehousetravel.co</p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-white/60">Factura electrónica</p>
            <p className="font-board text-3xl font-semibold tracking-wide">{inv.id}</p>
            <div className="mt-2"><Badge tone={payment?.status === 'Aprobado' ? 'green' : 'amber'} className="!bg-white/10 !text-white !ring-white/20">{payment?.status === 'Aprobado' ? 'Pagada' : 'Pago pendiente'}</Badge></div>
          </div>
        </div>
        <div className="grid gap-6 border-b border-line px-6 py-6 text-sm sm:grid-cols-3 sm:px-10">
          <div>
            <p className="text-xs text-slate-500">Cliente</p>
            <p className="mt-1 font-semibold">{clientName(client)}</p>
            <p className="text-slate-500">{client?.doc}</p>
            {client?.company && <p className="mt-1 text-slate-600">{client.company}<br />NIT {client.nit}</p>}
          </div>
          <div>
            <p className="text-xs text-slate-500">Fecha de emisión</p>
            <p className="mt-1 font-semibold">{fmtDate(inv.date)}</p>
            <p className="mt-3 text-xs text-slate-500">Agente</p>
            <p className="mt-1 font-semibold">{agent?.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Método de pago</p>
            <p className="mt-1 font-semibold">{inv.method}</p>
            {payment && <><p className="mt-3 text-xs text-slate-500">Transacción</p><p className="mt-1 font-semibold">{payment.id}</p></>}
          </div>
        </div>
        <div className="px-6 py-6 sm:px-10">
          <p className="mb-3 text-sm font-semibold">Paquetes adquiridos</p>
          <ul className="divide-y divide-line border-y border-line">
            {inv.items.map((i) => {
              const p = db.packages.find((x) => x.id === i.packageId);
              return (
                <li key={i.reservationId} className="flex items-start justify-between gap-4 py-4">
                  <div>
                    <p className="font-semibold">{i.name}</p>
                    <p className="text-[13px] text-slate-500">Paquete completo para {i.travelers} {i.travelers === 1 ? 'viajero' : 'viajeros'}, reserva {i.reservationId}</p>
                    {p && <p className="mt-1 text-xs text-slate-400">Incluye {TRANSPORT[p.transport.type].toLowerCase()}, {p.lodging.type.toLowerCase()}{p.car ? ', auto' : ''} y seguro {p.insurance.toLowerCase()}</p>}
                  </div>
                  <p className="shrink-0 font-semibold tnum">{money(i.amount)}</p>
                </li>
              );
            })}
          </ul>
          <dl className="ml-auto mt-5 max-w-xs space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="tnum">{money(inv.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Descuento{inv.discountRate ? ` corporativo (${inv.discountRate * 100}%)` : ''}</dt><dd className="tnum text-emerald-600">-{money(inv.discount)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Impuestos y tasas ({TAX_RATE * 100}%)</dt><dd className="tnum">{money(inv.taxes)}</dd></div>
            <div className="flex items-baseline justify-between border-t border-line pt-3"><dt className="font-semibold">Total</dt><dd className="text-2xl font-extrabold tracking-tight tnum">{money(inv.total)}</dd></div>
          </dl>
        </div>
        <p className="border-t border-line bg-mist px-6 py-4 text-xs text-slate-500 sm:px-10">Documento generado por Warehouse Travel. Los paquetes se facturan completos: transporte, alojamiento, movilidad y seguro no se venden por separado.</p>
      </article>
    </div>
  );
}

/* ---------- Client profile drawer ---------- */

export function ClientDrawer({ clientId, onClose, onOpenInvoice }) {
  const { db, actions } = useStore();
  const [tab, setTab] = useState('perfil');
  const c = db.clients.find((x) => x.id === clientId);
  if (!c) return null;
  const agent = db.agents.find((a) => a.id === c.agentId);
  const res = db.reservations.filter((r) => r.clientId === c.id);
  const invs = db.invoices.filter((i) => i.clientId === c.id);
  const pays = db.payments.filter((p) => p.clientId === c.id);
  const value = pays.filter((p) => p.status === 'Aprobado').reduce((s, p) => s + p.amount, 0);
  const row = (Icon, label, v) => (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 text-slate-400" />
      <div><p className="text-xs text-slate-500">{label}</p><p className="text-sm font-medium">{v}</p></div>
    </div>
  );
  return (
    <Drawer open onClose={onClose}
      title={<div className="flex items-center gap-3"><Avatar name={clientName(c)} size="lg" /><div><h2 className="text-lg font-bold">{clientName(c)}</h2><div className="mt-1 flex flex-wrap gap-1.5"><Badge>{c.status}</Badge>{c.nit && <Badge tone="violet">Cliente corporativo</Badge>}</div></div></div>}
      footer={<>
        <Button variant="secondary" className="flex-1" onClick={() => actions.updateClient(c.id, { status: c.status === 'Activo' ? 'Inactivo' : 'Activo' })}>{c.status === 'Activo' ? 'Marcar inactivo' : 'Reactivar cliente'}</Button>
        <Button className="flex-1" onClick={onClose}>Listo</Button>
      </>}>
      <div className="grid grid-cols-3 gap-2">
        {[['Reservas', res.length], ['Facturas', invs.length], ['Valor generado', money(value)]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-mist p-3"><p className="text-[11px] text-slate-500">{k}</p><p className="mt-0.5 truncate text-[15px] font-bold tnum">{v}</p></div>
        ))}
      </div>
      <Segmented className="mt-5 w-full overflow-x-auto" value={tab} onChange={setTab} options={[
        { value: 'perfil', label: 'Perfil' }, { value: 'reservas', label: 'Reservas', count: res.length },
        { value: 'facturas', label: 'Facturas', count: invs.length }, { value: 'actividad', label: 'Actividad' },
      ]} />
      <div className="mt-4">
        {tab === 'perfil' && (
          <div className="divide-y divide-line">
            <section className="pb-3">
              <p className="pt-1 text-sm font-semibold">Datos personales</p>
              {row(IdCard, 'Documento', c.doc)}
              {row(Mail, 'Email', c.email)}
              {row(Phone, 'Teléfono', c.phone)}
            </section>
            <section className="py-3">
              <p className="pt-1 text-sm font-semibold">Datos corporativos</p>
              {c.company ? <>{row(Building2, 'Empresa', c.company)}{row(FileText, 'NIT', c.nit)}</> : <p className="py-2 text-sm text-slate-500">Viaja como persona natural.</p>}
            </section>
            <section className="pt-3">
              <p className="pt-1 text-sm font-semibold">Agente asignado</p>
              {row(UserCheck, agent?.region, agent?.name)}
            </section>
          </div>
        )}
        {tab === 'reservas' && (res.length ? (
          <ul className="space-y-2">
            {res.map((r) => {
              const p = db.packages.find((x) => x.id === r.packageId);
              return (
                <li key={r.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <Img src={p?.image} code={p?.code} alt={p?.destination} className="h-12 w-12 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p?.name}</p><p className="text-xs text-slate-500">{r.id}, sale el {fmtDate(r.date)}</p></div>
                  <Badge>{r.status}</Badge>
                </li>
              );
            })}
          </ul>
        ) : <EmptyState title="Sin reservas" text="Este cliente todavía no ha reservado." />)}
        {tab === 'facturas' && (invs.length ? (
          <ul className="space-y-2">
            {invs.map((i) => {
              const p = pays.find((x) => x.invoiceId === i.id && x.status !== 'Rechazado');
              return (
                <li key={i.id}>
                  <button onClick={() => onOpenInvoice?.(i.id)} className="flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left hover:bg-mist">
                    <FileText className="h-5 w-5 text-slate-400" />
                    <div className="flex-1"><p className="text-sm font-semibold">{i.id}</p><p className="text-xs text-slate-500">{fmtDate(i.date)}, {i.items.length} {i.items.length === 1 ? 'paquete' : 'paquetes'}</p></div>
                    <div className="text-right"><p className="text-sm font-semibold tnum">{money(i.total)}</p><Badge>{p?.status || 'Pendiente'}</Badge></div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : <EmptyState title="Sin facturas" text="Genera una desde Facturación." />)}
        {tab === 'actividad' && (
          <ol className="relative ml-2 space-y-5 border-l border-line pl-5">
            {[
              ...res.map((r) => ({ d: r.createdAt, t: `Reservó ${db.packages.find((p) => p.id === r.packageId)?.name} (${r.id})` })),
              ...pays.map((p) => ({ d: p.date, t: `Pago ${p.status.toLowerCase()} por ${money(p.amount)} (${p.id})` })),
              ...db.cancellations.filter((x) => x.clientId === c.id).map((x) => ({ d: x.date, t: `Solicitó cancelar ${x.reservationId}: ${x.status.toLowerCase()}` })),
              { d: c.since, t: 'Se registró en Warehouse Travel' },
            ].sort((a, b) => b.d.localeCompare(a.d)).map((e, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-signal ring-4 ring-white" />
                <p className="text-sm">{e.t}</p>
                <p className="text-xs text-slate-500">{fmtDate(e.d)}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Drawer>
  );
}

/* ---------- Reservations table (agent & admin) ---------- */

export function ReservationsView({ scopeClientIds, onOpenClient }) {
  const { db } = useStore();
  const [status, setStatus] = useState('Todas');
  const [q, setQ] = useState('');
  const rows = useMemo(() => db.reservations
    .filter((r) => !scopeClientIds || scopeClientIds.includes(r.clientId))
    .filter((r) => status === 'Todas' || r.status === status)
    .filter((r) => {
      if (!q) return true;
      const c = db.clients.find((x) => x.id === r.clientId);
      const p = db.packages.find((x) => x.id === r.packageId);
      return `${r.id} ${clientName(c)} ${p?.name} ${p?.destination}`.toLowerCase().includes(q.toLowerCase());
    }), [db, status, q, scopeClientIds]);
  const statuses = ['Todas', 'Reservada', 'Comprada', 'Pagada', 'Cancelación pendiente', 'Cancelada'];
  return (
    <>
      <PageHeader title="Reservas" subtitle="Todas las reservas y su estado actual en tiempo real." />
      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center">
          <Input icon={Search} placeholder="Buscar por código, cliente o destino" value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-xs md:flex-1" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={statuses} className="md:w-56" />
          <p className="text-sm text-slate-500 md:ml-auto tnum">{rows.length} reservas</p>
        </div>
        <DataTable rows={rows} onRowClick={onOpenClient ? (r) => onOpenClient(r.clientId) : undefined} columns={[
          { key: 'id', label: 'Código', render: (r) => <span className="font-semibold">{r.id}</span> },
          { key: 'client', label: 'Cliente', render: (r) => clientName(db.clients.find((c) => c.id === r.clientId)) },
          { key: 'pkg', label: 'Paquete', render: (r) => <span className="text-slate-600">{db.packages.find((p) => p.id === r.packageId)?.name || 'Paquete retirado'}</span> },
          { key: 'date', label: 'Salida', render: (r) => fmtDate(r.date) },
          { key: 'trav', label: 'Viajeros', align: 'right', render: (r) => r.travelers },
          { key: 'total', label: 'Valor', align: 'right', render: (r) => money(r.total) },
          { key: 'status', label: 'Estado', render: (r) => <Badge>{r.status}</Badge> },
        ]} />
      </Card>
    </>
  );
}

/* ---------- Package form (create & edit share this component) ---------- */

const EMPTY = {
  name: '', destination: '', country: 'Colombia', code: '', origin: 'BOG', description: '', image: '',
  days: 5, nights: 4, price: '', oldPrice: '', status: 'Activo', departures: [''],
  transport: { type: 'air', carrier: '', detail: '' },
  lodging: { type: 'Hotel', name: '', stars: 4, nights: 4 },
  car: { category: 'Económico', model: '' },
  insurance: 'Básico',
};

function Section({ n, title, text, children }) {
  return (
    <Card className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[240px_1fr]">
      <div>
        <p className="font-board text-lg font-semibold text-signal tnum">{String(n).padStart(2, '0')}</p>
        <h2 className="text-base font-bold">{title}</h2>
        <p className="mt-1 text-[13px] text-slate-500">{text}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

export function PackageForm({ packageId, onDone }) {
  const { db, actions } = useStore();
  const existing = db.packages.find((p) => p.id === packageId);
  const [f, setF] = useState(() => (existing ? { ...existing, oldPrice: existing.oldPrice || '', car: existing.car || { category: 'Económico', model: '' } } : EMPTY));
  const [withCar, setWithCar] = useState(existing ? !!existing.car : true);
  const [errors, setErrors] = useState({});
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const setIn = (k, sub, v) => setF((x) => ({ ...x, [k]: { ...x[k], [sub]: v } }));

  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if (!f.name.trim()) err.name = 'Escribe el nombre del paquete.';
    if (!f.destination.trim()) err.destination = 'Indica el destino.';
    if (!Number(f.price)) err.price = 'Ingresa un precio por persona mayor a cero.';
    if (!f.departures.filter(Boolean).length) err.departures = 'Agrega al menos una fecha de salida.';
    if (!f.lodging.name.trim()) err.lodging = 'Indica el nombre del alojamiento.';
    setErrors(err);
    if (Object.keys(err).length) return;
    const pkg = {
      ...f,
      code: (f.code || f.destination.slice(0, 3)).toUpperCase(),
      price: Number(f.price), oldPrice: Number(f.oldPrice) > Number(f.price) ? Number(f.oldPrice) : null,
      days: Number(f.days), nights: Number(f.nights),
      lodging: { ...f.lodging, nights: Number(f.nights), stars: Number(f.lodging.stars) },
      car: withCar ? f.car : null,
      departures: f.departures.filter(Boolean).sort(),
      rating: f.rating || 5, reviews: f.reviews || 0,
    };
    actions.savePackage(pkg);
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <PageHeader title={existing ? `Editar ${existing.name}` : 'Crear paquete'} subtitle={existing ? 'Los cambios se reflejan de inmediato en el catálogo de clientes.' : 'Un paquete siempre incluye transporte, alojamiento y seguro. El auto es opcional.'}
        actions={<><Button type="button" variant="secondary" onClick={onDone}>Cancelar</Button><Button type="submit">{existing ? 'Guardar cambios' : 'Publicar paquete'}</Button></>} />
      <Section n={1} title="Información general" text="Lo primero que ve el viajero en la tarjeta del catálogo.">
        <Input label="Nombre" value={f.name} onChange={(e) => set('name', e.target.value)} error={errors.name} placeholder="Ej. Cartagena amurallada" className="sm:col-span-2" />
        <Input label="Destino" value={f.destination} onChange={(e) => set('destination', e.target.value)} error={errors.destination} placeholder="Ciudad" />
        <Input label="País" value={f.country} onChange={(e) => set('country', e.target.value)} />
        <Input label="Código de aeropuerto" value={f.code} maxLength={3} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="CTG" hint="Se muestra en la ruta de la tarjeta." />
        <Input label="Origen" value={f.origin} maxLength={3} onChange={(e) => set('origin', e.target.value.toUpperCase())} />
        <Textarea label="Descripción" value={f.description} onChange={(e) => set('description', e.target.value)} className="sm:col-span-2" placeholder="Qué hace especial este viaje, en una o dos frases." />
        <Input label="URL de la imagen" icon={ImageIcon} value={f.image} onChange={(e) => set('image', e.target.value)} className="sm:col-span-2" placeholder="https://…" hint="Si la dejas vacía, mostramos el código del destino." />
      </Section>
      <Section n={2} title="Fechas y precio" text="Precio por persona. Si agregas un precio anterior, el paquete aparece en Ofertas.">
        <Input label="Días" type="number" min="1" value={f.days} onChange={(e) => set('days', e.target.value)} />
        <Input label="Noches" type="number" min="0" value={f.nights} onChange={(e) => set('nights', e.target.value)} />
        <Input label="Precio por persona (COP)" type="number" min="0" value={f.price} onChange={(e) => set('price', e.target.value)} error={errors.price} placeholder="4890000" />
        <Input label="Precio anterior (opcional)" type="number" min="0" value={f.oldPrice} onChange={(e) => set('oldPrice', e.target.value)} placeholder="5590000" />
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-[13px] font-medium text-slate-700">Fechas de salida</p>
          <div className="flex flex-wrap gap-2">
            {f.departures.map((d, i) => (
              <input key={i} type="date" value={d} onChange={(e) => set('departures', f.departures.map((x, j) => (j === i ? e.target.value : x)))}
                className="h-11 rounded-xl border border-line px-3 text-sm focus:border-signal focus:outline-none focus:ring-4 focus:ring-signal/10" aria-label={`Salida ${i + 1}`} />
            ))}
            <Button type="button" variant="secondary" onClick={() => set('departures', [...f.departures, ''])}>Agregar fecha</Button>
          </div>
          {errors.departures && <p className="mt-1 text-xs text-rose-600">{errors.departures}</p>}
        </div>
        <Select label="Estado" value={f.status === 'Pendiente de eliminación' ? 'Activo' : f.status} onChange={(e) => set('status', e.target.value)} options={['Activo', 'Inactivo']} />
      </Section>
      <Section n={3} title="Transporte" text="Cómo llega el viajero al destino.">
        <Select label="Tipo" value={f.transport.type} onChange={(e) => setIn('transport', 'type', e.target.value)} options={Object.entries(TRANSPORT).map(([value, label]) => ({ value, label }))} />
        <Input label="Operador" value={f.transport.carrier} onChange={(e) => setIn('transport', 'carrier', e.target.value)} placeholder="Avianca" />
        <Input label="Detalle del trayecto" value={f.transport.detail} onChange={(e) => setIn('transport', 'detail', e.target.value)} className="sm:col-span-2" placeholder="Vuelo directo BOG → CTG, equipaje incluido" />
      </Section>
      <Section n={4} title="Alojamiento" text="Hotel u hostal incluido durante todas las noches.">
        <Select label="Tipo" value={f.lodging.type} onChange={(e) => setIn('lodging', 'type', e.target.value)} options={['Hotel', 'Hostal']} />
        <Select label="Categoría" value={String(f.lodging.stars)} onChange={(e) => setIn('lodging', 'stars', e.target.value)} options={['2', '3', '4', '5'].map((s) => ({ value: s, label: `${s} estrellas` }))} />
        <Input label="Nombre del alojamiento" value={f.lodging.name} onChange={(e) => setIn('lodging', 'name', e.target.value)} error={errors.lodging} className="sm:col-span-2" />
      </Section>
      <Section n={5} title="Seguro y auto" text="El seguro es obligatorio. La renta de auto se puede omitir.">
        <Select label="Seguro de viaje" value={f.insurance} onChange={(e) => set('insurance', e.target.value)} options={Object.keys(INSURANCE)} hint={INSURANCE[f.insurance]} className="sm:col-span-2" />
        <div className="rounded-xl border border-line p-4 sm:col-span-2"><Toggle checked={withCar} onChange={setWithCar} label="Incluir renta de auto" description="Se entrega en el aeropuerto o terminal de llegada." /></div>
        {withCar && <>
          <Select label="Categoría del auto" value={f.car.category} onChange={(e) => setIn('car', 'category', e.target.value)} options={['Económico', 'SUV', 'Premium']} />
          <Input label="Modelo" value={f.car.model} onChange={(e) => setIn('car', 'model', e.target.value)} placeholder="Kia Picanto o similar" />
        </>}
      </Section>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>Cancelar</Button>
        <Button type="submit" size="lg">{existing ? 'Guardar cambios' : 'Publicar paquete'}</Button>
      </div>
    </form>
  );
}

export function ServicesDetail({ pkg }) {
  const items = [
    { icon: TRANSPORT_ICON[pkg.transport.type] || Plane, title: 'Transporte', main: `${TRANSPORT[pkg.transport.type]} con ${pkg.transport.carrier}`, sub: pkg.transport.detail },
    { icon: Hotel, title: 'Alojamiento', main: pkg.lodging.name, sub: `${pkg.lodging.type} de ${pkg.lodging.stars} estrellas, ${pkg.lodging.nights} ${pkg.lodging.nights === 1 ? 'noche' : 'noches'}` },
    { icon: Car, title: 'Vehículo', main: pkg.car ? pkg.car.model : 'No incluido', sub: pkg.car ? `Categoría ${pkg.car.category.toLowerCase()}, kilometraje ilimitado` : 'Traslados aeropuerto–hotel incluidos' },
    { icon: ShieldCheck, title: 'Seguro', main: `Seguro ${pkg.insurance}`, sub: INSURANCE[pkg.insurance] },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(({ icon: I, title, main, sub }) => (
        <div key={title} className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500"><I className="h-4 w-4 text-signal" />{title}</div>
          <p className="mt-2 font-semibold text-ink">{main}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{sub}</p>
        </div>
      ))}
    </div>
  );
}

export function Note({ children, tone = 'blue' }) {
  const t = { blue: 'bg-signal-50 text-signal-700', amber: 'bg-amber-50 text-amber-800', green: 'bg-emerald-50 text-emerald-800', red: 'bg-rose-50 text-rose-700' }[tone];
  return <div className={cx('flex items-start gap-2.5 rounded-xl px-4 py-3 text-[13px]', t)}><Info className="mt-0.5 h-4 w-4 shrink-0" /><div>{children}</div></div>;
}
