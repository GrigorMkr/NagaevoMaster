interface StampSmokePalette {
  id: string;
  core: string;
  mid: string;
  glow: string;
  chimney: string;
}

/** 0 — зелёный по умолчанию, далее яркие неоновые оттенки по клику */
const STAMP_SMOKE_PALETTE: StampSmokePalette[] = [
  { id: 'green', core: '77, 208, 160', mid: '45, 154, 116', glow: '126, 200, 168', chimney: '#4dd0a0' },
  { id: 'magenta', core: '255, 61, 172', mid: '255, 110, 199', glow: '255, 158, 218', chimney: '#ff3dac' },
  { id: 'cyan', core: '0, 229, 255', mid: '0, 180, 216', glow: '120, 240, 255', chimney: '#00e5ff' },
  { id: 'gold', core: '255, 213, 79', mid: '255, 171, 0', glow: '255, 236, 140', chimney: '#ffd54f' },
  { id: 'violet', core: '179, 136, 255', mid: '124, 77, 255', glow: '210, 180, 255', chimney: '#b388ff' },
  { id: 'coral', core: '255, 110, 64', mid: '255, 61, 0', glow: '255, 171, 128', chimney: '#ff6e40' },
];

export {
  STAMP_SMOKE_PALETTE,
};

export type {
  StampSmokePalette,
};
