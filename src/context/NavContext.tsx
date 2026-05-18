import { createContext, useContext, useRef, useCallback, type ReactNode } from 'react';

export type NavDirection = 'left' | 'right' | 'up';

interface NavContextValue {
  getDirection: () => NavDirection;
  setDirection: (d: NavDirection) => void;
}

const NavContext = createContext<NavContextValue>({
  getDirection: () => 'up',
  setDirection: () => {},
});

export function NavProvider({ children }: { children: ReactNode }) {
  const dirRef = useRef<NavDirection>('up');
  const getDirection = useCallback(() => dirRef.current, []);
  const setDirection = useCallback((d: NavDirection) => { dirRef.current = d; }, []);
  return (
    <NavContext.Provider value={{ getDirection, setDirection }}>
      {children}
    </NavContext.Provider>
  );
}

export const useNavDirection = () => useContext(NavContext);
