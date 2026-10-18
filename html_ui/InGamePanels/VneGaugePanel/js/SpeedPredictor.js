'use strict';
class SpeedPredictor {
  constructor(windowSeconds=4.0, recencyLambda=0.8, minSamples=8) {
    this.windowSeconds=windowSeconds; this.recencyLambda=recencyLambda; this.minSamples=minSamples; this.samples=[];
  }
  addSample(timeSeconds, tas) {
    if(!Number.isFinite(timeSeconds)||!Number.isFinite(tas)||tas<0) return false;
    const last=this.samples[this.samples.length-1];
    if(last && timeSeconds<=last.t) return false;
    this.samples.push({t:timeSeconds,v:tas});
    const cutoff=timeSeconds-this.windowSeconds;
    while(this.samples.length && this.samples[0].t<cutoff) this.samples.shift();
    return true;
  }
  fit() {
    if(this.samples.length<this.minSamples) return null;
    const tNow=this.samples[this.samples.length-1].t;
    let sw=0,sx=0,sy=0,sxx=0,sxy=0;
    for(const s of this.samples){
      const x=s.t-tNow; const age=tNow-s.t; const w=Math.exp(-this.recencyLambda*age);
      sw+=w; sx+=w*x; sy+=w*s.v; sxx+=w*x*x; sxy+=w*x*s.v;
    }
    const den=sw*sxx-sx*sx; if(Math.abs(den)<1e-9) return null;
    const rate=(sw*sxy-sx*sy)/den; const intercept=(sy-rate*sx)/sw;
    return {rate, current:intercept};
  }
  currentRate(){ const f=this.fit(); return f?f.rate:null; }
  predict(secondsAhead){ const f=this.fit(); return f?f.current+f.rate*secondsAhead:null; }
}
window.SpeedPredictor=SpeedPredictor;
