import { useNavigate, useLocation } from 'react-router-dom';
import { HandIcon } from './HandIcon';
import { useNavDirection } from '../../context/NavContext';

const TABS = [
  { id: 'home', icon: 'sun', label: 'Hoy', path: '/' },
  { id: 'hist', icon: 'clock', label: 'Histórico', path: '/history' },
  { id: 'idy', icon: 'identity', label: 'Identidad', path: '/identity' },
  { id: 'pts', icon: 'star', label: 'Puntos', path: '/points' },
  { id: 'me', icon: 'heart', label: 'Yo', path: '/me' },
];

export function TabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { setDirection } = useNavDirection(); // ref-based, always sync

  const activeId =
    pathname === '/' ? 'home'
    : pathname.startsWith('/history') ? 'hist'
    : pathname.startsWith('/identity') ? 'idy'
    : pathname.startsWith('/points') ? 'pts'
    : pathname.startsWith('/me') ? 'me'
    : 'home';

  const activeIndex = TABS.findIndex(t => t.id === activeId);

  return (
    <div
      className="tabbar-float absolute left-0 right-0 bottom-0 z-20"
      style={{ pointerEvents: 'none' }}
    >
      <nav
        className="relative flex"
        style={{
          pointerEvents: 'auto',
          margin: '0 14px calc(10px + env(safe-area-inset-bottom))',
          borderRadius: 'var(--radius-pill)',
          padding: 5,
          background: 'rgba(250, 246, 238, 0.45)',
          backdropFilter: 'blur(20px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
          border: '1px solid rgba(42, 42, 42, 0.08)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.55)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 5,
            bottom: 5,
            left: 5,
            width: `calc((100% - 10px) / ${TABS.length})`,
            transform: `translateX(${activeIndex * 100}%)`,
            transition: 'transform 0.45s cubic-bezier(0.3, 1.3, 0.4, 1)',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(42, 42, 42, 0.07)',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -1px 1px rgba(0, 0, 0, 0.04)',
          }}
        />
        {TABS.map((tab, idx) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (isActive) return;
                setDirection(idx > activeIndex ? 'right' : 'left');
                navigate(tab.path);
              }}
              className={`relative flex flex-col items-center bg-transparent border-none cursor-pointer font-hand text-ink ${isActive ? 'opacity-100' : 'opacity-45'}`}
              style={{ flex: 1, gap: 1, padding: '7px 0 5px', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation', transition: 'opacity 0.3s ease' }}
            >
              <HandIcon kind={tab.icon} size={20} />
              <span style={{ fontSize: 12 }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
