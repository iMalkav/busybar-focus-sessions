import {
  num,
  flag,
  duration,
  App,
  MINUTE,
  type Settings,
  type View,
} from "./lib.ts";

export class AppModel extends App {
  phase = "Work";
  running = false;
  remaining = 0;
  last = 0;
  rounds = 0;
  constructor(s: Settings, saved: Settings, now: number) {
    super(s, saved, now);
    this.remaining = num(s, "work_minutes", 25) * MINUTE;
  }
  key(key: string, _delta: number, now: number): boolean {
    this.tick(now);
    if (key === "ok") {
      if (this.phase === "Done") {
        this.rounds = 0;
        this.phase = "Work";
        this.remaining = num(this.settings, "work_minutes", 25) * MINUTE;
      }
      this.running = !this.running;
      this.last = now;
    }
    if (
      key === "back" &&
      (this.running ||
        this.remaining !== num(this.settings, "work_minutes", 25) * MINUTE)
    ) {
      this.running = false;
      this.rounds = 0;
      this.phase = "Work";
      this.remaining = num(this.settings, "work_minutes", 25) * MINUTE;
      return true;
    }
    return false;
  }
  tick(now: number): void {
    if (this.running)
      this.remaining = Math.max(
        0,
        this.remaining - Math.max(0, now - this.last),
      );
    this.last = now;
    if (!this.running || this.remaining > 0) return;
    this.notify();
    if (this.phase === "Work") {
      this.rounds++;
      this.phase =
        this.rounds >= num(this.settings, "rounds", 4) ? "Done" : "Break";
    } else this.phase = "Work";
    this.remaining =
      this.phase === "Done"
        ? 0
        : num(
            this.settings,
            this.phase === "Work" ? "work_minutes" : "break_minutes",
          ) * MINUTE;
    this.running = this.phase !== "Done" && flag(this.settings, "auto_next");
  }
  view(_now: number): View {
    const total =
      num(
        this.settings,
        this.phase === "Work" ? "work_minutes" : "break_minutes",
        1,
      ) * MINUTE;
    return {
      title: this.phase,
      value: duration(this.remaining),
      rows: [
        "Round " + this.rounds + "/" + num(this.settings, "rounds"),
        this.running ? "FOCUS IN PROGRESS" : "PAUSED",
      ],
      progress: this.phase === "Done" ? 1 : 1 - this.remaining / total,
      hint: "OK pause/start / Back reset",
      color: this.phase === "Work" ? "#FF875FFF" : "#6AE4A2FF",
    };
  }
}
