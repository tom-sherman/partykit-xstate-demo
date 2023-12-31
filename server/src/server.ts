import type {
  PartyKitServer,
  PartyKitRoom,
  PartyKitContext,
  PartyKitConnection,
} from "partykit/server";
import { interpret } from "xstate";
import { donutMachine } from "./donutMachine";

export default {
  async onConnect(
    connection: PartyKitConnection,
    room: PartyKitRoom,
    ctx: PartyKitContext
  ) {
    console.log("new connection", connection.id);
    const initialState = (await room.storage.get("state")) ?? undefined;

    const actor = interpret(donutMachine, {
      state: initialState,
    }).start();

    connection.send(
      JSON.stringify({
        type: "snapshot",
        state: initialState,
        nextEvents: actor.getSnapshot().nextEvents,
      })
    );

    actor.subscribe(async (state) => {
      console.log("new state value", JSON.stringify(state?.value));
      const persistedState = actor.getPersistedState();
      await room.storage.put(
        "state",
        // PersistedState is not serializable, so we need to clone it
        JSON.parse(JSON.stringify(persistedState))
      );
      room.broadcast(
        JSON.stringify({
          type: "snapshot",
          state: persistedState,
          nextEvents: state.nextEvents,
        }),
        []
      );
    });

    connection.addEventListener("message", (event) => {
      const parsedEvent = parseEvent(event.data);
      console.log("received event", parsedEvent);
      actor.send(parsedEvent);
    });
  },
} satisfies PartyKitServer;

const decoder = new TextDecoder();
function parseEvent(data: string | ArrayBuffer): any {
  const dataString = typeof data === "string" ? data : decoder.decode(data);
  return JSON.parse(dataString);
}
