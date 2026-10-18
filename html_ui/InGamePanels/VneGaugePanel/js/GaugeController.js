'use strict';
(()=>{
const state={safeSpeed:130,targetSpeed:145,vne:154,currentSpeed:130,predictedSpeed:130,flapText:'—',profile:null};
const predictor=new SpeedPredictor(4.0,.8,8), el=id=>document.getElementById(id), TOP=18,BOTTOM=368,H=BOTTOM-TOP;
const y=v=>BOTTOM-((Math.max(state.safeSpeed,Math.min(state.vne+3,v))-state.safeSpeed)/Math.max(.001,state.vne+3-state.safeSpeed))*H;
function zone(id,a,b){const n=el(id),p=y(a),q=y(b);n.setAttribute('y',Math.min(p,q));n.setAttribute('height',Math.abs(q-p));}
function render(){const v=y(state.vne),t=y(state.targetSpeed),s=y(state.safeSpeed);zone('safeZone',state.safeSpeed,state.targetSpeed);zone('targetZone',state.targetSpeed,state.vne);zone('dangerZone',state.vne,state.vne+3);[['vneTick',v],['targetTick',t],['safeTick',s]].forEach(([i,p])=>{el(i).setAttribute('y1',p);el(i).setAttribute('y2',p)});el('vneTitle').setAttribute('y',v-17);el('vneValue').setAttribute('y',v+1);el('targetValue').setAttribute('y',t+6);el('safeValue').setAttribute('y',s-3);el('vneValue').textContent=Math.round(state.vne);el('targetValue').textContent=Math.round(state.targetSpeed);el('safeValue').textContent=Math.round(state.safeSpeed);el('currentMarker').setAttribute('transform',`translate(0 ${y(state.currentSpeed)})`);const py=y(state.predictedSpeed);['predictedMarker','predictedMarkerInner'].forEach(i=>{el(i).setAttribute('y1',py);el(i).setAttribute('y2',py)});el('tasValue').textContent=Math.round(state.currentSpeed);el('flapText').textContent=state.flapText;}
function actualFlapText(d){
  if(!d.flapAvailable) return '—';
  const idx=Number.isFinite(d.flapEffectiveIndex)?Math.round(d.flapEffectiveIndex):Math.round(d.flapIndex);
  if(Number.isFinite(idx)) {
    if(state.profile && state.profile.flapLabels && state.profile.flapLabels[idx]!==undefined) return state.profile.flapLabels[idx];
    return `${idx}`;
  }
  if(Number.isFinite(d.flapPercent)) return `${Math.round(d.flapPercent*100)}%`;
  return '—';
}
function recommendedFlapText(d){
  if(!state.profile || !Array.isArray(state.profile.flapSchedule) || !Number.isFinite(d.ias)) return '—';
  const iasKph=d.ias*1.852;
  const band=state.profile.flapSchedule.find(b=>iasKph>=b.minIasKph && iasKph<b.maxIasKph);
  return band ? band.setting : '—';
}
function flapText(d){
  const actual=actualFlapText(d);
  const recommended=recommendedFlapText(d);
  return (recommended==='—' || actual===recommended) ? actual : `${actual} > ${recommended}`;
}

function interpolateExpectedSink(iasKph){
  if(!state.profile || !Array.isArray(state.profile.glideRatioCurve) || state.profile.glideRatioCurve.length<2 || !Number.isFinite(iasKph)) return null;
  // Match Polars.cs: convert glide-ratio points to positive-down sink m/s, then interpolate/extrapolate linearly.
  const polar=state.profile.glideRatioCurve.map(([a,g])=>[a,(a/3.6)/g]);
  let p1,p2;
  if(iasKph<polar[0][0]) { p1=polar[0]; p2=polar[1]; }
  else if(iasKph>polar[polar.length-1][0]) { p1=polar[polar.length-2]; p2=polar[polar.length-1]; }
  else {
    for(let i=0;i<polar.length-1;i++) if(iasKph>=polar[i][0] && iasKph<=polar[i+1][0]) { p1=polar[i]; p2=polar[i+1]; break; }
  }
  if(!p1||!p2) return null;
  const t=(iasKph-p1[0])/(p2[0]-p1[0]);
  return p1[1]+t*(p2[1]-p1[1]);
}
// Match PerformanceService.cs: smooth Netto and TE Vario independently over 10 seconds.
class RollingAverage {
  constructor(windowSeconds=10){ this.windowSeconds=windowSeconds; this.samples=[]; }
  add(value,time){
    if(!Number.isFinite(value)||!Number.isFinite(time)) return;
    this.samples.push({value,time});
    const cutoff=time-this.windowSeconds;
    while(this.samples.length && this.samples[0].time<cutoff) this.samples.shift();
  }
  get average(){
    if(!this.samples.length) return null;
    return this.samples.reduce((sum,s)=>sum+s.value,0)/this.samples.length;
  }
}
const nettoAverage=new RollingAverage(10);
const teVarioAverage=new RollingAverage(10);
const knotsToMps=kts=>kts*0.5144444444444445;

function updateEfficiency(d){
  const node=el('efficiency');
  if(Number.isFinite(d.netto)) nettoAverage.add(d.netto,d.time);
  if(Number.isFinite(d.teVario)) teVarioAverage.add(d.teVario,d.time);

  // C# uses instantaneous IAS for the polar, but 10-second averaged Netto/TE Vario
  // for the measured sink-through-air term.
  const expected=Number.isFinite(d.ias)?interpolateExpectedSink(d.ias*1.852):null;
  const smoothNetto=nettoAverage.average;
  const smoothTeVario=teVarioAverage.average;
  const actual=(smoothNetto!==null && smoothTeVario!==null)
    ? knotsToMps(smoothNetto)-knotsToMps(smoothTeVario)
    : null;
  const efficiency=(actual!==null && actual>0.05 && expected!==null && expected>0) ? expected/actual : 0;
  node.textContent=`${Math.round(efficiency*100)}%`;
  node.classList.remove('eff-good','eff-warn','eff-bad');
  node.classList.add(efficiency>0.95?'eff-good':efficiency>0.85?'eff-warn':'eff-bad');
}

const ds=new MsfsTelemetryDataSource(200);
ds.onTelemetry=d=>{predictor.addSample(d.time,d.tas);let pred=predictor.predict(2.0);if(pred===null||pred<0||Math.abs(pred-d.tas)>20)pred=d.tas;state.currentSpeed=d.tas;state.predictedSpeed=pred;state.flapText=flapText(d);updateEfficiency(d);render();};
ds.onStatus=s=>{if(s!=='CONNECTED'){state.flapText=s==='CONNECTING'?'…':'OFF';render();}};
const metadata=new AircraftMetadata(5000);
metadata.onUpdate=title=>{
  const p=AircraftProfiles.find(title);
  if(p){
    state.profile=p;
    state.safeSpeed=p.safeSpeedTasKts;
    state.targetSpeed=p.targetSpeedTasKts;
    state.vne=p.vneTasKts;
  } else {
    state.profile=null;
  }
  render();
};
render();ds.connect();metadata.start();
})();
