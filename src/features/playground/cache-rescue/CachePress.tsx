import {
  rescueState,
  type RescueRequest,
  type RescueSettings,
  type rescueSnapshot,
} from "../../../domain/playground/cache-rescue";
import art from "./press-art.json";

function position(x: number, y: number, z: number) {
  const [a, b, c] = art.axes;
  return `translate(${a[0] * x + b[0] * y + c[0] * z} ${a[1] * x + b[1] * y + c[1] * z})`;
}

const staticArt = {
  base: <g dangerouslySetInnerHTML={{ __html: art.groups.base }} />,
  frame: <g dangerouslySetInnerHTML={{ __html: art.groups.frame }} />,
  head: <g dangerouslySetInnerHTML={{ __html: art.groups.head }} />,
  front: <g dangerouslySetInnerHTML={{ __html: art.groups.front }} />,
  card: <g dangerouslySetInnerHTML={{ __html: art.groups.card }} />,
};

type Props = {
  run: RescueRequest[];
  time: number;
  settings: RescueSettings;
  counts: ReturnType<typeof rescueSnapshot>;
};

export function CachePress({ run, time, settings, counts }: Props) {
  const progress = Math.max(0, Math.min(1, time / settings.originMs));
  const stroke = -14 * Math.sin(progress * Math.PI);
  const states = ["pending", "querying", "waiting", "done"] as const;
  const cards = states.map((state) => ({
    state,
    requests: run.filter((request) => rescueState(request, time) === state),
  }));

  return (
    <div className="cache-press">
      <div className="cache-press-heading">
        <span>FIG. 01</span>
        <strong>The single-flight press</strong>
      </div>
      <div
        className="cache-stage cache-press-stage"
        role="img"
        aria-label={`Isometric duplicating press. ${counts.queries} database ${counts.queries === 1 ? "read" : "reads"}, ${counts.waiting} requests sharing the fetch, ${counts.done} of ${settings.requests} replies delivered.`}
      >
        <svg viewBox="0 0 600 390" aria-hidden="true" focusable="false">
          <ellipse
            className="press-shadow"
            cx="300"
            cy="305"
            rx="210"
            ry="48"
          />
          {staticArt.base}
          {staticArt.frame}
          {cards.map(({ state, requests }) => (
            <g key={state} className={`press-cards press-${state}`}>
              {requests.map((request, index) => (
                <g
                  key={request.id}
                  data-request={request.id}
                  data-state={state}
                  transform={
                    state === "pending"
                      ? position(-91, 0, 5 + index * 0.4)
                      : state === "querying"
                        ? position(2, -4, 14 + index * 0.4)
                        : state === "waiting"
                          ? position(2, 32, 5 + index * 0.4)
                          : position(91, 0, 5 + index * 0.4)
                  }
                >
                  {staticArt.card}
                </g>
              ))}
            </g>
          ))}
          <g data-part="press-head" transform={position(0, 0, stroke)}>
            {staticArt.head}
          </g>
          {staticArt.front}
        </svg>
      </div>
      <dl className="cache-press-readouts" aria-label="Press readouts">
        <div>
          <dt>Requests</dt>
          <dd>{settings.requests}</dd>
        </div>
        <div>
          <dt>Origin reads</dt>
          <dd>{counts.queries}</dd>
        </div>
        <div>
          <dt>Waiting</dt>
          <dd>{counts.waiting}</dd>
        </div>
        <div>
          <dt>Delivered</dt>
          <dd>{counts.done}</dd>
        </div>
      </dl>
      <p className="cache-press-note">
        Cards are requests. The press makes the master; the right tray collects
        replies. Share a read, not the effort of making it again.
      </p>
      <div className="cache-press-footer">
        <span>Use the playback controls to run the press</span>
        <span>
          {time >= settings.originMs ? "MASTER READY" : "NO CACHED MASTER"}
        </span>
      </div>
    </div>
  );
}
