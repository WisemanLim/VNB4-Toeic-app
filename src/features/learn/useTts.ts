import { Audio } from "expo-av";
import { useEffect, useRef } from "react";

/**
 * Plays remote audio clips, unloading the previous sound first.
 * Cleans up on unmount. (Previously the screen shadowed the `Audio`
 * import with a local interface and fell back to `(Audio as any)`.)
 */
export function useTts() {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // iOS honors the hardware mute switch by default, so playback is silent
    // on a muted device. Opt into playing in silent mode (and ducking other
    // audio) so the pronunciation/shadowing clips are always audible.
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    }).catch(() => {
      // best-effort; playback still works when the device isn't muted
    });

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  async function play(url?: string) {
    if (!url) return;
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true },
    );
    soundRef.current = sound;
  }

  return { play };
}
