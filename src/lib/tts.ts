/**
 * Play text as speech using ElevenLabs TTS via edge function.
 * Returns a promise that resolves when playback finishes.
 */
export async function speakText(text: string, voiceId?: string): Promise<void> {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ text, voiceId }),
    });

    if (!response.ok) {
      console.warn('TTS request failed:', response.status);
      return; // Fail silently — text transcript still shows
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise<void>((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        resolve(); // Don't block on audio errors
      };
      audio.play().catch(() => resolve());
    });
  } catch (err) {
    console.warn('TTS playback error:', err);
    // Fail silently
  }
}
