import { useNavigate, useLocation } from 'react-router-dom';
import { HandIcon } from './HandIcon';
import { Scribble } from './Scribble';

const TABS = [
  { id: 'home', icon: 'sun', label: 'Hoy', path: '/' },
  { id: 'hist', icon: 'clock', label: 'Histórico', path: '/history' },
  { id: 'pts', icon: 'star', label: 'Puntos', path: '/points' },
  { id: 'me', icon: 'heart', label: 'Yo', path: '/me' },
];

export function TabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const active =
    pathname === '/' ? 'home'
    : pathname.startsWith('/history') ? 'hist'
    : pathname.startsWith('/points') ? 'pts'
    : pathname.startsWith('/me') ? 'me'
    : 'home';

  return (
    <div className="flex justify-around bg-paper shrink-0" style={{ borderTop: '1.8px solid var(--ink)', padding: '8px 12px 18px' }}>
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-[2px] bg-transparent border-none cursor-pointer font-hand text-ink ${isActive ? 'opacity-100' : 'opacity-45'}`}
            style={{ padding: '2px 8px', WebkitTapHighlightColor: 'transparent' }}
          >
            <HandIcon kind={tab.icon} size={20} />
            <span style={{ fontSize: 11 }}>{tab.label}</span>
            {isActive && <Scribble width={28} strokeWidth={2} />}
          </button>
        );
      })}
    </div>
  );
}
