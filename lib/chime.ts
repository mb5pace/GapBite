/**
 * The soft sound for a new order. Made with the Web Audio API, so there is no
 * audio file to load. Browsers only allow sound after the person has touched the
 * page once, so unlockAudio() runs on the first tap and play does nothing before that.
 * Browser only.
 */
import { CHIME } from "./config";

let context: AudioContext | null = null;

/** Call from a tap or key press. Safe to call many times. Resolves true once sound is allowed. */
export async function unlockAudio(): Promise<boolean> {
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") await context.resume();
    return context.state === "running";
  } catch {
    // No audio on this device. The queue still works.
    return false;
  }
}

export function playChime(): void {
  try {
    if (!context || context.state !== "running") return;
    const start = context.currentTime;
    const noteSec = CHIME.noteMs / 1000;
    CHIME.notesHz.forEach((hz, i) => {
      const osc = context!.createOscillator();
      const gain = context!.createGain();
      osc.type = "sine";
      osc.frequency.value = hz;
      const at = start + i * noteSec;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(CHIME.volume, at + 0.02);
      gain.gain.linearRampToValueAtTime(0, at + noteSec);
      osc.connect(gain).connect(context!.destination);
      osc.start(at);
      osc.stop(at + noteSec + 0.02);
    });
  } catch {
    // Ignore: a missed chime is not worth an error.
  }
}
