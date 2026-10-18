'use strict';
class AircraftProfiles {
  static normalizeTitle(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  static find(title) {
    const t = this.normalizeTitle(title);
    if (t.includes('as33me18m')) {
      return {
        id: 'AS33_18m',
        displayName: 'AS 33 Me 18m',
        safeSpeedTasKts: 130,
        targetSpeedTasKts: 152,
        vneTasKts: 155,
        flapLabels: {0:'1',1:'2',2:'3',3:'4',4:'N',5:'5',6:'6',7:'L'},
        // AS33 18m glide-ratio curve from GliderData.cs. Airspeed is IAS km/h.
        glideRatioCurve: [
          [94.10,45.31],[100.53,49.06],[110.60,53.25],[120.01,55.21],
          [130.08,56.25],[139.98,56.17],[150.21,54.24],[159.95,52.51],
          [170.02,49.92],[180.09,46.45],[189.83,44.22],[199.89,41.72],
          [209.80,39.15],[220.19,36.73],[230.10,34.48],[240.00,31.92],
          [243.30,31.10],[250.00,28.94],[260.00,26.75]
        ],
        // Recommended flap bands from GliderData.cs. These speeds are IAS, in km/h.
        flapSchedule: [
          {minIasKph:0,   maxIasKph:107, setting:'5'},
          {minIasKph:107, maxIasKph:126, setting:'N'},
          {minIasKph:126, maxIasKph:146, setting:'4'},
          {minIasKph:146, maxIasKph:174, setting:'3'},
          {minIasKph:174, maxIasKph:197, setting:'2'},
          {minIasKph:197, maxIasKph:999, setting:'1'}
        ]
      };
    }
    return null;
  }
}
window.AircraftProfiles=AircraftProfiles;
