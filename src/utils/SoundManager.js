import { SOUND_FILES, SE_IDS } from '../constants/sounds';

/**
 * SoundManager - ゲームの音響を管理するシングルトンクラス
 * Audio APIを使用してBGMとSEを制御します。
 */
class SoundManager {
  constructor() {
    this.bgmVolume = 0.5;
    this.seVolume = 0.7;
    this.bgmMuted = false;
    this.seMuted = false;

    this.currentBGM = null;
    this.currentBGMId = null;
    this.audioContext = null;
    this.sePool = {}; // SE再生用のキャッシュプール
    this.maxPoolSize = 4; // 同一SEの最大同時プール数
  }

  /** AudioContextの初期化（ブラウザの制限によりユーザー操作後に必要） */
  initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /** 音響設定の更新 */
  updateSettings(settings) {
    if (!settings) return;
    this.bgmVolume = settings.bgmVolume ?? this.bgmVolume;
    this.seVolume = settings.seVolume ?? this.seVolume;
    this.bgmMuted = settings.bgmMuted ?? this.bgmMuted;
    this.seMuted = settings.seMuted ?? this.seMuted;

    // 現在再生中のBGMに即時反映
    if (this.currentBGM) {
      this.currentBGM.volume = this.bgmMuted ? 0 : this.bgmVolume;
    }
  }

  /**
   * BGMの再生
   */
  playBGM(id, loop = true) {
    if (this.currentBGMId === id) return;

    this.stopBGM();

    const path = SOUND_FILES[id];
    if (!path) return;

    try {
      const audio = new Audio(path);
      audio.loop = loop;
      audio.volume = this.bgmMuted ? 0 : this.bgmVolume;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          // Fallback for BGM is not implemented (requires complex synth)
          console.warn(`BGM play failed for ${id}:`, e.message);
        });
      }
      this.currentBGM = audio;
      this.currentBGMId = id;
    } catch (e) {
      console.error(`BGM creation failed for ${id}:`, e);
    }
  }

  /** BGMの停止 */
  stopBGM() {
    if (this.currentBGM) {
      this.currentBGM.pause();
      this.currentBGM.currentTime = 0;
      this.currentBGM = null;
      this.currentBGMId = null;
    }
  }

  /**
   * SEの再生
   * ファイルがない場合は電子音を生成して鳴らします。
   */
  playSE(id, pitch = 1.0) {
    if (this.seMuted) return;

    const path = SOUND_FILES[id];
    if (!path) return;

    this.initAudioContext();

    try {
      if (!this.sePool[id]) {
        this.sePool[id] = [];
      }

      const pool = this.sePool[id];
      let audio = null;

      // 1. 再生中ではない（停止している）オーディオを探す
      audio = pool.find(a => a.paused || a.ended);

      // 2. 見つからず、プールサイズに空きがあれば新規作成
      if (!audio && pool.length < this.maxPoolSize) {
        audio = new Audio(path);
        pool.push(audio);
      }

      // 3. それでも見つからない（すべて再生中かつプール満杯）場合、最も古い（最初の）オーディオを再利用
      if (!audio && pool.length > 0) {
        audio = pool[0];
        audio.pause();
      }

      if (audio) {
        audio.volume = this.seVolume;
        audio.playbackRate = pitch;
        audio.currentTime = 0; // 頭出し
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // ロード失敗時（ファイルがない場合）に電子音でフォールバック
            this.playSynthSE(id, pitch);
          });
        }
      } else {
        // 万が一のフォールバック
        audio = new Audio(path);
        pool.push(audio);
        audio.volume = this.seVolume;
        audio.playbackRate = pitch;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            this.playSynthSE(id, pitch);
          });
        }
      }
    } catch {
      this.playSynthSE(id, pitch);
    }
  }

  /**
   * Web Audio APIを使用して電子音を生成
   * ファイルがないときの手触り確認用
   */
  playSynthSE(id, pitch = 1.0) {
    if (!this.audioContext || this.seMuted) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    let duration = 0.1;
    let freq = 440 * pitch;
    let type = 'sine';

    // IDに応じた音色の設定
    switch (id) {
      case SE_IDS.DRAG_START:
        freq = 330 * pitch;
        duration = 0.05;
        break;
      case SE_IDS.DRAG_END:
        freq = 440 * pitch;
        duration = 0.08;
        break;
      case SE_IDS.MATCH_NORMAL:
        freq = 523 * pitch;
        duration = 0.15;
        type = 'triangle';
        break;
      case SE_IDS.GOAL_REACHED:
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.exponentialRampToValueAtTime(1046, now + 0.3);
        duration = 0.4;
        type = 'square';
        break;
      case SE_IDS.ERROR:
        freq = 110 * pitch;
        duration = 0.2;
        type = 'sawtooth';
        break;
      case SE_IDS.MATCH_STAR:
        freq = 880 * pitch;
        duration = 0.1;
        type = 'triangle';
        break;
      default:
        break;
    }

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    
    gain.gain.setValueAtTime(this.seVolume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  playConfirm() { this.playSE(SE_IDS.DRAG_END); }
  playCancel() { this.playSE(SE_IDS.ERROR); }
  playHover() { this.playSE(SE_IDS.UI_HOVER, 1.2); }
}

const soundManager = new SoundManager();
export default soundManager;
