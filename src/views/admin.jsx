import React, { useMemo, useState } from 'react';
import {
  Wallet, CalendarCheck, Users, UserCog, Package as PackageIcon, Download, ShieldAlert, TrendingUp, BarChart3, Trophy,
  PieChart, ArrowLeftRight, UserPlus, Table2, LineChart as LineIcon,
} from 'lucide-react';
import { useStore, BackofficeShell, ADMIN_NAV } from '../App.jsx';
import { money, moneyShort, fmtDate, monthly, serviceRevenue, BUSINESS } from '../data.js';
import {
  cx, Button, Badge, Card, StatCard, PageHeader, DataTable, Select, Input, Segmented, LineChart, BarChart, HBarList, Avatar,
  EmptyState, Drawer,
} from '../ui.jsx';
import { ClientDrawer, ReservationsView, PackageForm, InvoiceView, clientName } from './shared.jsx';
import { ClientsCRM, PackagesManager } from './agent.jsx';

export default function AdminApp() {
  const { nav, go } = useStore();
  const [drawer, setDrawer] = useState(null);
  const views = {
    dashboard: <AdminDashboard />,
    analytics: <Analytics />,
    packages: <PackagesManager mode="admin" />,
    'package-form': <PackageForm packageId={nav.id} onDone={() => go('packages')} />,
    clients: <ClientsCRM openClient={setDrawer} admin />,
    agents: <Agents />,
    reservations: <ReservationsView onOpenClient={setDrawer} />,
    reports: <Reports />,
    invoice: <InvoiceView invoiceId={nav.invoiceId} onBack={() => go(nav.back || 'clients')} />,
  };
  return (
    <BackofficeShell items={ADMIN_NAV} person="Mariana Villegas" subtitle="Administradora">
      <div key={nav.name} className="animate-fade">{views[nav.name] || views.dashboard}</div>
      {drawer && <ClientDrawer clientId={drawer} onClose={() => setDrawer(null)} onOpenInvoice={(id) => { setDrawer(null); go('invoice', { invoiceId: id, back: nav.name }); }} />}
    </BackofficeShell>
  );
}

// Session activity adds to the historical business totals so the admin sees live changes.
function useLiveBusiness() {
  const { db } = useStore();
  const newPayments = db.payments.filter((p) => p.date === '2026-09-28' && p.status === 'Aprobado');
  const newRes = db.reservations.filter((r) => r.createdAt === '2026-09-28' && !['RES-8806', 'RES-8807'].includes(r.id));
  const newClients = db.clients.filter((c) => c.since === '2026-09-28');
  return {
    sales: BUSINESS.sales + newPayments.reduce((s, p) => s + p.amount, 0),
    reservations: BUSINESS.reservations + newRes.length,
    clients: BUSINESS.clients + newClients.length,
    agents: BUSINESS.agents,
    // 11 of the mock packages start active; the rest of the 48 live outside this demo catalog.
    activePackages: BUSINESS.activePackages + db.packages.filter((p) => p.status === 'Activo').length - 11,
  };
}

function ChartCard({ title, subtitle, children, className, action }) {
  return (
    <Card className={cx('min-w-0 p-5', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div><h2 className="font-bold">{title}</h2>{subtitle && <p className="text-[13px] text-slate-500">{subtitle}</p>}</div>
        {action}
      </div>
      {children}
    </Card>
  );
}

const topPackages = (db, n = 6) => [...db.packages].sort((a, b) => b.sales - a.sales).slice(0, n).map((p) => ({ name: p.name, value: p.sales }));
const agentSales = (db) => [...db.agents].sort((a, b) => b.sales - a.sales).map((a) => ({ name: a.name, value: a.sales }));

function AdminDashboard() {
  const { db, go } = useStore();
  const b = useLiveBusiness();
  const pendingDel = db.packages.filter((p) => p.status === 'Pendiente de eliminación');
  const pendingCan = db.cancellations.filter((c) => c.status === 'Pendiente');
  return (
    <>
      <PageHeader title="Resumen del negocio" subtitle="Últimos 12 meses, actualizado con la operación de hoy."
        actions={<Button variant="secondary" icon={BarChart3} onClick={() => go('reports')}>Ver reportes</Button>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <div className="col-span-2 md:col-span-1"><StatCard label="Ventas" value={money(b.sales)} icon={Wallet} delta="+18%" note="vs. año anterior" /></div>
        <StatCard label="Reservas" value={b.reservations.toLocaleString('es-CO')} icon={CalendarCheck} delta="+9%" />
        <StatCard label="Clientes" value={b.clients.toLocaleString('es-CO')} icon={Users} delta="+64" note="este mes" />
        <StatCard label="Agentes" value={b.agents} icon={UserCog} note="en 5 ciudades" />
        <StatCard label="Paquetes activos" value={b.activePackages} icon={PackageIcon} />
      </div>
      {(pendingDel.length > 0 || pendingCan.length > 0) && (
        <Card className="mt-4 flex flex-col gap-3 border-amber-200 bg-amber-50/60 p-4 sm:flex-row sm:items-center">
          <ShieldAlert className="h-5 w-5 text-amber-700" />
          <p className="flex-1 text-sm text-amber-900">
            {pendingDel.length > 0 && <>{pendingDel.length} {pendingDel.length === 1 ? 'paquete espera' : 'paquetes esperan'} tu aprobación para eliminarse. </>}
            {pendingCan.length} {pendingCan.length === 1 ? 'cancelación está' : 'cancelaciones están'} en revisión por los agentes.
          </p>
          {pendingDel.length > 0 && <Button size="sm" variant="secondary" onClick={() => go('packages')}>Revisar solicitudes</Button>}
        </Card>
      )}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartCard title="Ventas" subtitle="Evolución mensual en pesos colombianos">
          <LineChart data={monthly} x="m" y="sales" label="Ventas mensuales" height={260} />
        </ChartCard>
        <ChartCard title="Ingresos por servicio" subtitle="Participación en las ventas del año">
          <HBarList data={serviceRevenue} share />
        </ChartCard>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Paquetes más vendidos" subtitle="Unidades vendidas">
          <HBarList data={topPackages(db, 5)} format={(v) => `${v} ventas`} />
        </ChartCard>
        <ChartCard title="Ventas por agente" subtitle="Últimos 12 meses">
          <HBarList data={agentSales(db)} />
        </ChartCard>
      </div>
    </>
  );
}

function Analytics() {
  const { db } = useStore();
  const [range, setRange] = useState('12');
  const [asTable, setAsTable] = useState(false);
  const data = monthly.slice(-Number(range));
  const totalSales = data.reduce((s, d) => s + d.sales, 0);
  const totalRes = data.reduce((s, d) => s + d.res, 0);
  return (
    <>
      <PageHeader title="Analítica" subtitle="Tendencias de ventas, reservas, catálogo y equipo."
        actions={<>
          <Segmented value={range} onChange={setRange} options={[{ value: '3', label: '3 meses' }, { value: '6', label: '6 meses' }, { value: '12', label: '12 meses' }]} />
          <Button variant="secondary" icon={asTable ? LineIcon : Table2} onClick={() => setAsTable(!asTable)}>{asTable ? 'Ver gráficos' : 'Ver tabla'}</Button>
        </>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ventas del período" value={moneyShort(totalSales)} icon={TrendingUp} />
        <StatCard label="Reservas del período" value={totalRes.toLocaleString('es-CO')} icon={CalendarCheck} />
        <StatCard label="Promedio mensual" value={moneyShort(totalSales / data.length)} icon={Wallet} note="en ventas" />
        <StatCard label="Mejor mes" value={[...data].sort((a, b) => b.sales - a.sales)[0].m} icon={Trophy} note={moneyShort([...data].sort((a, b) => b.sales - a.sales)[0].sales)} />
      </div>
      {asTable ? (
        <Card className="mt-6">
          <DataTable rows={data.map((d) => ({ ...d, id: d.m }))} columns={[
            { key: 'm', label: 'Mes' },
            { key: 'sales', label: 'Ventas', align: 'right', render: (d) => money(d.sales) },
            { key: 'res', label: 'Reservas', align: 'right' },
          ]} />
        </Card>
      ) : (
        <>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <ChartCard title="Ventas" subtitle="Evolución mensual"><LineChart data={data} x="m" y="sales" label="Ventas por mes" /></ChartCard>
            <ChartCard title="Reservas" subtitle="Reservas creadas por mes"><BarChart data={data} x="m" y="res" label="Reservas por mes" /></ChartCard>
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <ChartCard title="Paquetes" subtitle="Más vendidos"><HBarList data={topPackages(db)} format={(v) => `${v}`} /></ChartCard>
            <ChartCard title="Agentes" subtitle="Ventas por agente"><HBarList data={agentSales(db)} /></ChartCard>
            <ChartCard title="Servicios" subtitle="Distribución de ingresos"><HBarList data={serviceRevenue} share /></ChartCard>
          </div>
        </>
      )}
    </>
  );
}

function Agents() {
  const { db, actions } = useStore();
  const [sel, setSel] = useState(null);
  const rows = db.agents.map((a) => {
    const clients = db.clients.filter((c) => c.agentId === a.id);
    const ids = clients.map((c) => c.id);
    return { ...a, clients: clients.length, res: db.reservations.filter((r) => ids.includes(r.clientId)).length };
  });
  const agent = sel && rows.find((a) => a.id === sel);
  return (
    <>
      <PageHeader title="Agentes" subtitle="Desempeño del equipo comercial." />
      <Card>
        <DataTable rows={rows} onRowClick={(a) => setSel(a.id)} columns={[
          { key: 'name', label: 'Nombre', render: (a) => <div className="flex items-center gap-3"><Avatar name={a.name} size="sm" /><div><p className="font-semibold">{a.name}</p><p className="text-xs text-slate-500">{a.region}</p></div></div> },
          { key: 'clients', label: 'Clientes', align: 'right' },
          { key: 'res', label: 'Reservas', align: 'right' },
          { key: 'sales', label: 'Ventas', align: 'right', render: (a) => money(a.sales) },
          { key: 'conv', label: 'Conversión', render: (a) => (
            <div className="flex items-center gap-2"><div className="h-1.5 w-20 rounded-full bg-mist"><div className="h-1.5 rounded-full bg-signal" style={{ width: `${a.conversion * 250}%` }} /></div><span className="tnum text-sm">{Math.round(a.conversion * 100)}%</span></div>
          ) },
          { key: 'status', label: 'Estado', render: (a) => <Badge>{a.status}</Badge> },
        ]} />
      </Card>
      {agent && (
        <Drawer open onClose={() => setSel(null)} title={agent.name} subtitle={`${agent.region}, desde ${fmtDate(agent.joined)}`}
          footer={<Button variant="secondary" className="flex-1" onClick={() => actions.setAgentStatus(agent.id, agent.status === 'Activo' ? 'Inactivo' : 'Activo')}>{agent.status === 'Activo' ? 'Desactivar agente' : 'Activar agente'}</Button>}>
          <div className="grid grid-cols-2 gap-2">
            {[['Clientes', agent.clients], ['Reservas', agent.res], ['Ventas', moneyShort(agent.sales)], ['Conversión', `${Math.round(agent.conversion * 100)}%`]].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-mist p-3"><p className="text-xs text-slate-500">{k}</p><p className="text-lg font-bold tnum">{v}</p></div>
            ))}
          </div>
          <p className="mt-5 text-sm font-semibold">Clientes asignados</p>
          <ul className="mt-2 divide-y divide-line">
            {db.clients.filter((c) => c.agentId === agent.id).map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5"><Avatar name={clientName(c)} size="sm" /><span className="flex-1 text-sm">{clientName(c)}</span><Badge>{c.status}</Badge></li>
            ))}
          </ul>
        </Drawer>
      )}
    </>
  );
}

/* ---------- Reports ---------- */

const REPORTS = [
  { id: 'period', title: 'Ventas por período', text: 'Pagos aprobados agrupados por mes.', icon: TrendingUp },
  { id: 'top', title: 'Paquetes más vendidos', text: 'Ranking de paquetes por unidades vendidas.', icon: Trophy },
  { id: 'agents', title: 'Ventas por agente', text: 'Aporte de cada agente a las ventas.', icon: UserCog },
  { id: 'services', title: 'Ingresos por servicio', text: 'Transporte, alojamiento, auto y seguro.', icon: PieChart },
  { id: 'funnel', title: 'Reservas vs compras', text: 'Cuántas reservas terminan en compra.', icon: ArrowLeftRight },
  { id: 'newclients', title: 'Clientes nuevos', text: 'Registros por mes de alta.', icon: UserPlus },
];
const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const monthLabel = (iso) => `${MONTH_NAMES[Number(iso.slice(5, 7)) - 1]} ${iso.slice(2, 4)}`;

function Reports() {
  const { db, toast } = useStore();
  const [active, setActive] = useState('period');
  const [f, setF] = useState({ from: '2026-01-01', to: '2026-12-31', agent: '', destination: '', pkg: '', service: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const data = useMemo(() => {
    const inDate = (d) => d >= f.from && d <= f.to;
    const clientOk = (cid) => !f.agent || db.clients.find((c) => c.id === cid)?.agentId === f.agent;
    const pkgOk = (pid) => {
      const p = db.packages.find((x) => x.id === pid);
      return (!f.pkg || pid === f.pkg) && (!f.destination || p?.destination === f.destination);
    };
    const invPkgOk = (invId) => {
      const inv = db.invoices.find((i) => i.id === invId);
      return inv ? inv.items.some((i) => pkgOk(i.packageId)) : false;
    };
    switch (active) {
      case 'period': {
        const m = {};
        db.payments.filter((p) => p.status === 'Aprobado' && inDate(p.date) && clientOk(p.clientId) && invPkgOk(p.invoiceId))
          .forEach((p) => { const k = p.date.slice(0, 7); m[k] = (m[k] || 0) + p.amount; });
        return Object.keys(m).sort().map((k) => ({ name: monthLabel(k + '-01'), value: m[k] }));
      }
      case 'top':
        return db.packages.filter((p) => pkgOk(p.id)).sort((a, b) => b.sales - a.sales).map((p) => ({ name: p.name, value: p.sales, unit: 'ventas' }));
      case 'agents':
        return db.agents.filter((a) => !f.agent || a.id === f.agent).sort((a, b) => b.sales - a.sales).map((a) => ({ name: a.name, value: a.sales }));
      case 'services':
        return serviceRevenue.filter((s) => !f.service || s.name === f.service);
      case 'funnel': {
        const res = db.reservations.filter((r) => inDate(r.createdAt) && clientOk(r.clientId) && pkgOk(r.packageId));
        const bought = res.filter((r) => ['Comprada', 'Pagada', 'Cancelación pendiente'].includes(r.status));
        return [
          { name: 'Reservas creadas', value: res.length, unit: '' },
          { name: 'Compradas o pagadas', value: bought.length, unit: '' },
          { name: 'Pendientes de compra', value: res.filter((r) => r.status === 'Reservada').length, unit: '' },
          { name: 'Canceladas', value: res.filter((r) => r.status === 'Cancelada').length, unit: '' },
        ];
      }
      case 'newclients': {
        const m = {};
        db.clients.filter((c) => c.since >= '2021-01-01' && clientOk(c.id)).forEach((c) => { const y = c.since.slice(0, 4); m[y] = (m[y] || 0) + 1; });
        return Object.keys(m).sort().map((y) => ({ name: y, value: m[y], unit: 'clientes' }));
      }
      default: return [];
    }
  }, [active, f, db]);

  const isMoney = ['period', 'agents', 'services'].includes(active);
  const fmt = isMoney ? moneyShort : (v) => v.toLocaleString('es-CO');
  const rep = REPORTS.find((r) => r.id === active);
  const exportCsv = () => {
    const csv = ['Concepto,Valor', ...data.map((d) => `"${d.name}",${d.value}`)].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `reporte-${active}.csv`;
    a.click();
    toast('Reporte exportado', `reporte-${active}.csv`);
  };
  const dests = [...new Set(db.packages.map((p) => p.destination))].sort();

  return (
    <>
      <PageHeader title="Inteligencia del negocio" subtitle="Elige un reporte y ajusta los filtros. Todo se recalcula al instante." />
      <Card className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <Input label="Desde" type="date" value={f.from} onChange={set('from')} />
        <Input label="Hasta" type="date" value={f.to} onChange={set('to')} />
        <Select label="Agente" value={f.agent} onChange={set('agent')} options={[{ value: '', label: 'Todos' }, ...db.agents.map((a) => ({ value: a.id, label: a.name }))]} />
        <Select label="Destino" value={f.destination} onChange={set('destination')} options={[{ value: '', label: 'Todos' }, ...dests]} />
        <Select label="Paquete" value={f.pkg} onChange={set('pkg')} options={[{ value: '', label: 'Todos' }, ...db.packages.map((p) => ({ value: p.id, label: p.name }))]} />
        <Select label="Servicio" value={f.service} onChange={set('service')} options={[{ value: '', label: 'Todos' }, ...serviceRevenue.map((s) => s.name)]} />
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {REPORTS.map((r) => (
            <li key={r.id}>
              <button onClick={() => setActive(r.id)} aria-pressed={active === r.id}
                className={cx('flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors', active === r.id ? 'border-navy bg-navy text-white' : 'border-line bg-white hover:border-slate-300')}>
                <r.icon className={cx('mt-0.5 h-5 w-5 shrink-0', active === r.id ? 'text-signal-100' : 'text-signal')} />
                <span><span className="block text-sm font-semibold">{r.title}</span><span className={cx('text-xs', active === r.id ? 'text-white/60' : 'text-slate-500')}>{r.text}</span></span>
              </button>
            </li>
          ))}
        </ul>
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-lg font-bold">{rep.title}</h2><p className="text-[13px] text-slate-500">{fmtDate(f.from)} a {fmtDate(f.to)}</p></div>
            <Button variant="secondary" icon={Download} onClick={exportCsv} disabled={!data.length}>Exportar CSV</Button>
          </div>
          {data.length ? (
            <>
              {active === 'period' ? <BarChart data={data} x="name" y="value" format={moneyShort} label={rep.title} /> : <HBarList data={data} format={fmt} share={active === 'services'} />}
              <div className="mt-6 overflow-hidden rounded-xl border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-mist"><tr><th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Concepto</th><th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Valor</th></tr></thead>
                  <tbody>{data.map((d) => <tr key={d.name} className="border-t border-line"><td className="px-4 py-2.5">{d.name}</td><td className="px-4 py-2.5 text-right tnum">{isMoney ? money(d.value) : d.value.toLocaleString('es-CO')}</td></tr>)}</tbody>
                </table>
              </div>
            </>
          ) : <EmptyState icon={BarChart3} title="Sin datos para estos filtros" text="Amplía el rango de fechas o quita algún filtro." />}
        </Card>
      </div>
    </>
  );
}
