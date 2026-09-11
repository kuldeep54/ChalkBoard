type Listener = () => void;

const listeners = new Set<Listener>();

export const onAuthLogout = (fn: Listener): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const emitAuthLogout = (): void => {
  listeners.forEach((fn) => fn());
};