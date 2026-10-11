import {
  rescueState,
  type RescueRequest,
  type RescueSettings,
  type rescueSnapshot,
} from "../../../domain/playground/cache-rescue";

type Props = {
  run: RescueRequest[];
  time: number;
  settings: RescueSettings;
  counts: ReturnType<typeof rescueSnapshot>;
};

export function CacheArena({ run, time, settings, counts }: Props) {
  return (
    <>
      <div className="cache-caption">
        <span>CACHE RESCUE</span>
        <span>
          {time >= settings.originMs ? "CACHE REFILLED" : "CACHE EMPTY"}
        </span>
      </div>
      <div
        className="cache-stage"
        role="img"
        aria-label={`${counts.queries} database ${counts.queries === 1 ? "read" : "reads"}, ${counts.waiting} requests sharing the fetch, ${counts.done} of ${settings.requests} replies delivered.`}
      >
        <div className="cache-station cache-arrivals">
          <span>THE CROWD</span>
          <strong>{settings.requests} requests</strong>
        </div>
        <div className="cache-station cache-database">
          <span>DATABASE</span>
          <strong>
            {counts.queries}
            <small> reads</small>
          </strong>
        </div>
        <div className="cache-station cache-wait">
          <span>SHARING</span>
          <strong>
            {counts.waiting}
            <small> waiting</small>
          </strong>
        </div>
        <div className="cache-station cache-replies">
          <span>DELIVERED</span>
          <strong>
            {counts.done}
            <small> / {settings.requests}</small>
          </strong>
        </div>
        {run.map((request, i) => {
          const state = rescueState(request, time);
          const x =
            state === "querying"
              ? 6 + (i % 6) * 5.8
              : state === "waiting"
                ? 59 + (i % 6) * 5.8
                : 22 + (i % 8) * 8;
          const y = state === "pending" ? 67 : state === "done" ? 281 : 177;
          return (
            <span
              key={request.id}
              aria-hidden="true"
              className={`cache-person is-${state}`}
              style={{
                left: `${x}%`,
                top:
                  y +
                  Math.floor(
                    i / (state === "waiting" || state === "querying" ? 6 : 8),
                  ) *
                    13,
              }}
            />
          );
        })}
      </div>
      <div className="cache-progress" aria-hidden="true">
        <span
          style={{ width: `${(counts.done / settings.requests) * 100}%` }}
        />
      </div>
    </>
  );
}
