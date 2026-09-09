import { EvolvingDroneScore } from './score.js';
import { Fieldscape } from './fieldscape.js';
/* Original field effects with an evolving, independently mixed synth score.
   One AudioContext is created on a play gesture, never on page load. */
export class FieldAudio {
  constructor(){this.ctx=null;this.volume=.36;this.muted=false;this.active=false;this.paused=false;this.ambience=.58;this.music=.70;this.breathing=.45;this.fieldscape=null;this.mixClock=0;this.voices=[];this.suspendTimer=null;this.score=null;}
  start(){try{
    if(!this.ctx){
      const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      this.ctx=new Audio();const c=this.ctx;
      this.bus=c.createGain();this.bus.gain.value=0;
      const limiter=c.createDynamicsCompressor();limiter.threshold.value=-8;limiter.knee.value=8;limiter.ratio.value=10;limiter.attack.value=.008;limiter.release.value=.18;
      this.bus.connect(limiter);limiter.connect(c.destination);
      this.ambienceBus=c.createGain();this.ambienceBus.gain.value=this.ambience;this.ambienceBus.connect(this.bus);
      this.musicBus=c.createGain();this.musicBus.gain.value=this.music;this.musicBus.connect(this.bus);
      this.breathBus=c.createGain();this.breathBus.gain.value=this.breathing;this.breathBus.connect(this.bus);
      this.wind();this.drone();
    }
    this.active=true;this.setPaused(false);
  }catch(e){console.info('Audio unavailable:',e.message);this.score?.dispose();this.fieldscape?.dispose();this.ctx?.close().catch(()=>{});this.ctx=null;this.active=false;}}
  setMuted(value){this.muted=!!value;this.masterLevel();}
  setPaused(value){
    this.paused=!!value;clearTimeout(this.suspendTimer);this.suspendTimer=null;this.masterLevel();
    if(!this.ctx)return;
    if(this.paused){
      // Fade first, then freeze the audio clock and release audio processing.
      const c=this.ctx;this.suspendTimer=setTimeout(()=>{if(this.paused&&c.state==='running')c.suspend().then(()=>{if(!this.paused)c.resume().catch(()=>{});}).catch(()=>{});},850);
    }else this.ctx.resume().catch(()=>{});
  }
  masterLevel(){if(this.bus&&this.ctx)this.bus.gain.setTargetAtTime(this.muted||this.paused?0:this.volume,this.ctx.currentTime,.09);}
  setAmbience(value){this.ambience=Math.max(0,Math.min(1,Number(value)||0));if(this.ambienceBus)this.ambienceBus.gain.setTargetAtTime(this.ambience,this.ctx.currentTime,.2);}
  setMusic(value){const v=Number(value);this.music=Number.isFinite(v)?Math.max(0,Math.min(1,v)):.70;if(this.musicBus)this.musicBus.gain.setTargetAtTime(this.music,this.ctx.currentTime,.35);}
  setBreathing(value){const v=Number(value);this.breathing=Number.isFinite(v)?Math.max(0,Math.min(1,v)):.45;if(this.breathBus)this.breathBus.gain.setTargetAtTime(this.breathing,this.ctx.currentTime,.25);}
  resetMotion(){this.fieldscape?.resetMotion();}
  wind(){this.fieldscape=new Fieldscape(this.ctx,this.ambienceBus,this.breathBus);this.windGain=this.fieldscape.windGain;this.windFilter=this.fieldscape.windFilter;}
  drone(){this.score=new EvolvingDroneScore(this.ctx,this.musicBus);this.voices=this.score.voices;this.tensionGain=this.score.tensionGain;this.tensionFilter=this.score.tensionFilter;}
  update(dt,{tension=0,indoor=false,time=0,speed=0,stamina=100,crouching=false}={}){
    if(!this.ctx||!this.active||this.paused)return;this.mixClock+=dt;if(this.mixClock<.12)return;this.mixClock=0;
    this.score?.update({tension,indoor});
    this.fieldscape?.update({speed,stamina,crouching,indoor});
  }
  duckScore(strength=.3,seconds=.5){if(this.active&&!this.paused){this.score?.duck(strength,seconds);this.fieldscape?.duck(strength*.8,seconds);}}
  tone(freq,duration=.14,type='sine',gain=.1,end=freq){if(!this.ctx||!this.active||this.paused)return;const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.bus);o.start();o.stop(t+duration);o.onended=()=>{o.disconnect();g.disconnect();};}
  noise(duration=.1,gain=.25,freq=2000){if(!this.ctx||!this.active||this.paused)return;const c=this.ctx,t=c.currentTime,n=Math.floor(c.sampleRate*duration),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=b;f.type='lowpass';f.frequency.value=freq;g.gain.value=gain;s.connect(f);f.connect(g);g.connect(this.bus);s.start();s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();};}
  shoot(){this.duckScore(.32,.42);this.tone(230,.13,'sawtooth',.17,50);this.tone(1300,.055,'sine',.14,260);this.noise(.065,.28,4100);}
  hit(){this.tone(760,.09,'triangle',.13,290);}
  kill(){this.tone(430,.23,'square',.06,75);this.noise(.28,.23,900);}
  step(sprint=false){this.noise(.09,.06,600);this.tone(72,.055,'sine',.11,40);if(this.active&&!this.paused)this.fieldscape?.step(sprint);}
  reload(){this.noise(.13,.16,2400);this.tone(380,.07,'triangle',.08,150);}
  confirm(){this.duckScore(.42,.8);[520,650,820].forEach((f,i)=>setTimeout(()=>this.tone(f,.2,'sine',.1),i*110));}
  alert(){this.duckScore(.4,.55);this.tone(660,.15,'triangle',.09,440);}
  scan(level=1){this.duckScore(.4,.5);this.tone(520+level*140,.12,'sine',.08,420+level*100);}
  alarm(){this.duckScore(.48,.95);this.tone(220,.65,'triangle',.12,330);this.tone(660,.45,'sine',.045,440);}
}
