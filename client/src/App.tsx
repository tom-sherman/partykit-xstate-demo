import "./App.css";
import PartySocket from "partysocket";
import { useParty } from "./socket";

const socket = new PartySocket({
  host: "localhost:1999",
  room: "test",
});

function App() {
  const { events } = useParty(socket);

  const nextEvents = [
    ...new Set([
      "NEXT",
      ...(((events.at(-1) as any)?.nextEvents as string[]) ?? []),
    ]),
  ];

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
              <input type="radio" name="event" value={event} /> {event}
            </div>
          ))}
        </fieldset>
        <button type="submit">Send</button>
      </form>
      <ul>
        {events.map((event, i) => (
          <li key={i}>
            <pre>{JSON.stringify(event)}</pre>
          </li>
        ))}
      </ul>
    </>
  );
}

export default App;
