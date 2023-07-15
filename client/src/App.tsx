import "./App.css";
import PartySocket from "partysocket";
import { useParty } from "./socket";
import { useState } from "react";

function App() {
  // Get a stable reference to socket across saves in dev mode
  // Kinda hacky lol, in the real world we could just define this at the module level
  const [socket] = useState(
    () =>
      new PartySocket({
        host: "localhost:1999",
        room: "test",
      })
  );
  const { events } = useParty(socket);

  const nextEvents = (((events.at(-1) as any)?.nextEvents ?? []) as string[])
    // // Crudely filters out internal xstate events such as done.foo on nested states
    .filter((e) => !e.startsWith("done."));
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const event = new FormData(e.currentTarget).get("event")!.toString();
          socket.send(
            JSON.stringify({
              type: event,
            })
          );
        }}
      >
        <fieldset>
          <legend>Event name</legend>
          {nextEvents.map((event) => (
            <div key={event}>
              <label>
                <input type="radio" name="event" value={event} /> {event}
              </label>
            </div>
          ))}
        </fieldset>
        <button type="submit">Send</button>
      </form>
      <ul>
        {events
          .map((event, i) => (
            <li key={i}>
              {i === events.length - 1 && "Current: "}
              <code>{JSON.stringify((event as any).state.value)}</code>
            </li>
          ))
          .reverse()}
      </ul>
    </>
  );
}

export default App;
