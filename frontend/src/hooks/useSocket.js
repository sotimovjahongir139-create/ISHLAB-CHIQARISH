import { useEffect, useRef } from 'react';
import { getSocket } from '../websocket/socket';

const useSocket = (event, handler, deps = []) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const cb = (...args) => handlerRef.current(...args);
    socket.on(event, cb);
    return () => socket.off(event, cb);
  }, [event, ...deps]);
};

export default useSocket;
