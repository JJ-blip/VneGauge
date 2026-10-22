'use strict';
class MsfsTelemetryDataSource {
  constructor(intervalMs=200) {
    this.intervalMs=intervalMs;
    this.timer=null;
    this.onTelemetry=null;
    this.onStatus=null;
    this.lastStatus='';
  }
  status(s){ if(s!==this.lastStatus){this.lastStatus=s; if(this.onStatus) this.onStatus(s);} }
  readString(name){
    try { const v=SimVar.GetSimVarValue(name,'string'); return (v==null?'':String(v)).trim(); }
    catch(_) { return ''; }
  }
  readNumber(name,unit){
    try { const v=Number(SimVar.GetSimVarValue(name,unit)); return Number.isFinite(v)?v:null; }
    catch(_) { return null; }
  }
  read(){
    if(typeof SimVar==='undefined' || typeof SimVar.GetSimVarValue!=='function') { this.status('SIMVAR UNAVAILABLE'); return; }
    const tas=this.readNumber('AIRSPEED TRUE','knots');
    const ias=this.readNumber('AIRSPEED INDICATED','knots');
    if(tas===null) { this.status('NO TAS'); return; }
    const telemetry={
      tas,
      ias,
      flapAvailable: !!this.readNumber('FLAPS AVAILABLE','bool'),
      flapIndex: this.readNumber('FLAPS HANDLE INDEX','number'),
      flapEffectiveIndex: this.readNumber('FLAPS EFFECTIVE HANDLE INDEX','number'),
      flapPercent: this.readNumber('FLAPS HANDLE PERCENT','percent over 100'),
      flapPositions: this.readNumber('FLAPS NUM HANDLE POSITIONS','number'),
      flapSpeedLimit: this.readNumber('FLAPS CURRENT SPEED LIMITATION','knots'),
      // Gear warning: handle down (1) on a retractable-gear aircraft.
      gearRetractable: !!this.readNumber('IS GEAR RETRACTABLE','bool'),
      gearHandleDown: this.readNumber('GEAR HANDLE POSITION','bool')===1,
      // Match the C# PerformanceService inputs. These are read in knots,
      // then smoothed over a 10-second window before conversion to m/s.
      netto: this.readNumber('VARIOMETER NETTO','knots'),
      teVario: this.readNumber('VARIOMETER TOTAL ENERGY','knots'),
      time: performance.now()/1000
    };
    this.status('CONNECTED');
    if(this.onTelemetry) this.onTelemetry(telemetry);
  }
  connect(){
    this.disconnect(); this.status('CONNECTING'); this.read();
    this.timer=setInterval(()=>this.read(),this.intervalMs);
  }
  disconnect(){ if(this.timer){clearInterval(this.timer);this.timer=null;} }
}
window.MsfsTelemetryDataSource=MsfsTelemetryDataSource;
