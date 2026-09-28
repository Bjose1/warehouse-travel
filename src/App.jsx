import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell, Search, Menu, X, LayoutDashboard, Users, CalendarCheck, CircleSlash, Package, ReceiptText, CreditCard,
  BarChart3, UserCog, FileBarChart, LogOut, User, Luggage, UserPlus, Compass, MapPin, Tag,
} from 'lucide-react';
import { seed, quote, invoiceTotals, CORPORATE_DISCOUNT, TODAY } from './data.js';
import { cx, IconButton, Avatar, ToastStack } from './ui.jsx';
import ClientApp from './views/client.jsx';
import AgentApp from './views/agent.jsx';
import AdminApp from './views/admin.jsx';

const Store = createContext(null);
export const useStore = () => useContext(Store);

export function Logo({ light, compact }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={cx('grid h-9 w-9 place-items-center rounded-xl', light ? 'bg-white/10' : 'bg-navy')}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path d="M3 14.5 21 6l-4.2 11.2-5.3-3.3L8.4 18v-5.4z" fill="white" />
          <path d="m8.4 12.6 8.4-6.6" stroke="#8FB0FF" strokeWidth="1.4" />
        </svg>
      </span>
      {!compact && (
        <span className={cx('leading-none', light ? 'text-white' : 'text-ink')}>
          <span className="block text-[15px] font-extrabold tracking-tight">Warehouse</span>
          <span className={cx('block font-board text-[13px] font-semibold tracking-[0.18em]', light ? 'text-white/60' : 'text-signal')}>TRAVEL</span>
        </span>
      )}
    </span>
  );
}

/* ---------------- Store ---------------- */

function useAppStore() {
  const [db, setDb] = useState(seed);
  const [role, setRoleState] = useState('client');
  const [navs, setNavs] = useState({ client: { name: 'home' }, agent: { name: 'dashboard' }, admin: { name: 'dashboard' } });
  const [currentClientId, setCurrentClientId] = useState('c1');
  const [toasts, setToasts] = useState([]);
  const counters = useRef({ res: 8942, ord: 124, fac: 125, txn: 849201, can: 304, pkg: 13, cli: 12, evt: 10 });
  const next = (k) => counters.current[k]++;

  const toast = useCallback((title, text, tone = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-2), { id, title, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const go = useCallback((name, params = {}) => {
    setNavs((n) => ({ ...n, [role]: { name, ...params } }));
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [role]);
  const setRole = (r) => { setRoleState(r); window.scrollTo({ top: 0, behavior: 'instant' }); };

  const log = (type, text) => ({ id: 'e' + next('evt'), type, text, time: 'Justo ahora' });
  const pkgOf = (d, id) => d.packages.find((p) => p.id === id);
  const clientName = (d, id) => { const c = d.clients.find((x) => x.id === id); return c ? `${c.first} ${c.last}` : ''; };

  const actions = {
    createReservation({ packageId, date, travelers, contact }) {
      const id = 'RES-' + next('res');
      const orderId = 'ORD-2026-' + String(next('ord')).padStart(5, '0');
      setDb((d) => {
        const p = pkgOf(d, packageId);
        const res = { id, orderId, clientId: currentClientId, packageId, date, travelers, status: 'Reservada', createdAt: TODAY, total: quote(p, travelers).total, contact };
        return { ...d, reservations: [res, ...d.reservations], activity: [log('reserva', `${clientName(d, currentClientId)} reservó ${p.name} para ${travelers} ${travelers === 1 ? 'viajero' : 'viajeros'}`), ...d.activity] };
      });
      toast('Reserva creada', `Código ${id}. Tu cupo queda apartado por 48 horas.`);
      return id;
    },
    purchaseOrder(resId) {
      setDb((d) => ({ ...d, reservations: d.reservations.map((r) => (r.id === resId && r.status === 'Reservada' ? { ...r, status: 'Comprada' } : r)) }));
    },
    payReservation(resId, method) {
      const invoiceId = 'FAC-2026-' + String(next('fac')).padStart(5, '0');
      const txnId = 'TXN-' + next('txn');
      setDb((d) => {
        const r = d.reservations.find((x) => x.id === resId);
        const p = pkgOf(d, r.packageId);
        const q = quote(p, r.travelers);
        const invoice = {
          id: invoiceId, clientId: r.clientId, date: TODAY, method, discountRate: 0,
          items: [{ reservationId: r.id, packageId: p.id, name: p.name, travelers: r.travelers, amount: q.subtotal }],
          subtotal: q.subtotal, discount: q.discount, taxes: q.taxes, total: q.total,
        };
        const payment = { id: txnId, invoiceId, clientId: r.clientId, method, date: TODAY, amount: q.total, status: 'Aprobado' };
        return {
          ...d,
          reservations: d.reservations.map((x) => (x.id === resId ? { ...x, status: 'Pagada', total: q.total } : x)),
          invoices: [invoice, ...d.invoices],
          payments: [payment, ...d.payments],
          activity: [log('pago', `Pago recibido de ${clientName(d, r.clientId)} por $${q.total.toLocaleString('es-CO')} vía ${method.toLowerCase()}`), ...d.activity],
          notifications: [{ id: 'n' + txnId, text: `Pago aprobado para ${p.name}. Factura ${invoiceId} disponible.`, read: false }, ...d.notifications],
        };
      });
      return { invoiceId, txnId };
    },
    requestCancellation(resId, reason) {
      setDb((d) => {
        const r = d.reservations.find((x) => x.id === resId);
        const can = { id: 'CAN-' + next('can'), reservationId: resId, clientId: r.clientId, reason, date: TODAY, status: 'Pendiente' };
        return {
          ...d,
          reservations: d.reservations.map((x) => (x.id === resId ? { ...x, status: 'Cancelación pendiente', prevStatus: x.status } : x)),
          cancellations: [can, ...d.cancellations],
          activity: [log('cancelacion', `${clientName(d, r.clientId)} solicitó cancelar ${pkgOf(d, r.packageId).name}`), ...d.activity],
        };
      });
      toast('Solicitud enviada', 'Tu agente de viajes revisará la cancelación.');
    },
    resolveCancellation(canId, approve) {
      setDb((d) => {
        const c = d.cancellations.find((x) => x.id === canId);
        return {
          ...d,
          cancellations: d.cancellations.map((x) => (x.id === canId ? { ...x, status: approve ? 'Aprobada' : 'Rechazada' } : x)),
          reservations: d.reservations.map((x) => (x.id === c.reservationId ? { ...x, status: approve ? 'Cancelada' : x.prevStatus || 'Pagada' } : x)),
          notifications: c.clientId === currentClientId
            ? [{ id: 'n' + canId, text: approve ? `Tu cancelación de ${c.reservationId} fue aprobada.` : `Tu solicitud de cancelación de ${c.reservationId} fue rechazada. Tu viaje sigue en pie.`, read: false }, ...d.notifications]
            : d.notifications,
        };
      });
      toast(approve ? 'Cancelación aprobada' : 'Cancelación rechazada', approve ? 'El cliente verá su reserva como cancelada.' : 'La reserva vuelve a su estado anterior.', approve ? 'success' : 'info');
    },
    savePackage(pkg) {
      const isNew = !pkg.id;
      const id = pkg.id || 'p' + next('pkg');
      setDb((d) => ({
        ...d,
        packages: isNew ? [{ ...pkg, id, sales: 0, rating: 5, reviews: 0 }, ...d.packages] : d.packages.map((p) => (p.id === id ? { ...p, ...pkg } : p)),
        activity: [log('paquete', `${isNew ? 'Publicaste' : 'Actualizaste'} ${pkg.name}`), ...d.activity],
      }));
      toast(isNew ? 'Paquete publicado' : 'Paquete actualizado', `${pkg.name} ya se ve en el catálogo.`);
      return id;
    },
    requestPackageDeletion(id) {
      setDb((d) => ({ ...d, packages: d.packages.map((p) => (p.id === id ? { ...p, status: 'Pendiente de eliminación', prevStatus: p.status } : p)) }));
      toast('Solicitud enviada', 'El administrador revisará la eliminación.');
    },
    resolveDeletion(id, approve) {
      setDb((d) => ({
        ...d,
        packages: approve ? d.packages.filter((p) => p.id !== id) : d.packages.map((p) => (p.id === id ? { ...p, status: p.prevStatus || 'Activo' } : p)),
      }));
      toast(approve ? 'Paquete eliminado' : 'Eliminación rechazada', approve ? 'Ya no aparece en el catálogo.' : 'El paquete sigue publicado.', approve ? 'success' : 'info');
    },
    deletePackage(id) {
      setDb((d) => ({ ...d, packages: d.packages.filter((p) => p.id !== id) }));
      toast('Paquete eliminado', 'Ya no aparece en el catálogo.');
    },
    togglePackage(id) {
      let nextStatus;
      setDb((d) => ({
        ...d,
        packages: d.packages.map((p) => {
          if (p.id !== id) return p;
          nextStatus = p.status === 'Activo' ? 'Inactivo' : 'Activo';
          return { ...p, status: nextStatus };
        }),
      }));
      toast('Paquete actualizado', 'El estado cambió en el catálogo.');
    },
    createInvoice({ clientId, reservationIds, corporate, method }) {
      const invoiceId = 'FAC-2026-' + String(next('fac')).padStart(5, '0');
      const txnId = 'TXN-' + next('txn');
      setDb((d) => {
        const items = reservationIds.map((rid) => {
          const r = d.reservations.find((x) => x.id === rid);
          const p = pkgOf(d, r.packageId);
          return { reservationId: rid, packageId: p.id, name: p.name, travelers: r.travelers, amount: p.price * r.travelers };
        });
        const rate = corporate ? CORPORATE_DISCOUNT : 0;
        const t = invoiceTotals(items, rate);
        return {
          ...d,
          invoices: [{ id: invoiceId, clientId, items, date: TODAY, method, discountRate: rate, ...t }, ...d.invoices],
          payments: [{ id: txnId, invoiceId, clientId, method, date: TODAY, amount: t.total, status: 'Pendiente' }, ...d.payments],
          reservations: d.reservations.map((r) => (reservationIds.includes(r.id) ? { ...r, status: 'Comprada' } : r)),
        };
      });
      toast('Factura generada', `${invoiceId} quedó asociada al cliente con pago pendiente.`);
      return invoiceId;
    },
    setPaymentStatus(txnId, status) {
      setDb((d) => {
        const pay = d.payments.find((p) => p.id === txnId);
        const inv = d.invoices.find((i) => i.id === pay.invoiceId);
        const resIds = inv ? inv.items.map((i) => i.reservationId) : [];
        return {
          ...d,
          payments: d.payments.map((p) => (p.id === txnId ? { ...p, status } : p)),
          reservations: status === 'Aprobado' ? d.reservations.map((r) => (resIds.includes(r.id) && r.status === 'Comprada' ? { ...r, status: 'Pagada' } : r)) : d.reservations,
        };
      });
      toast(status === 'Aprobado' ? 'Pago aprobado' : 'Pago rechazado', txnId, status === 'Aprobado' ? 'success' : 'error');
    },
    registerClient(data) {
      const id = 'c' + next('cli');
      setDb((d) => ({
        ...d,
        clients: [{ id, ...data, agentId: 'a1', status: 'Activo', since: TODAY, lastActivity: TODAY, city: 'Bogotá' }, ...d.clients],
        activity: [log('cliente', `Nuevo cliente asignado: ${data.first} ${data.last}`), ...d.activity],
      }));
      setCurrentClientId(id);
      return id;
    },
    updateClient(id, patch) {
      setDb((d) => ({ ...d, clients: d.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
      toast('Cliente actualizado');
    },
    setAgentStatus(id, status) {
      setDb((d) => ({ ...d, agents: d.agents.map((a) => (a.id === id ? { ...a, status } : a)) }));
      toast('Agente actualizado', `Estado: ${status.toLowerCase()}.`);
    },
    readNotifications() {
      setDb((d) => ({ ...d, notifications: d.notifications.map((n) => ({ ...n, read: true })) }));
    },
  };

  const currentClient = db.clients.find((c) => c.id === currentClientId) || db.clients[0];
  const currentAgent = db.agents[0];
  return { db, role, setRole, nav: navs[role], go, toast, toasts, dismiss, actions, currentClient, currentAgent };
}

/* ---------------- Role switcher (prototype tool) ---------------- */

const ROLES = [{ v: 'client', l: 'Cliente' }, { v: 'agent', l: 'Agente' }, { v: 'admin', l: 'Administrador' }];

function RoleSwitcher() {
  const { role, setRole } = useStore();
  return (
    <div className="sticky top-0 z-40 bg-navy-900 text-white">
      <div className="mx-auto flex h-9 max-w-[1400px] items-center justify-between gap-3 px-4 text-xs sm:px-6">
        <span className="hidden text-white/50 sm:block">Prototipo · cambia de entorno para ver cada rol</span>
        <span className="text-white/50 sm:hidden">Entorno</span>
        <div className="flex rounded-lg bg-white/10 p-0.5" role="tablist" aria-label="Cambiar de rol">
          {ROLES.map((r) => (
            <button key={r.v} role="tab" aria-selected={role === r.v} onClick={() => setRole(r.v)}
              className={cx('h-7 rounded-md px-2.5 font-semibold transition-colors', role === r.v ? 'bg-white text-navy' : 'text-white/70 hover:text-white')}>
              {r.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Client header ---------------- */

function useOutside(ref, onOut) {
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && onOut();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, onOut]);
}

function Notifications() {
  const { db, actions } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false));
  const unread = db.notifications.filter((n) => !n.read).length;
  return (
    <div className="relative" ref={ref}>
      <IconButton icon={Bell} label="Notificaciones" badge={unread} onClick={() => { setOpen(!open); if (!open) setTimeout(actions.readNotifications, 1500); }} />
      {open && (
        <div className="absolute right-0 top-12 z-40 w-80 animate-rise rounded-2xl border border-line bg-white p-2 shadow-pop">
          <p className="px-3 py-2 text-sm font-bold">Notificaciones</p>
          <ul>
            {db.notifications.slice(0, 6).map((n) => (
              <li key={n.id} className="flex gap-3 rounded-xl px-3 py-2.5 text-[13px] text-slate-700 hover:bg-mist">
                <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-slate-200' : 'bg-signal')} />
                {n.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AccountMenu() {
  const { currentClient, go } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false));
  const name = `${currentClient.first} ${currentClient.last}`;
  const item = (icon, label, fn) => {
    const I = icon;
    return (
      <button onClick={() => { fn(); setOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-mist">
        <I className="h-4 w-4 text-slate-400" />{label}
      </button>
    );
  };
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full p-0.5 pr-0.5 hover:bg-slate-100 sm:pr-3" aria-label="Tu cuenta">
        <Avatar name={name} size="sm" />
        <span className="hidden text-sm font-semibold lg:block">{currentClient.first}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-64 animate-rise rounded-2xl border border-line bg-white p-2 shadow-pop">
          <div className="px-3 py-2">
            <p className="text-sm font-bold">{name}</p>
            <p className="truncate text-xs text-slate-500">{currentClient.email}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          {item(User, 'Perfil', () => go('profile'))}
          {item(Luggage, 'Mis viajes', () => go('trips'))}
          {item(UserPlus, 'Crear una cuenta nueva', () => go('register'))}
        </div>
      )}
    </div>
  );
}

function ClientHeader() {
  const { nav, go } = useStore();
  const [q, setQ] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { name: 'home', label: 'Explorar', icon: Compass },
    { name: 'destinations', label: 'Destinos', icon: MapPin },
    { name: 'offers', label: 'Ofertas', icon: Tag },
    { name: 'trips', label: 'Mis viajes', icon: Luggage },
  ];
  const submit = (e) => { e.preventDefault(); go('catalog', { q }); setMobileOpen(false); };
  const isActive = (n) => nav.name === n || (n === 'trips' && nav.name === 'trip') || (n === 'home' && nav.name === 'catalog');
  return (
    <header className="sticky top-9 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        <button onClick={() => go('home')} aria-label="Ir al inicio"><Logo /></button>
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <button key={l.name} onClick={() => go(l.name)}
              className={cx('h-9 rounded-lg px-3 text-sm font-semibold transition-colors', isActive(l.name) ? 'bg-mist text-ink' : 'text-slate-500 hover:text-ink')}>
              {l.label}
            </button>
          ))}
        </nav>
        <form onSubmit={submit} className="ml-auto hidden w-full max-w-xs lg:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="¿A dónde quieres viajar?" aria-label="Buscar destino"
              className="h-10 w-full rounded-full border border-line bg-mist pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-signal focus:bg-white focus:outline-none focus:ring-4 focus:ring-signal/10" />
          </div>
        </form>
        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <Notifications />
          <AccountMenu />
          <IconButton icon={mobileOpen ? X : Menu} label="Menú" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} />
        </div>
      </div>
      {mobileOpen && (
        <div className="animate-fade border-t border-line bg-white px-4 pb-4 pt-3 md:hidden">
          <form onSubmit={submit} className="relative mb-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="¿A dónde quieres viajar?" aria-label="Buscar destino"
              className="h-11 w-full rounded-xl border border-line bg-mist pl-10 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-signal/10" />
          </form>
          <div className="grid grid-cols-2 gap-2">
            {links.map((l) => (
              <button key={l.name} onClick={() => { go(l.name); setMobileOpen(false); }}
                className={cx('flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold', isActive(l.name) ? 'bg-navy text-white' : 'bg-mist text-ink')}>
                <l.icon className="h-4 w-4" />{l.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------------- Backoffice shell (agent & admin) ---------------- */

export const AGENT_NAV = [
  { name: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { name: 'clients', label: 'Clientes', icon: Users },
  { name: 'reservations', label: 'Reservas', icon: CalendarCheck },
  { name: 'cancellations', label: 'Cancelaciones', icon: CircleSlash, count: (db) => db.cancellations.filter((c) => c.status === 'Pendiente').length },
  { name: 'packages', label: 'Paquetes', icon: Package },
  { name: 'billing', label: 'Facturación', icon: ReceiptText },
  { name: 'payments', label: 'Pagos', icon: CreditCard },
];
export const ADMIN_NAV = [
  { name: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { name: 'analytics', label: 'Analítica', icon: BarChart3 },
  { name: 'packages', label: 'Catálogo', icon: Package, count: (db) => db.packages.filter((p) => p.status === 'Pendiente de eliminación').length },
  { name: 'clients', label: 'Clientes', icon: Users },
  { name: 'agents', label: 'Agentes', icon: UserCog },
  { name: 'reservations', label: 'Reservas', icon: CalendarCheck },
  { name: 'reports', label: 'Reportes', icon: FileBarChart },
];

export function BackofficeShell({ items, person, subtitle, children }) {
  const { nav, go, db, setRole } = useStore();
  const [open, setOpen] = useState(false);
  const current = nav.name === 'package-form' ? 'packages' : nav.name;
  const SidebarBody = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5"><Logo light /></div>
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {items.map((it) => {
          const n = it.count ? it.count(db) : 0;
          const active = current === it.name;
          return (
            <button key={it.name} onClick={() => { go(it.name); setOpen(false); }} aria-current={active ? 'page' : undefined}
              className={cx('flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors', active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white')}>
              <it.icon className="h-[18px] w-[18px]" />
              <span className="flex-1 text-left">{it.label}</span>
              {n > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-navy tnum">{n}</span>}
            </button>
          );
        })}
      </nav>
      <div className="m-3 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
        <Avatar name={person} size="sm" className="!bg-white/15 !text-white" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{person}</p>
          <p className="truncate text-xs text-white/50">{subtitle}</p>
        </div>
        <button onClick={() => setRole('client')} className="text-white/50 hover:text-white" aria-label="Salir al portal de clientes" title="Salir al portal de clientes"><LogOut className="h-4 w-4" /></button>
      </div>
    </div>
  );
  return (
    <div className="flex min-h-[calc(100vh-36px)]">
      <aside className="sticky top-9 hidden h-[calc(100vh-36px)] w-64 shrink-0 bg-navy lg:block">{SidebarBody}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade bg-navy-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-rise bg-navy">{SidebarBody}</aside>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-9 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-8">
          <IconButton icon={Menu} label="Abrir menú" className="-ml-2 lg:hidden" onClick={() => setOpen(true)} />
          <span className="lg:hidden"><Logo compact /></span>
          <span className="hidden text-sm text-slate-500 lg:block">{items.find((i) => i.name === current)?.label}</span>
          <div className="ml-auto flex items-center gap-2">
            <IconButton icon={Bell} label="Notificaciones" badge={db.cancellations.some((c) => c.status === 'Pendiente')} onClick={() => go(items.some((i) => i.name === 'cancellations') ? 'cancellations' : 'packages')} />
            <Avatar name={person} size="sm" />
          </div>
        </header>
        <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

/* ---------------- App ---------------- */

export default function App() {
  const store = useAppStore();
  const value = useMemo(() => store, [store]);
  return (
    <Store.Provider value={value}>
      <RoleSwitcher />
      {store.role === 'client' && (
        <>
          <ClientHeader />
          <ClientApp />
        </>
      )}
      {store.role === 'agent' && <AgentApp />}
      {store.role === 'admin' && <AdminApp />}
      <ToastStack toasts={store.toasts} dismiss={store.dismiss} />
    </Store.Provider>
  );
}
