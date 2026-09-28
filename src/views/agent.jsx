import React, { useMemo, useState } from 'react';
import {
  Users, CalendarCheck, Wallet, CircleSlash, Plus, Search, Pencil, Trash2, ShieldAlert, CalendarPlus, CreditCard,
  CircleSlash2, UserPlus, Package as PackageIcon, Building2, Lock, Check, FileText, ArrowLeft, Power, CheckCircle2, XCircle, Send,
} from 'lucide-react';
import { useStore, BackofficeShell, AGENT_NAV } from '../App.jsx';
import { money, moneyShort, fmtDate, CORPORATE_DISCOUNT, invoiceTotals, TAX_RATE, TODAY } from '../data.js';
import {
  cx, Button, Badge, Card, StatCard, PageHeader, DataTable, Input, Select, Segmented, Img, ServiceIcons, Modal, ConfirmDialog,
  EmptyState, Toggle, Avatar,
} from '../ui.jsx';
import { ClientDrawer, ReservationsView, PackageForm, InvoiceView, clientName, Note } from './shared.jsx';

export default function AgentApp() {
  const { nav, go, currentAgent } = useStore();
  const [drawer, setDrawer] = useState(null);
  const openInvoice = (id) => { setDrawer(null); go('invoice', { invoiceId: id, back: nav.name }); };
  const views = {
    dashboard: <AgentDashboard openClient={setDrawer} />,
    clients: <ClientsCRM openClient={setDrawer} scoped />,
    reservations: <ReservationsView onOpenClient={setDrawer} />,
    cancellations: <Cancellations />,
    packages: <PackagesManager mode="agent" />,
    'package-form': <PackageForm packageId={nav.id} onDone={() => go('packages')} />,
    billing: <Billing />,
    payments: <Payments />,
    invoice: <InvoiceView invoiceId={nav.invoiceId} onBack={() => go(nav.back || 'payments')} />,
  };
  return (
    <BackofficeShell items={AGENT_NAV} person={currentAgent.name} subtitle="Agente de viajes">
      <div key={nav.name} className="animate-fade">{views[nav.name] || views.dashboard}</div>
      {drawer && <ClientDrawer clientId={drawer} onClose={() => setDrawer(null)} onOpenInvoice={openInvoice} />}
    </BackofficeShell>
  );
}

/* ---------- Dashboard ---------- */

const EVENT_ICON = { reserva: CalendarPlus, pago: CreditCard, cancelacion: CircleSlash2, cliente: UserPlus, paquete: PackageIcon };
const EVENT_TONE = { reserva: 'bg-signal-50 text-signal', pago: 'bg-emerald-50 text-emerald-600', cancelacion: 'bg-amber-50 text-amber-600', cliente: 'bg-violet-50 text-violet-600', paquete: 'bg-slate-100 text-slate-600' };

export function ActivityTimeline({ items }) {
  return (
    <ol className="space-y-1">
      {items.map((e) => {
        const I = EVENT_ICON[e.type] || PackageIcon;
        return (
          <li key={e.id} className="flex gap-3 rounded-xl p-2.5 hover:bg-mist">
            <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', EVENT_TONE[e.type])}><I className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="text-sm text-ink">{e.text}</p>
              <p className="text-xs text-slate-500">{e.time}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function AgentDashboard({ openClient }) {
  const { db, go, currentAgent } = useStore();
  const myClients = db.clients.filter((c) => c.agentId === currentAgent.id);
  const ids = myClients.map((c) => c.id);
  const myRes = db.reservations.filter((r) => ids.includes(r.clientId));
  const sales = db.payments.filter((p) => ids.includes(p.clientId) && p.status === 'Aprobado').reduce((s, p) => s + p.amount, 0);
  const pendingCan = db.cancellations.filter((c) => c.status === 'Pendiente');
  const toBuy = myRes.filter((r) => r.status === 'Reservada');
  const pendingPay = db.payments.filter((p) => p.status === 'Pendiente');
  const departures = db.reservations.filter((r) => r.date >= TODAY && r.status === 'Pagada').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  return (
    <>
      <PageHeader title={`Buenos días, ${currentAgent.name.split(' ')[0]}`} subtitle="Aquí tienes el resumen de tu operación."
        actions={<><Button variant="secondary" onClick={() => go('billing')}>Facturar</Button><Button icon={Plus} onClick={() => go('package-form')}>Crear paquete</Button></>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Clientes" value={myClients.length} icon={Users} note={`${myClients.filter((c) => c.status === 'Activo').length} activos`} />
        <StatCard label="Reservas" value={myRes.length} icon={CalendarCheck} delta="+3" note="esta semana" />
        <StatCard label="Ventas" value={moneyShort(sales)} icon={Wallet} delta="+12%" note="vs. agosto" />
        <StatCard label="Cancelaciones" value={pendingCan.length} icon={CircleSlash} note="por revisar" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="p-5">
          <h2 className="mb-3 font-bold">Requiere tu atención</h2>
          <ul className="divide-y divide-line">
            {pendingCan.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <Badge>Cancelación pendiente</Badge>
                <p className="min-w-0 flex-1 truncate text-sm">{clientName(db.clients.find((x) => x.id === c.clientId))}, {c.reservationId}</p>
                <Button size="sm" variant="secondary" onClick={() => go('cancellations')}>Revisar</Button>
              </li>
            ))}
            {toBuy.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <Badge>Reservada</Badge>
                <p className="min-w-0 flex-1 truncate text-sm">{clientName(db.clients.find((x) => x.id === r.clientId))}, {db.packages.find((p) => p.id === r.packageId)?.name}</p>
                <Button size="sm" variant="secondary" onClick={() => go('billing', { clientId: r.clientId })}>Facturar</Button>
              </li>
            ))}
            {pendingPay.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <Badge>Pendiente</Badge>
                <p className="min-w-0 flex-1 truncate text-sm">Pago {p.id} por {money(p.amount)}</p>
                <Button size="sm" variant="secondary" onClick={() => go('payments')}>Ver pago</Button>
              </li>
            ))}
            {!pendingCan.length && !toBuy.length && !pendingPay.length && <EmptyState icon={CheckCircle2} title="Todo al día" text="No tienes pendientes por ahora." />}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="mb-2 font-bold">Actividad reciente</h2>
          <ActivityTimeline items={db.activity.slice(0, 6)} />
        </Card>
      </div>
      <Card className="mt-6 p-5">
        <h2 className="mb-3 font-bold">Próximas salidas</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {departures.map((r) => {
            const p = db.packages.find((x) => x.id === r.packageId);
            const c = db.clients.find((x) => x.id === r.clientId);
            return (
              <button key={r.id} onClick={() => openClient(c.id)} className="flex items-center gap-3 rounded-xl border border-line p-3 text-left hover:bg-mist">
                <Img src={p?.image} code={p?.code} alt={p?.destination} className="h-12 w-12 shrink-0 rounded-lg" />
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{clientName(c)}</p><p className="truncate text-xs text-slate-500">{p?.destination}, {fmtDate(r.date)}</p></div>
              </button>
            );
          })}
        </div>
      </Card>
    </>
  );
}

/* ---------- Clients CRM ---------- */

export function ClientsCRM({ openClient, scoped, admin }) {
  const { db, currentAgent } = useStore();
  const [scope, setScope] = useState(scoped ? 'mine' : 'all');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('Todos');
  const stats = (c) => {
    const res = db.reservations.filter((r) => r.clientId === c.id);
    const value = db.payments.filter((p) => p.clientId === c.id && p.status === 'Aprobado').reduce((s, p) => s + p.amount, 0);
    return { res: res.length, value };
  };
  const rows = useMemo(() => db.clients
    .filter((c) => scope === 'all' || c.agentId === currentAgent.id)
    .filter((c) => filter === 'Todos' || (filter === 'Corporativo' ? c.nit : filter === 'Persona' ? !c.nit : c.status === filter))
    .filter((c) => !q || `${clientName(c)} ${c.email} ${c.company || ''}`.toLowerCase().includes(q.toLowerCase()))
    .map((c) => ({ ...c, ...stats(c) })), [db, scope, q, filter]);
  const all = db.clients;
  return (
    <>
      <PageHeader title="Clientes" subtitle={admin ? 'Base de clientes de toda la agencia.' : 'Tu cartera de clientes y su actividad.'} />
      {admin && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Clientes" value={all.length} icon={Users} />
          <StatCard label="Activos" value={all.filter((c) => c.status === 'Activo').length} icon={CheckCircle2} note={`${Math.round((all.filter((c) => c.status === 'Activo').length / all.length) * 100)}% del total`} />
          <StatCard label="Corporativos" value={all.filter((c) => c.nit).length} icon={Building2} />
          <StatCard label="Valor promedio" value={moneyShort(db.payments.filter((p) => p.status === 'Aprobado').reduce((s, p) => s + p.amount, 0) / all.length)} icon={Wallet} note="por cliente" />
        </div>
      )}
      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <Input icon={Search} placeholder="Buscar cliente, email o empresa" value={q} onChange={(e) => setQ(e.target.value)} className="lg:max-w-xs lg:flex-1" />
          <div className="overflow-x-auto no-scrollbar"><Segmented value={filter} onChange={setFilter} options={['Todos', 'Activo', 'Inactivo', 'Corporativo', 'Persona'].map((v) => ({ value: v, label: v }))} /></div>
          {scoped && <Select value={scope} onChange={(e) => setScope(e.target.value)} options={[{ value: 'mine', label: 'Mis clientes' }, { value: 'all', label: 'Todos los clientes' }]} className="lg:ml-auto lg:w-48" />}
        </div>
        <DataTable rows={rows} onRowClick={(c) => openClient(c.id)}
          mobile={(c) => (
            <div className="flex items-center gap-3">
              <Avatar name={clientName(c)} size="sm" />
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{clientName(c)}</p><p className="truncate text-xs text-slate-500">{c.company || c.email}</p></div>
              <div className="text-right"><p className="text-sm font-semibold tnum">{moneyShort(c.value)}</p><Badge>{c.status}</Badge></div>
            </div>
          )}
          columns={[
            { key: 'name', label: 'Cliente', render: (c) => <div className="flex items-center gap-3"><Avatar name={clientName(c)} size="sm" /><span className="font-semibold">{clientName(c)}</span></div> },
            { key: 'company', label: 'Empresa', render: (c) => c.company ? <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-violet-500" />{c.company}</span> : <span className="text-slate-400">Persona</span> },
            { key: 'email', label: 'Email', render: (c) => <span className="text-slate-600">{c.email}</span> },
            ...(admin ? [{ key: 'agent', label: 'Agente', render: (c) => db.agents.find((a) => a.id === c.agentId)?.name }] : []),
            { key: 'res', label: 'Reservas', align: 'right' },
            { key: 'last', label: 'Última actividad', render: (c) => fmtDate(c.lastActivity) },
            { key: 'value', label: 'Valor generado', align: 'right', render: (c) => money(c.value) },
            { key: 'status', label: 'Estado', render: (c) => <Badge>{c.status}</Badge> },
            { key: 'act', label: 'Acciones', render: (c) => <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openClient(c.id); }}>Ver perfil</Button> },
          ]} />
      </Card>
    </>
  );
}

/* ---------- Cancellations inbox ---------- */

function Cancellations() {
  const { db, actions } = useStore();
  const [tab, setTab] = useState('Pendiente');
  const [confirm, setConfirm] = useState(null);
  const list = db.cancellations.filter((c) => (tab === 'Pendiente' ? c.status === 'Pendiente' : c.status !== 'Pendiente'));
  return (
    <>
      <PageHeader title="Cancelaciones" subtitle="Solicitudes de clientes. Al aprobar, el cliente verá su viaje como cancelado." />
      <Segmented value={tab} onChange={setTab} options={[
        { value: 'Pendiente', label: 'Por revisar', count: db.cancellations.filter((c) => c.status === 'Pendiente').length },
        { value: 'Resueltas', label: 'Resueltas', count: db.cancellations.filter((c) => c.status !== 'Pendiente').length },
      ]} />
      <div className="mt-4 space-y-3">
        {list.length ? list.map((c) => {
          const r = db.reservations.find((x) => x.id === c.reservationId);
          const p = r && db.packages.find((x) => x.id === r.packageId);
          const cl = db.clients.find((x) => x.id === c.clientId);
          return (
            <Card key={c.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
              <Img src={p?.image} code={p?.code} alt={p?.destination} className="h-16 w-16 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{clientName(cl)}</p><Badge>{c.status}</Badge></div>
                <p className="text-sm text-slate-600">{p?.name}, {c.reservationId}, sale el {r ? fmtDate(r.date) : '—'}</p>
                <p className="mt-2 rounded-lg bg-mist px-3 py-2 text-sm text-slate-700">“{c.reason}”</p>
              </div>
              <div className="flex shrink-0 items-center justify-between gap-6 md:flex-col md:items-end">
                <div className="md:text-right"><p className="text-lg font-bold tnum">{money(r?.total)}</p><p className="text-xs text-slate-500">Solicitada el {fmtDate(c.date)}</p></div>
                {c.status === 'Pendiente' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setConfirm({ c, approve: false })}>Rechazar</Button>
                    <Button size="sm" variant="success" onClick={() => setConfirm({ c, approve: true })}>Aprobar</Button>
                  </div>
                )}
              </div>
            </Card>
          );
        }) : <Card><EmptyState icon={CheckCircle2} title="Bandeja limpia" text="No hay solicitudes por revisar." /></Card>}
      </div>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)}
        tone={confirm?.approve ? 'danger' : 'warning'} icon={confirm?.approve ? CircleSlash : XCircle}
        title={confirm?.approve ? 'Aprobar cancelación' : 'Rechazar solicitud'}
        text={confirm?.approve ? `La reserva ${confirm?.c.reservationId} quedará cancelada y se iniciará el reembolso.` : 'La reserva vuelve a su estado anterior y el cliente recibirá una notificación.'}
        confirmLabel={confirm?.approve ? 'Aprobar cancelación' : 'Rechazar solicitud'}
        onConfirm={() => { actions.resolveCancellation(confirm.c.id, confirm.approve); setConfirm(null); }} />
    </>
  );
}

/* ---------- Packages manager (agent & admin) ---------- */

export function PackagesManager({ mode }) {
  const { db, go, actions } = useStore();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('Todos');
  const [delReq, setDelReq] = useState(null);
  const [sent, setSent] = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);
  const admin = mode === 'admin';
  const pendingDel = db.packages.filter((p) => p.status === 'Pendiente de eliminación');
  const rows = db.packages
    .filter((p) => status === 'Todos' || p.status === status)
    .filter((p) => !q || `${p.name} ${p.destination}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title={admin ? 'Catálogo' : 'Paquetes'} subtitle={admin ? 'Control completo del catálogo publicado.' : 'Crea y edita paquetes. Eliminar requiere aprobación del administrador.'}
        actions={<Button icon={Plus} onClick={() => go('package-form')}>Crear paquete</Button>} />
      {admin && pendingDel.length > 0 && (
        <Card className="mb-4 border-amber-200 bg-amber-50/60 p-5">
          <p className="flex items-center gap-2 font-semibold text-amber-900"><ShieldAlert className="h-4 w-4" />Solicitudes de eliminación</p>
          <ul className="mt-3 space-y-2">
            {pendingDel.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 rounded-xl bg-white p-3 sm:flex-row sm:items-center">
                <p className="flex-1 text-sm"><b>{p.name}</b> <span className="text-slate-500">solicitado por Carlos Rincón</span></p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => actions.resolveDeletion(p.id, false)}>Rechazar</Button>
                  <Button size="sm" variant="danger" onClick={() => actions.resolveDeletion(p.id, true)}>Aprobar eliminación</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center">
          <Input icon={Search} placeholder="Buscar paquete o destino" value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-xs md:flex-1" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={['Todos', 'Activo', 'Inactivo', 'Pendiente de eliminación']} className="md:w-60" />
          <p className="text-sm text-slate-500 md:ml-auto tnum">{rows.length} paquetes</p>
        </div>
        <DataTable rows={rows}
          mobile={(p) => (
            <div className="flex gap-3">
              <Img src={p.image} code={p.code} alt={p.destination} className="h-16 w-16 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-slate-500">{p.destination}, {money(p.price)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2"><Badge>{p.status}</Badge></div>
                <div className="mt-2 flex gap-1.5"><RowActions p={p} admin={admin} go={go} actions={actions} setDelReq={setDelReq} setDelConfirm={setDelConfirm} setSent={setSent} /></div>
              </div>
            </div>
          )}
          columns={[
            { key: 'img', label: 'Paquete', render: (p) => <div className="flex items-center gap-3"><Img src={p.image} code={p.code} alt={p.destination} className="h-11 w-14 min-w-[3.5rem] shrink-0 rounded-lg" /><span className="min-w-[160px] font-semibold">{p.name}</span></div>, wrap: true },
            { key: 'destination', label: 'Destino' },
            { key: 'svc', label: 'Servicios', render: (p) => <ServiceIcons pkg={p} compact /> },
            { key: 'price', label: 'Precio', align: 'right', render: (p) => money(p.price) },
            { key: 'sales', label: 'Ventas', align: 'right' },
            { key: 'status', label: 'Estado', render: (p) => <Badge>{p.status}</Badge> },
            { key: 'act', label: 'Acciones', render: (p) => <div className="flex gap-1"><RowActions p={p} admin={admin} go={go} actions={actions} setDelReq={setDelReq} setDelConfirm={setDelConfirm} setSent={setSent} /></div> },
          ]} />
      </Card>

      <Modal open={!!delReq} onClose={() => setDelReq(null)} title="" size="sm"
        footer={sent ? <Button onClick={() => setDelReq(null)}>Entendido</Button> : <><Button variant="secondary" onClick={() => setDelReq(null)}>Cancelar</Button><Button icon={Send} onClick={() => { actions.requestPackageDeletion(delReq.id); setSent(true); }}>Enviar solicitud</Button></>}>
        <div className="-mt-6 flex flex-col items-center text-center">
          <span className={cx('grid h-12 w-12 place-items-center rounded-2xl', sent ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>{sent ? <Check className="h-5 w-5" /> : <Lock className="h-5 w-5" />}</span>
          <h3 className="mt-4 text-lg font-bold">{sent ? 'Solicitud enviada' : 'Se requiere autorización'}</h3>
          <p className="mt-1.5 text-sm text-slate-500">{sent ? `El administrador revisará la eliminación de ${delReq?.name}. Mientras tanto queda como pendiente de eliminación.` : 'Este paquete requiere aprobación del administrador para ser eliminado.'}</p>
        </div>
      </Modal>
      <ConfirmDialog open={!!delConfirm} onClose={() => setDelConfirm(null)} title={`Eliminar ${delConfirm?.name}`}
        text="El paquete desaparece del catálogo. Las reservas existentes se conservan." confirmLabel="Eliminar paquete" icon={Trash2}
        onConfirm={() => { actions.deletePackage(delConfirm.id); setDelConfirm(null); }} />
    </>
  );
}

function RowActions({ p, admin, go, actions, setDelReq, setDelConfirm, setSent }) {
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
  return (
    <>
      {/* Admin rows carry three actions, so edit and delete collapse to labelled icons. */}
      <Button size="sm" variant="ghost" icon={Pencil} onClick={stop(() => go('package-form', { id: p.id }))} aria-label="Editar" title="Editar">{!admin && 'Editar'}</Button>
      {admin && p.status !== 'Pendiente de eliminación' && (
        <Button size="sm" variant="ghost" icon={Power} onClick={stop(() => actions.togglePackage(p.id))}>{p.status === 'Activo' ? 'Desactivar' : 'Activar'}</Button>
      )}
      {admin ? (
        <Button size="sm" variant="danger-soft" icon={Trash2} onClick={stop(() => setDelConfirm(p))} aria-label="Eliminar" title="Eliminar" />
      ) : p.status === 'Pendiente de eliminación' ? (
        <span className="px-2 text-xs text-amber-700">Solicitud enviada</span>
      ) : (
        <Button size="sm" variant="danger-soft" icon={Trash2} onClick={stop(() => { setSent(false); setDelReq(p); })}>Eliminar</Button>
      )}
    </>
  );
}

/* ---------- Billing ---------- */

function Billing() {
  const { db, nav, actions, go } = useStore();
  const [clientId, setClientId] = useState(nav.clientId || '');
  const [selected, setSelected] = useState([]);
  const [corporate, setCorporate] = useState(false);
  const [method, setMethod] = useState('Transferencia');
  const client = db.clients.find((c) => c.id === clientId);
  const billable = db.reservations.filter((r) => r.clientId === clientId && r.status === 'Reservada');
  const items = selected.map((rid) => {
    const r = db.reservations.find((x) => x.id === rid);
    const p = db.packages.find((x) => x.id === r.packageId);
    return { reservationId: rid, name: p.name, travelers: r.travelers, amount: p.price * r.travelers };
  });
  const t = invoiceTotals(items, corporate ? CORPORATE_DISCOUNT : 0);
  const pick = (id) => { setClientId(id); setSelected([]); setCorporate(false); };
  const toggle = (rid) => setSelected((s) => (s.includes(rid) ? s.filter((x) => x !== rid) : [...s, rid]));
  const generate = () => {
    const id = actions.createInvoice({ clientId, reservationIds: selected, corporate, method });
    go('invoice', { invoiceId: id, back: 'billing' });
  };
  const withBillable = db.clients.filter((c) => db.reservations.some((r) => r.clientId === c.id && r.status === 'Reservada'));

  return (
    <>
      <PageHeader title="Facturación" subtitle="Factura paquetes completos a un cliente. Los servicios no se facturan por separado." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card className="p-5">
            <Select label="Cliente" value={clientId} onChange={(e) => pick(e.target.value)}
              options={[{ value: '', label: 'Selecciona un cliente' }, ...db.clients.map((c) => ({ value: c.id, label: `${clientName(c)}${c.company ? ` (${c.company})` : ''}` }))]} />
            {!clientId && withBillable.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">Con paquetes por facturar:
                {withBillable.map((c) => <button key={c.id} onClick={() => pick(c.id)} className="rounded-full bg-mist px-2.5 py-1 font-semibold text-ink hover:bg-slate-200">{clientName(c)}</button>)}
              </div>
            )}
          </Card>
          {client?.nit && (
            <Card className="border-violet-200 bg-violet-50/50 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700"><Building2 className="h-5 w-5" /></span>
                <div><p className="font-semibold">Cliente corporativo</p><p className="text-[13px] text-slate-600">{client.company}, NIT {client.nit}</p></div>
              </div>
              <Toggle checked={corporate} onChange={setCorporate} label="Aplicar descuento corporativo" description={`${CORPORATE_DISCOUNT * 100}% sobre el subtotal de los paquetes seleccionados.`} />
            </Card>
          )}
          {clientId && (
            <Card className="p-5">
              <h2 className="font-bold">Paquetes disponibles para facturar</h2>
              <p className="mb-4 text-[13px] text-slate-500">Cada paquete se selecciona completo, con todos sus servicios.</p>
              {billable.length ? (
                <div className="space-y-3">
                  {billable.map((r) => {
                    const p = db.packages.find((x) => x.id === r.packageId);
                    const on = selected.includes(r.id);
                    return (
                      <button key={r.id} onClick={() => toggle(r.id)} aria-pressed={on}
                        className={cx('flex w-full flex-col gap-3 rounded-2xl border p-4 text-left transition-colors sm:flex-row sm:items-center', on ? 'border-signal bg-signal-50/60 ring-4 ring-signal/10' : 'border-line hover:border-slate-300')}>
                        <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-md border-2', on ? 'border-signal bg-signal text-white' : 'border-slate-300')}>{on && <Check className="h-4 w-4" />}</span>
                        <Img src={p.image} code={p.code} alt={p.destination} className="h-14 w-14 shrink-0 rounded-xl" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{p.name}</p>
                          <p className="text-[13px] text-slate-500">{r.id}, {r.travelers} viajeros, sale el {fmtDate(r.date)}</p>
                          <div className="mt-2 flex items-center gap-2"><ServiceIcons pkg={p} /><Lock className="h-3.5 w-3.5 text-slate-400" aria-label="Servicios incluidos, no separables" /></div>
                        </div>
                        <p className="font-bold tnum sm:text-right">{money(p.price * r.travelers)}</p>
                      </button>
                    );
                  })}
                </div>
              ) : <EmptyState icon={FileText} title="Nada por facturar" text="Este cliente no tiene reservas pendientes de facturación." />}
            </Card>
          )}
        </div>
        <aside className="xl:sticky xl:top-[120px] xl:self-start">
          <Card className="p-5">
            <h2 className="font-bold">Resumen de factura</h2>
            {items.length ? (
              <>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {items.map((i) => <li key={i.reservationId} className="flex justify-between gap-3"><span className="text-slate-600">{i.name}</span><span className="font-medium tnum">{money(i.amount)}</span></li>)}
                </ul>
                <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                  <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="tnum">{money(t.subtotal)}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Descuento{corporate ? ' corporativo' : ''}</dt><dd className="tnum text-emerald-600">-{money(t.discount)}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Impuestos ({TAX_RATE * 100}%)</dt><dd className="tnum">{money(t.taxes)}</dd></div>
                  <div className="flex items-baseline justify-between border-t border-line pt-3"><dt className="font-semibold">Total</dt><dd key={t.total} className="animate-rise text-2xl font-extrabold tracking-tight tnum">{money(t.total)}</dd></div>
                </dl>
                <Select label="Método de pago" value={method} onChange={(e) => setMethod(e.target.value)} options={['Transferencia', 'Tarjeta', 'PSE', 'PayPal']} className="mt-4" />
                <Button size="lg" className="mt-4 w-full" onClick={generate}>Generar factura</Button>
              </>
            ) : <p className="mt-3 text-sm text-slate-500">Selecciona un cliente y al menos un paquete.</p>}
          </Card>
        </aside>
      </div>
    </>
  );
}

/* ---------- Payments ---------- */

function Payments() {
  const { db, actions, go } = useStore();
  const [status, setStatus] = useState('Todos');
  const [method, setMethod] = useState('Todos');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const rows = db.payments
    .filter((p) => status === 'Todos' || p.status === status)
    .filter((p) => method === 'Todos' || p.method === method)
    .filter((p) => (!from || p.date >= from) && (!to || p.date <= to));
  const approved = rows.filter((p) => p.status === 'Aprobado').reduce((s, p) => s + p.amount, 0);
  return (
    <>
      <PageHeader title="Pagos" subtitle="Transacciones de clientes y su estado de conciliación." />
      <Card>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,200px))_1fr] lg:items-end">
          <Select label="Estado" value={status} onChange={(e) => setStatus(e.target.value)} options={['Todos', 'Pendiente', 'Aprobado', 'Rechazado']} />
          <Select label="Método" value={method} onChange={(e) => setMethod(e.target.value)} options={['Todos', 'Tarjeta', 'PSE', 'Transferencia', 'PayPal']} />
          <Input label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <p className="text-sm text-slate-500 lg:text-right">Aprobado: <span className="font-semibold text-ink tnum">{money(approved)}</span></p>
        </div>
        <DataTable rows={rows} onRowClick={(p) => go('invoice', { invoiceId: p.invoiceId, back: 'payments' })} columns={[
          { key: 'id', label: 'Transacción', render: (p) => <span className="font-semibold">{p.id}</span> },
          { key: 'client', label: 'Cliente', render: (p) => clientName(db.clients.find((c) => c.id === p.clientId)) },
          { key: 'invoiceId', label: 'Factura' },
          { key: 'method', label: 'Método' },
          { key: 'date', label: 'Fecha', render: (p) => fmtDate(p.date) },
          { key: 'amount', label: 'Valor', align: 'right', render: (p) => money(p.amount) },
          { key: 'status', label: 'Estado', render: (p) => <Badge>{p.status}</Badge> },
          { key: 'act', label: '', render: (p) => p.status === 'Pendiente' ? (
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); actions.setPaymentStatus(p.id, 'Rechazado'); }}>Rechazar</Button>
              <Button size="sm" variant="success" onClick={(e) => { e.stopPropagation(); actions.setPaymentStatus(p.id, 'Aprobado'); }}>Aprobar</Button>
            </div>
          ) : null },
        ]} />
      </Card>
    </>
  );
}
