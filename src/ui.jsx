import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, Check, Loader2, Plane, TrainFront, Ship, Bus, Hotel, BedDouble, Car, ShieldCheck, Star,
  CheckCircle2, AlertTriangle, Info, XCircle, Inbox,
} from 'lucide-react';
import { money, moneyShort } from './data.js';

export const cx = (...c) => c.filter(Boolean).join(' ');

/* ---------- Buttons & form controls ---------- */

const BTN = {
  primary: 'bg-signal text-white hover:bg-signal-600 active:bg-signal-700 shadow-[0_1px_0_rgba(255,255,255,.2)_inset]',
  dark: 'bg-navy text-white hover:bg-navy-800',
  secondary: 'bg-white text-ink border border-line hover:border-slate-300 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-ink',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  'danger-soft': 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
};
const SIZE = { sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg', md: 'h-10 px-4 text-sm gap-2 rounded-xl', lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl' };

export function Button({ variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading, className, children, ...rest }) {
  return (
    <button
      className={cx('inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:pointer-events-none', BTN[variant], SIZE[size], className)}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon && <Icon className="h-4 w-4 shrink-0" />}
      {children}
      {IconRight && <IconRight className="h-4 w-4 shrink-0" />}
    </button>
  );
}

export function IconButton({ icon: Icon, label, className, badge, ...rest }) {
  return (
    <button aria-label={label} title={label} className={cx('relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-ink transition-colors', className)} {...rest}>
      <Icon className="h-[18px] w-[18px]" />
      {badge ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" /> : null}
    </button>
  );
}

export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="mb-1.5 block text-[13px] font-medium text-slate-700">{label}</span>}
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

const control = 'w-full rounded-xl border bg-white px-3.5 text-sm text-ink placeholder:text-slate-400 transition focus:outline-none focus:ring-4 focus:ring-signal/10 focus:border-signal';

export function Input({ label, hint, error, icon: Icon, className, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <input className={cx(control, 'h-11', Icon && 'pl-10', error ? 'border-rose-400' : 'border-line')} {...rest} />
      </div>
    </Field>
  );
}

export function Textarea({ label, hint, error, className, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      <textarea className={cx(control, 'min-h-[96px] py-3', error ? 'border-rose-400' : 'border-line')} {...rest} />
    </Field>
  );
}

export function Select({ label, hint, options, className, ...rest }) {
  return (
    <Field label={label} hint={hint} className={className}>
      <select className={cx(control, 'h-11 border-line appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%2364748b%27 stroke-width=%272%27%3E%3Cpath d=%27m4 6 4 4 4-4%27/%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center] pr-9')} {...rest}>
        {options.map((o) => {
          const v = typeof o === 'string' ? { value: o, label: o } : o;
          return <option key={v.value} value={v.value}>{v.label}</option>;
        })}
      </select>
    </Field>
  );
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 text-left">
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="block text-[13px] text-slate-500">{description}</span>}
      </span>
      <span className={cx('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-signal' : 'bg-slate-300')}>
        <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </span>
    </button>
  );
}

export function Chip({ active, onClick, children, icon: Icon }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cx('inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors',
        active ? 'border-navy bg-navy text-white' : 'border-line bg-white text-slate-700 hover:border-slate-300')}>
      {Icon && <Icon className="h-3.5 w-3.5" />}{children}
    </button>
  );
}

export function Segmented({ value, onChange, options, className }) {
  return (
    <div className={cx('inline-flex rounded-xl bg-slate-100 p-1', className)} role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cx('h-8 rounded-lg px-3 text-[13px] font-semibold transition-colors', value === o.value ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink')}>
          {o.label}{o.count != null && <span className="ml-1.5 text-slate-400 tnum">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Status badge ---------- */

const TONE = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  blue: 'bg-signal-50 text-signal-700 ring-signal/15',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/10',
};
const DOT = { green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-rose-500', blue: 'bg-signal', violet: 'bg-violet-500', slate: 'bg-slate-400' };
const STATUS_TONE = {
  Reservada: 'blue', Comprada: 'violet', Pagada: 'green', 'Cancelación pendiente': 'amber', Cancelada: 'red', Completado: 'slate',
  Pendiente: 'amber', Aprobado: 'green', Aprobada: 'green', Rechazado: 'red', Rechazada: 'red',
  Activo: 'green', Inactivo: 'slate', 'Pendiente de eliminación': 'amber', Corporativo: 'violet', Persona: 'slate',
};

export function Badge({ children, tone, dot = true, className }) {
  const t = tone || STATUS_TONE[children] || 'slate';
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', TONE[t], className)}>
      {dot && <span className={cx('h-1.5 w-1.5 rounded-full', DOT[t])} />}
      {children}
    </span>
  );
}

/* ---------- Surfaces ---------- */

export function Card({ className, children, ...rest }) {
  return <div className={cx('rounded-2xl border border-line bg-white', className)} {...rest}>{children}</div>;
}

export function StatCard({ label, value, delta, icon: Icon, note }) {
  const up = delta && !String(delta).startsWith('-');
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-slate-500">{label}</span>
        {Icon && <span className="grid h-8 w-8 place-items-center rounded-lg bg-mist text-navy"><Icon className="h-4 w-4" /></span>}
      </div>
      <div className="mt-3 whitespace-nowrap text-[22px] font-bold leading-none tracking-tight text-ink tnum sm:text-[28px]">{value}</div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta && <span className={cx('font-semibold', up ? 'text-emerald-600' : 'text-rose-600')}>{delta}</span>}
        {note && <span className="text-slate-500">{note}</span>}
      </div>
    </Card>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-mist text-slate-500"><Icon className="h-5 w-5" /></span>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Cargando…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cx('animate-pulse rounded-lg bg-slate-200/70', className)} />;
}

/* ---------- Overlays ---------- */

function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = prev; };
  }, [open, onClose]);
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEscape(open, onClose);
  if (!open) return null;
  const w = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade bg-navy-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cx('relative max-h-[92vh] w-full animate-rise overflow-y-auto rounded-t-3xl bg-white shadow-pop sm:rounded-3xl', w)}>
        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
          <div>
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <IconButton icon={X} label="Cerrar" onClick={onClose} className="-mr-2 -mt-2" />
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, text, confirmLabel, tone = 'danger', icon: Icon = AlertTriangle, loading }) {
  return (
    <Modal open={open} onClose={onClose} title="" size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Volver</Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </>}>
      <div className="-mt-6 flex flex-col items-center text-center">
        <span className={cx('grid h-12 w-12 place-items-center rounded-2xl', tone === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600')}><Icon className="h-5 w-5" /></span>
        <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
        <p className="mt-1.5 text-sm text-slate-500">{text}</p>
      </div>
    </Modal>
  );
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'max-w-xl' }) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade bg-navy-900/40" onClick={onClose} />
      <aside className={cx('absolute inset-y-0 right-0 flex w-full animate-slidein flex-col bg-white shadow-pop', width)}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">{typeof title === 'string' ? <h2 className="text-lg font-bold text-ink">{title}</h2> : title}{subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}</div>
          <IconButton icon={X} label="Cerrar" onClick={onClose} className="-mr-2" />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </aside>
    </div>
  );
}

/* ---------- Toasts ---------- */

const TOAST_ICON = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle };
const TOAST_COLOR = { success: 'text-emerald-400', error: 'text-rose-400', info: 'text-sky-300', warning: 'text-amber-300' };

export function ToastStack({ toasts, dismiss }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:right-6 sm:left-auto" aria-live="polite">
      {toasts.map((t) => {
        const I = TOAST_ICON[t.tone] || CheckCircle2;
        return (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-sm animate-rise items-start gap-3 rounded-2xl bg-navy-900 px-4 py-3 text-white shadow-pop">
            <I className={cx('mt-0.5 h-5 w-5 shrink-0', TOAST_COLOR[t.tone] || TOAST_COLOR.success)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.text && <p className="mt-0.5 text-[13px] text-slate-300">{t.text}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} aria-label="Cerrar aviso" className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Data table (turns into cards on mobile) ---------- */

export function DataTable({ columns, rows, onRowClick, empty, mobile }) {
  if (!rows.length) return empty || <EmptyState title="Sin resultados" text="Ajusta los filtros para ver más registros." />;
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              {columns.map((c) => (
                <th key={c.key} className={cx('whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-500', c.align === 'right' && 'text-right')}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cx('border-b border-line/70 last:border-0', onRowClick && 'cursor-pointer hover:bg-mist/70')}>
                {columns.map((c) => (
                  <td key={c.key} className={cx(!c.wrap && 'whitespace-nowrap', 'px-4 py-3.5 align-middle', c.align === 'right' && 'text-right tnum', c.className)}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <li key={row.id} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cx('px-4 py-4', onRowClick && 'active:bg-mist')}>
            {mobile ? mobile(row) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                {columns.map((c) => (
                  <div key={c.key} className={c.key === columns[0].key ? 'col-span-2' : ''}>
                    {c.key !== columns[0].key && <dt className="text-[11px] text-slate-500">{c.label}</dt>}
                    <dd className="text-sm">{c.render ? c.render(row) : row[c.key]}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

/* ---------- Stepper ---------- */

export const BOOKING_STEPS = ['Viaje', 'Datos', 'Confirmación', 'Pago', 'Confirmado'];

export function Stepper({ steps = BOOKING_STEPS, current }) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto no-scrollbar" aria-label="Progreso de la reserva">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex shrink-0 items-center gap-2">
            <span className={cx('flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[13px] font-semibold transition-colors',
              active ? 'bg-navy text-white' : done ? 'bg-signal-50 text-signal-700' : 'bg-white text-slate-400 ring-1 ring-line')}>
              <span className={cx('grid h-6 w-6 place-items-center rounded-full font-board text-sm tnum',
                active ? 'bg-white/15' : done ? 'bg-signal text-white' : 'bg-mist')}>
                {done ? <Check className="h-3.5 w-3.5" /> : String(i + 1).padStart(2, '0')}
              </span>
              {s}
            </span>
            {i < steps.length - 1 && <span className={cx('h-px w-5 sm:w-8', done ? 'bg-signal' : 'bg-line')} />}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- Travel-specific bits ---------- */

// Image with an on-brand fallback: if the photo fails, show the destination's airport code on navy.
export function Img({ src, alt, code, className }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className={cx('grid place-items-center bg-gradient-to-br from-navy to-navy-700 text-white/90', className)} role="img" aria-label={alt}>
        <span className="font-board text-5xl font-semibold tracking-wide">{code || 'WT'}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={cx('object-cover', className)} />;
}

export const TRANSPORT_ICON = { air: Plane, train: TrainFront, sea: Ship, land: Bus };
const TRANSPORT_SHORT = { air: 'Vuelo', train: 'Tren', sea: 'Crucero', land: 'Bus' };

export function serviceList(p) {
  const s = [{ key: 't', icon: TRANSPORT_ICON[p.transport.type], label: TRANSPORT_SHORT[p.transport.type] }];
  s.push({ key: 'l', icon: p.lodging.type === 'Hostal' ? BedDouble : Hotel, label: p.lodging.type });
  if (p.car) s.push({ key: 'c', icon: Car, label: 'Auto' });
  s.push({ key: 'i', icon: ShieldCheck, label: 'Seguro' });
  return s;
}

export function ServiceIcons({ pkg, compact }) {
  return (
    <ul className={cx('flex gap-1.5', compact ? 'flex-nowrap' : 'flex-wrap')}>
      {serviceList(pkg).map(({ key, icon: I, label }) => (
        <li key={key} className="inline-flex items-center gap-1 rounded-md bg-mist px-2 py-1 text-[12px] font-medium text-slate-600">
          <I className="h-3.5 w-3.5 text-navy" />{!compact && label}
        </li>
      ))}
    </ul>
  );
}

export function Rating({ value, reviews, light }) {
  return (
    <span className={cx('inline-flex items-center gap-1 text-[13px] font-semibold', light ? 'text-white' : 'text-ink')}>
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      {value.toFixed(1)}
      {reviews != null && <span className={cx('font-normal', light ? 'text-white/70' : 'text-slate-500')}>({reviews})</span>}
    </span>
  );
}

export function Route({ from, to, className }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 font-board font-semibold tracking-wide', className)}>
      {from}<Plane className="h-3.5 w-3.5 opacity-60" />{to}
    </span>
  );
}

export function Avatar({ name, size = 'md', className }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const s = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' }[size];
  const hues = ['bg-navy text-white', 'bg-signal-100 text-signal-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-800'];
  const h = hues[name.length % hues.length];
  return <span className={cx('grid shrink-0 place-items-center rounded-full font-semibold', s, h, className)}>{initials}</span>;
}

export function PriceLines({ lines, total, totalLabel = 'Total' }) {
  return (
    <dl className="space-y-2.5 text-sm">
      {lines.filter(Boolean).map(([k, v, tone]) => (
        <div key={k} className="flex justify-between gap-4">
          <dt className="text-slate-500">{k}</dt>
          <dd className={cx('tnum font-medium', tone === 'green' ? 'text-emerald-600' : 'text-ink')}>{v}</dd>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <dt className="font-semibold text-ink">{totalLabel}</dt>
        <dd className="text-xl font-bold tracking-tight text-ink tnum">{money(total)}</dd>
      </div>
    </dl>
  );
}

/* ---------- Charts (single-series, SVG, hover tooltips) ---------- */

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

const niceMax = (v) => {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};

function Tooltip({ x, y, title, value, width }) {
  const left = Math.min(Math.max(x, 70), width - 70);
  return (
    <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-navy-900 px-2.5 py-1.5 text-center text-white shadow-lg" style={{ left, top: y - 8 }}>
      <div className="text-[11px] text-slate-300">{title}</div>
      <div className="text-[13px] font-semibold tnum">{value}</div>
    </div>
  );
}

export function LineChart({ data, x, y, format = moneyShort, height = 220, label }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { l: 56, r: 12, t: 16, b: 28 };
  const max = niceMax(Math.max(...data.map((d) => d[y])));
  const iw = Math.max(10, width - pad.l - pad.r);
  const ih = height - pad.t - pad.b;
  const px = (i) => pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const py = (v) => pad.t + ih - (v / max) * ih;
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${px(i)},${py(d[y])}`).join(' ');
  const area = `${path} L${px(data.length - 1)},${pad.t + ih} L${px(0)},${pad.t + ih} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - pad.l) / iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };
  return (
    <div ref={ref} className="relative w-full min-w-0 overflow-hidden" role="img" aria-label={label}>
      <svg width={width} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} className="block">
        <defs>
          <linearGradient id="lc-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1B5CFF" stopOpacity=".16" /><stop offset="1" stopColor="#1B5CFF" stopOpacity="0" /></linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={py(t)} y2={py(t)} stroke="#E3E8EF" strokeDasharray={t ? '3 4' : ''} />
            <text x={pad.l - 10} y={py(t)} dy="0.32em" textAnchor="end" className="fill-slate-400 text-[11px] tnum">{format(t)}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <text key={d[x]} x={px(i)} y={height - 8} textAnchor="middle" className="fill-slate-500 text-[11px]">{d[x]}</text>
        ))}
        <path d={area} fill="url(#lc-fill)" />
        <path d={path} fill="none" stroke="#1B5CFF" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hover != null && (
          <g>
            <line x1={px(hover)} x2={px(hover)} y1={pad.t} y2={pad.t + ih} stroke="#94A3B8" strokeDasharray="3 3" />
            <circle cx={px(hover)} cy={py(data[hover][y])} r="5" fill="#1B5CFF" stroke="white" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover != null && <Tooltip x={px(hover)} y={py(data[hover][y])} title={data[hover][x]} value={format(data[hover][y])} width={width} />}
    </div>
  );
}

export function BarChart({ data, x, y, format = (v) => v.toLocaleString('es-CO'), height = 220, label }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { l: 40, r: 8, t: 16, b: 28 };
  const max = niceMax(Math.max(...data.map((d) => d[y])));
  const iw = Math.max(10, width - pad.l - pad.r);
  const ih = height - pad.t - pad.b;
  const slot = iw / data.length;
  const bw = Math.min(28, slot * 0.6);
  const py = (v) => pad.t + ih - (v / max) * ih;
  return (
    <div ref={ref} className="relative w-full min-w-0 overflow-hidden" role="img" aria-label={label}>
      <svg width={width} height={height} className="block" onMouseLeave={() => setHover(null)}>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={py(t * max)} y2={py(t * max)} stroke="#E3E8EF" strokeDasharray={t ? '3 4' : ''} />
            <text x={pad.l - 8} y={py(t * max)} dy="0.32em" textAnchor="end" className="fill-slate-400 text-[11px] tnum">{format(t * max)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx0 = pad.l + slot * i + slot / 2;
          const h = Math.max(2, (d[y] / max) * ih);
          const top = pad.t + ih - h;
          return (
            <g key={d[x]} onMouseEnter={() => setHover(i)}>
              <rect x={pad.l + slot * i} y={pad.t} width={slot} height={ih} fill="transparent" />
              <path d={`M${cx0 - bw / 2},${pad.t + ih} V${top + 4} q0,-4 4,-4 h${bw - 8} q4,0 4,4 V${pad.t + ih} Z`} fill={hover === i ? '#1447CC' : '#1B5CFF'} />
              <text x={cx0} y={height - 8} textAnchor="middle" className="fill-slate-500 text-[11px]">{d[x]}</text>
            </g>
          );
        })}
      </svg>
      {hover != null && <Tooltip x={pad.l + slot * hover + slot / 2} y={py(data[hover][y])} title={data[hover][x]} value={format(data[hover][y])} width={width} />}
    </div>
  );
}

// Horizontal ranked bars with direct labels. Good for "top N" and shares.
export function HBarList({ data, format = moneyShort, share }) {
  const max = Math.max(...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ul className="space-y-3.5">
      {data.map((d) => (
        <li key={d.name} className="group" title={`${d.name}: ${format(d.value)}`}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-ink">{d.name}</span>
            <span className="shrink-0 tnum text-slate-600">
              {format(d.value)}{share && <span className="ml-2 text-slate-400">{Math.round((d.value / total) * 100)}%</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-mist">
            <div className="h-2 rounded-full bg-signal transition-[width] duration-500 group-hover:bg-signal-700" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function useDebounced(value, ms = 200) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
