/** 터치 버튼·캔버스 밖에서도 Web Audio 잠금 해제 */
export const AUDIO_UNLOCK_EVENT = 'mario-audio-unlock';

export function requestAudioUnlock(): void {
  window.dispatchEvent(new CustomEvent(AUDIO_UNLOCK_EVENT));
}
