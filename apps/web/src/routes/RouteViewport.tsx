import { useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

export function RouteViewport() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return <Outlet />;
}
