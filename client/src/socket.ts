import type PartySocket from "partysocket";
import { useMemo, useSyncExternalStore } from "react";

interface State {
  events: unknown[];
}

const store = new WeakMap<PartySocket, State>();

function getServerSnapshot() {
  return {
    events: [],
  };
}

const defaultState = { events: [] };

export function useParty(socket: PartySocket) {
  const storeInstance = useMemo(
    () => ({
      subscribe: (onStoreChange: () => void) => {
        if (!store.has(socket)) {
          store.set(socket, { ...defaultState });
        }

        const onMessage = (event: MessageEvent) => {
          const state = store.get(socket)!;
          store.set(socket, {
            ...state,
            events: [...state.events, JSON.parse(event.data)],
          });
          console.log("new event", JSON.stringify(event.data));
          onStoreChange();
        };
        socket.addEventListener("message", onMessage);

        return () => {
          socket.removeEventListener("message", onMessage);
        };
      },

      getSnapshot: () => {
        const state = store.get(socket);
        return state;
      },
    }),
    [socket]
  );

  const state = useSyncExternalStore(
    storeInstance.subscribe,
    storeInstance.getSnapshot,
    getServerSnapshot
  );
  console.log("got state", state);

  return {
    ...defaultState,
    ...state,
  };
}
