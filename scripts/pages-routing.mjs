// Restored before Expo initializes. Only same-origin paths can be restored.
export const restoreRoute = `(()=>{const u=new URL(location.href);const p=u.searchParams.get('__omnilient_route');if(p&&p.startsWith('/')&&!p.startsWith('//')){const t=new URL(p,location.origin);if(t.origin===location.origin)history.replaceState(null,'',t.pathname+t.search+t.hash);}})();`;
export const redirectRoute = `location.replace('/?__omnilient_route='+encodeURIComponent(location.pathname+location.search+location.hash));`;
