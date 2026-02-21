let soundVolume = 0.5;
let voiceVolume = 0.5;

export const setSoundVolume = (vol: number) => {
  soundVolume = Math.max(0, Math.min(1, vol));
};

export const setVoiceVolume = (vol: number) => {
  voiceVolume = Math.max(0, Math.min(1, vol));
};

export const getSoundVolume = () => soundVolume;
export const getVoiceVolume = () => voiceVolume;

export const playSound = (type: 'deal' | 'play' | 'win' | 'fail' | 'bluff') => {
  if (soundVolume === 0) return;
  
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  
  // Apply global volume
  const masterGain = soundVolume;

  switch (type) {
    case 'deal':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.1 * masterGain, now);
      gain.gain.exponentialRampToValueAtTime(0.01 * masterGain, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    case 'play':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      gain.gain.setValueAtTime(0.1 * masterGain, now);
      gain.gain.exponentialRampToValueAtTime(0.01 * masterGain, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    case 'win':
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      osc.frequency.setValueAtTime(800, now + 0.2);
      gain.gain.setValueAtTime(0.1 * masterGain, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
    case 'fail':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.1 * masterGain, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
    case 'bluff':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
      gain.gain.setValueAtTime(0.1 * masterGain, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
      break;
  }
};

export const speak = (text: string, gender: 'male' | 'female' = 'female') => {
  if (voiceVolume === 0) return;
  if (!window.speechSynthesis) return;

  // Cancel previous speech to avoid queue buildup
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = voiceVolume;
  
  // Get available voices
  const voices = window.speechSynthesis.getVoices();
  
  // Try to find a good natural voice
  // Prefer "Google US English" or similar high-quality voices
  let selectedVoice = voices.find(v => v.name.includes('Google US English'));
  
  if (!selectedVoice) {
      // Fallback strategies
      if (gender === 'female') {
          selectedVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria'));
      } else {
          selectedVoice = voices.find(v => v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('Alex'));
      }
  }

  if (selectedVoice) {
      utterance.voice = selectedVoice;
  }

  // Adjust rate and pitch for more natural feel
  utterance.rate = 0.9 + Math.random() * 0.1; // Slight variation
  utterance.pitch = 1.0 + (Math.random() * 0.1 - 0.05);

  window.speechSynthesis.speak(utterance);
};
