'use strict';
// Aircraft set-up data, copied from FlightPlannerCore/Glider/GliderData.cs.
//
// Units:
//   glideRatioCurve - [IAS km/h, glide ratio]. IAS, not TAS: sink is looked up from IAS.
//   flapSchedule    - recommended flap bands, IAS km/h.
//   *TasKts         - VNE / target / safe speeds are TAS knots by design: a true
//                     IAS-based VNE varies with altitude, so VNE is fixed in TAS.
//   flapLabels      - MSFS FLAPS HANDLE INDEX -> cockpit flap position label.
//
// Matching: the MSFS TITLE is normalised to lower-case letters/digits and the first
// profile whose fragment it contains wins (same fragments as GliderAliases.cs).
// ORDER MATTERS - a more specific fragment must come before any fragment it contains.
class AircraftProfiles {
  static normalizeTitle(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  static find(title) {
    const t = this.normalizeTitle(title);
    const p = this.profiles.find(x => t.includes(x.fragment));
    return p || null;
  }
}

// Shared by both spans of each type.
const AS33_FLAP_LABELS = {0:'1',1:'2',2:'3',3:'4',4:'N',5:'5',6:'6',7:'L'};
const JS3_FLAP_LABELS  = {0:'1',1:'2',2:'3',3:'4',4:'5',5:'L'};

// JS3 flap schedule, identical for 15m and 18m in GliderData.cs.
// Bands are searched in order and the first match wins, so L and 5 overlapping
// from 0 resolves to: < 86 = L, 86-90 = 5. Nothing is defined for 90-105 km/h;
// there the gauge shows the actual flap only, with no recommendation.
const JS3_FLAP_SCHEDULE = [
  {minIasKph:0,   maxIasKph:86,  setting:'L'},
  {minIasKph:0,   maxIasKph:90,  setting:'5'},
  {minIasKph:105, maxIasKph:125, setting:'4'},
  {minIasKph:125, maxIasKph:140, setting:'3'},
  {minIasKph:140, maxIasKph:200, setting:'2'},
  {minIasKph:200, maxIasKph:999, setting:'1'}
];

AircraftProfiles.profiles = [
  {
    fragment: 'as33me18m',               // MSFS title "AS 33 Me (18m)"
    id: 'AS33_18m',
    displayName: 'AS 33 Me 18m',
    vneTasKts: 155,                      // 287.06 km/h
    targetSpeedTasKts: 152,              // 281.50 km/h
    safeSpeedTasKts: 130,                // 240.76 km/h
    flapLabels: AS33_FLAP_LABELS,
    // Paper polar. Compared with a captured sim polar this shows a ~17% bias in
    // the sim's favour (less sink), but spot checks across the flap settings are
    // within 5% of the polar, so the paper spec is used.
    glideRatioCurve: [
      [94.10,45.31],[100.53,49.06],[110.60,53.25],[120.01,55.21],
      [130.08,56.25],[139.98,56.17],[150.21,54.24],[159.95,52.51],
      [170.02,49.92],[180.09,46.45],[189.83,44.22],[199.89,41.72],
      [209.80,39.15],[220.19,36.73],[230.10,34.48],[240.00,31.92],
      [243.30,31.10],
      [250.00,28.94],                    // beyond published spec - 2.4 m/s sink
      [260.00,26.75]                     // 2.7 m/s sink
    ],
    flapSchedule: [
      {minIasKph:0,   maxIasKph:107, setting:'5'},
      {minIasKph:107, maxIasKph:126, setting:'N'},
      {minIasKph:126, maxIasKph:146, setting:'4'},
      {minIasKph:146, maxIasKph:174, setting:'3'},
      {minIasKph:174, maxIasKph:197, setting:'2'},
      {minIasKph:197, maxIasKph:999, setting:'1'}
    ]
  },
  {
    fragment: 'as33me15m',               // MSFS title "AS 33 Me (15m)"
    id: 'AS33_15m',
    displayName: 'AS 33 Me 15m',
    // Same figures as the 18m - not differentiated by span in GliderData.cs.
    vneTasKts: 155,                      // 287.06 km/h
    targetSpeedTasKts: 152,              // 281.50 km/h
    safeSpeedTasKts: 130,                // 240.76 km/h
    flapLabels: AS33_FLAP_LABELS,
    // Digitised from the manufacturer polar chart, AS 33 Es 15m,
    // 550 kg / 62.5 kg/m² (max wing loading; best L/D 1:50).
    glideRatioCurve: [
      [95.00,38.24],                     // 0.69 m/s sink
      [100.00,40.26],                    // 0.69
      [110.00,44.28],                    // 0.69
      [120.00,46.95],                    // 0.71
      [130.00,48.15],                    // 0.75
      [140.00,49.23],                    // 0.79
      [150.00,49.60],                    // 0.84  <- best L/D region
      [160.00,49.38],                    // 0.90
      [170.00,48.19],                    // 0.98
      [180.00,46.73],                    // 1.07
      [190.00,43.98],                    // 1.20
      [200.00,40.55],                    // 1.37
      [210.00,37.63],                    // 1.55
      [220.00,35.32],                    // 1.73
      [230.00,32.76],                    // 1.95
      [240.00,31.01],                    // 2.15
      [250.00,29.80]                     // 2.33 (chart ends ~248 km/h)
    ],
    flapSchedule: [
      {minIasKph:0,   maxIasKph:109, setting:'5'},
      {minIasKph:109, maxIasKph:133, setting:'N'},
      {minIasKph:133, maxIasKph:147, setting:'4'},
      {minIasKph:147, maxIasKph:175, setting:'3'},
      {minIasKph:175, maxIasKph:199, setting:'2'},
      {minIasKph:199, maxIasKph:999, setting:'1'}
    ]
  },
  {
    fragment: 'js318',                   // MSFS title "JS3-18"
    id: 'JS3_18m',
    displayName: 'JS3 18m',
    vneTasKts: 151,                      // 279.7 km/h
    targetSpeedTasKts: 149,              // 276.0 km/h
    safeSpeedTasKts: 130,                // 240.8 km/h
    flapLabels: JS3_FLAP_LABELS,
    // Digitised from the manufacturer polar chart (60 kg/m², 18m).
    glideRatioCurve: [
      [96.40,51.83],[100.00,53.77],[105.00,53.50],[110.00,55.08],
      [115.00,55.01],[120.00,56.71],
      [125.00,57.30],                    // <- best L/D region
      [130.00,57.23],[135.00,56.94],[140.00,55.91],[150.00,54.03],
      [160.00,51.03],[170.00,48.29],[180.00,45.48],[190.00,42.74],
      [200.00,39.84],[210.00,36.91],[220.00,34.42],
      [230.00,31.75],                    // last digitised point (chart ends ~232 km/h)
      [240.00,29.48],                    // extrapolated - quadratic fit to 196-230 km/h tail
      [250.00,27.40],                    // extrapolated
      [255.00,26.43]                     // extrapolated
    ],
    flapSchedule: JS3_FLAP_SCHEDULE
  },
  {
    fragment: 'js315',                   // MSFS title "JS3-15"
    id: 'JS3_15m',
    displayName: 'JS3 15m',
    vneTasKts: 151,                      // 279.7 km/h
    targetSpeedTasKts: 149,              // 276.0 km/h
    safeSpeedTasKts: 130,                // 240.8 km/h
    flapLabels: JS3_FLAP_LABELS,
    // Digitised from the manufacturer polar chart (60 kg/m², 15m).
    glideRatioCurve: [
      [96.40,42.12],[100.00,43.69],[105.00,45.58],[110.00,46.27],
      [115.00,48.95],[120.00,50.16],
      [125.00,50.86],                    // <- best L/D region
      [130.00,52.56],[135.00,51.11],[140.00,50.58],[150.00,49.05],
      [160.00,46.72],[170.00,44.57],[180.00,42.17],[190.00,39.73],
      [200.00,37.15],[210.00,34.52],[220.00,31.96],
      [230.00,29.85],                    // last digitised point (chart ends ~234 km/h)
      [240.00,27.87],                    // extrapolated
      [250.00,26.12],                    // extrapolated
      [255.00,25.32]                     // extrapolated
    ],
    flapSchedule: JS3_FLAP_SCHEDULE
  }
];

window.AircraftProfiles=AircraftProfiles;
