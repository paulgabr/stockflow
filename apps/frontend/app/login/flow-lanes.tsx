import styles from "./login.module.css";

type Crate = { width: number; tone: "light" | "mid" | "dark" };

const COPIES = 6;

const lanes: { crates: Crate[]; duration: number; reverse?: boolean }[] = [
  {
    duration: 38,
    crates: [
      { width: 56, tone: "light" },
      { width: 88, tone: "mid" },
      { width: 40, tone: "dark" },
      { width: 72, tone: "light" },
      { width: 48, tone: "mid" },
      { width: 96, tone: "dark" },
    ],
  },
  {
    duration: 30,
    reverse: true,
    crates: [
      { width: 80, tone: "mid" },
      { width: 44, tone: "light" },
      { width: 64, tone: "dark" },
      { width: 52, tone: "mid" },
      { width: 100, tone: "light" },
    ],
  },
  {
    duration: 44,
    crates: [
      { width: 40, tone: "dark" },
      { width: 76, tone: "light" },
      { width: 60, tone: "mid" },
      { width: 92, tone: "dark" },
      { width: 48, tone: "light" },
      { width: 68, tone: "mid" },
    ],
  },
  {
    duration: 34,
    reverse: true,
    crates: [
      { width: 64, tone: "light" },
      { width: 52, tone: "dark" },
      { width: 84, tone: "mid" },
      { width: 44, tone: "light" },
      { width: 72, tone: "dark" },
    ],
  },
];

export function FlowLanes() {
  return (
    <div className={styles.lanes} aria-hidden>
      <div className={styles.checkpoint} />
      {lanes.map((lane, laneIndex) => (
        <div key={laneIndex} className={styles.lane}>
          <div
            className={styles.track}
            data-reverse={lane.reverse || undefined}
            style={{ animationDuration: `${lane.duration * (COPIES / 2)}s` }}
          >
            {Array.from({ length: COPIES }, (_, copy) =>
              lane.crates.map((crate, crateIndex) => (
                <span
                  key={`${copy}-${crateIndex}`}
                  className={styles.crate}
                  data-tone={crate.tone}
                  style={{ width: crate.width }}
                />
              )),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
