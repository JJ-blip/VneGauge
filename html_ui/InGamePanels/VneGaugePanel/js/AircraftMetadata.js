'use strict';
class AircraftMetadata {
  constructor(intervalMs=5000) { this.intervalMs=intervalMs; this.timer=null; this.onUpdate=null; }
  readTitle() {
    if (typeof SimVar==='undefined' || typeof SimVar.GetSimVarValue!=='function') return '';
    try {
      const raw=SimVar.GetSimVarValue('TITLE','string');
      if(raw===null || raw===undefined) return '';
      return String(raw).replace(/[\x00-\x1F\x7F]/g,'').trim();
    } catch(e) { return ''; }
  }
  poll() { const title=this.readTitle(); if(this.onUpdate) this.onUpdate(title); }
  start() { this.stop(); setTimeout(()=>this.poll(),1500); this.timer=setInterval(()=>this.poll(),this.intervalMs); }
  stop() { if(this.timer){clearInterval(this.timer);this.timer=null;} }
}
window.AircraftMetadata=AircraftMetadata;
