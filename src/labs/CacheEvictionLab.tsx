import { useIndependentLab } from "./LabSettingsProvider";
import { ToolPanel } from "../ToolPanel";
import { LabRange, LabChoice } from "./LabControls";
import { EventInspector } from "./EventInspector";
import { evictCache, CACHE_KEYS } from "./cache-eviction";
export function CacheEvictionLab({ active }: { active: boolean }) {
  const [{ capacity, policy }, update] = useIndependentLab("eviction");
  const run = evictCache(capacity, policy);
  return (
    <ToolPanel title="Which item should leave a full cache?">
      <div className="tool-content">
        <p>
          A tiny cache receives <code>{CACHE_KEYS.join(" → ")}</code>. FIFO
          evicts the oldest insertion. LRU updates recency on every hit and
          evicts the least recently used item.
        </p>
        <div className="lab-fields">
          <LabRange
            label="Cache slots"
            value={capacity}
            min={2}
            max={5}
            onChange={(value) => update({ capacity: value })}
          />
          <LabChoice
            label="Eviction policy"
            value={policy}
            options={[
              { value: "fifo", label: "First in, first out" },
              { value: "lru", label: "Least recently used" },
            ]}
            onChange={(value) => update({ policy: value })}
          />
        </div>
        <div className="lab-outcome">
          <span>Cache work</span>
          <strong>
            {run.hits} hits · {run.misses} origin reads
          </strong>
          <p>
            A hit can change which item is evicted next. Inspect the ordered
            cache contents after each read.
          </p>
        </div>
        <div className="policy-comparison">
          <div>
            <span>FIFO</span>
            <strong>{evictCache(capacity, "fifo").hits} hits</strong>
          </div>
          <div>
            <span>LRU</span>
            <strong>{evictCache(capacity, "lru").hits} hits</strong>
          </div>
          <div>
            <span>Capacity</span>
            <strong>{capacity} items</strong>
          </div>
        </div>
        <EventInspector
          active={active}
          unit="read"
          events={run.rows.map((r) => ({
            at: r.index + 1,
            title: `${r.key}: ${r.hit ? "cache hit" : "origin read"}`,
            detail: `${r.evicted ? `${r.evicted} was evicted. ` : ""}Cache from next eviction candidate to newest: ${r.cache.join(" → ")}.`,
            tone: r.hit ? "good" : "warning",
          }))}
        />
        <p className="lab-assumptions">
          Cache starts empty. Every key occupies one slot, origin reads always
          succeed, and values never expire or change. Policies share the same
          request sequence; neither is claimed to win on every workload.
        </p>
      </div>
    </ToolPanel>
  );
}
