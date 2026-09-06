const AUDIO={
  ctx:null,master:null,vol:0.6,muted:false,
  ensure(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
    if(!this.ctx){this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:this.vol;this.master.connect(this.ctx.destination);}
    if(this.ctx.state==='suspended')this.ctx.resume();return true;},
  setVol(v){this.vol=v;if(this.master)this.master.gain.value=this.muted?0:v;},
  setMuted(m){this.muted=m;if(this.master)this.master.gain.value=m?0:this.vol;},
  tone(type,f0,f1,dur,gain=0.16,delay=0){if(this.muted||!this.ensure())return;
    const t0=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(f0,t0);o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t0+dur);
    g.gain.setValueAtTime(gain,t0);g.gain.exponentialRampToValueAtTime(0.0008,t0+dur);
    o.connect(g);g.connect(this.master);o.start(t0);o.stop(t0+dur+0.02);},
  play(n){switch(n){
    case 'draw':this.tone('triangle',140,30,0.08,0.12);break;
    case 'place':this.tone('sine',280,60,0.12,0.2);break;
    case 'click':this.tone('square',880,1200,0.03,0.07);break;
    case 'bust':this.tone('sawtooth',130,60,0.3,0.18);break;
    case 'win':[440,554.37,659.25].forEach((f,i)=>this.tone('triangle',f,f,0.14,0.14,i*0.11));break;
    case 'lose':this.tone('sawtooth',220,70,0.5,0.13);this.tone('sawtooth',160,50,0.5,0.11,0.18);break;
  }}
};
