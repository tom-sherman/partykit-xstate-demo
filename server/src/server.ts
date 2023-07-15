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

    if (initialState) {
      connection.send(
        JSON.stringify({
          type: "snapshot",
          state: initialState,
        })
      );
    }

    const actor = interpret(donutMachine, {
      state: initialState,
    }).start();

    actor.subscribe(async (state) => {
      console.log("new state value", JSON.stringify(state?.value));
      // Persisting hangs forever?
      // await room.storage.put("state", state);
      room.broadcast(
        JSON.stringify({
          type: "snapshot",
          state: actor.getPersistedState(),
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
