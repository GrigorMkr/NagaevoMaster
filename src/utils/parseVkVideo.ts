interface VkVideoParams {
  oid: number;
  id: number;
  hash?: string;
  hd?: number;
  autoplay?: boolean;
  loop?: boolean;
  startTime?: string;
}

interface VkVideoInput {
  url?: string;
  oid?: string;
  id?: string;
  hash?: string;
  hd?: string;
  autoplay?: string;
  loop?: string;
  startTime?: string;
}

const VK_VIDEO_PAGE_RE = /(?:vk\.(?:ru|com)\/)?video(-?\d+)_(\d+)/i;
const VK_VIDEO_EXT_RE = /video_ext\.php/i;

function parseOwnerAndVideoId(ownerRaw: string, videoRaw: string): VkVideoParams | null {
  const oid = Number(ownerRaw);
  const id = Number(videoRaw);
  if (!Number.isFinite(oid) || !Number.isFinite(id) || id <= 0) {
    return null;
  }
  return { oid, id };
}

function parseVkVideoUrl(url: string): VkVideoParams | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, 'https://vk.ru');
    if (VK_VIDEO_EXT_RE.test(parsed.pathname)) {
      const oid = parsed.searchParams.get('oid');
      const id = parsed.searchParams.get('id');
      if (!oid || !id) {
        return null;
      }
      const base = parseOwnerAndVideoId(oid, id);
      if (!base) {
        return null;
      }
      const hd = parsed.searchParams.get('hd');
      const hash = parsed.searchParams.get('hash') ?? undefined;
      const t = parsed.searchParams.get('t') ?? undefined;
      return {
        ...base,
        hash,
        hd: hd ? Number(hd) : undefined,
        autoplay: parsed.searchParams.get('autoplay') === '1',
        loop: parsed.searchParams.has('loop'),
        startTime: t,
      };
    }

    const pathMatch = parsed.pathname.match(VK_VIDEO_PAGE_RE);
    if (pathMatch?.[1] && pathMatch[2]) {
      return parseOwnerAndVideoId(pathMatch[1], pathMatch[2]) ?? null;
    }
  } catch {
    // not a URL — try bare id pattern below
  }

  const bareMatch = trimmed.match(VK_VIDEO_PAGE_RE);
  if (bareMatch?.[1] && bareMatch[2]) {
    return parseOwnerAndVideoId(bareMatch[1], bareMatch[2]);
  }

  return null;
}

function parseVkVideoConfig(input: VkVideoInput): VkVideoParams | null {
  if (input.url?.trim()) {
    const fromUrl = parseVkVideoUrl(input.url);
    if (fromUrl) {
      return {
        ...fromUrl,
        hash: input.hash?.trim() || fromUrl.hash,
        hd: input.hd ? Number(input.hd) : fromUrl.hd,
        autoplay: input.autoplay === '1' || input.autoplay === 'true' || fromUrl.autoplay,
        loop: input.loop === '1' || input.loop === 'true' || fromUrl.loop,
        startTime: input.startTime?.trim() || fromUrl.startTime,
      };
    }
  }

  if (input.oid?.trim() && input.id?.trim()) {
    const base = parseOwnerAndVideoId(input.oid.trim(), input.id.trim());
    if (!base) {
      return null;
    }
    return {
      ...base,
      hash: input.hash?.trim() || undefined,
      hd: input.hd ? Number(input.hd) : undefined,
      autoplay: input.autoplay === '1' || input.autoplay === 'true',
      loop: input.loop === '1' || input.loop === 'true',
      startTime: input.startTime?.trim() || undefined,
    };
  }

  return null;
}

function buildVkVideoEmbedUrl(params: VkVideoParams, jsApi = false): string {
  const search = new URLSearchParams();
  search.set('oid', String(params.oid));
  search.set('id', String(params.id));
  if (params.hash) {
    search.set('hash', params.hash);
  }
  if (params.hd && params.hd >= 1 && params.hd <= 4) {
    search.set('hd', String(params.hd));
  }
  if (params.startTime) {
    search.set('t', params.startTime);
  }
  if (params.autoplay) {
    search.set('autoplay', '1');
  }
  if (params.loop) {
    search.set('loop', '1');
  }
  if (jsApi) {
    search.set('js_api', '1');
  }
  return `https://vk.ru/video_ext.php?${search.toString()}`;
}

function vkVideoAspectRatio(hd?: number): number {
  switch (hd) {
    case 1:
      return 640 / 360;
    case 3:
      return 1280 / 720;
    case 4:
      return 1920 / 1080;
    case 2:
    default:
      return 853 / 480;
  }
}

export type {
  VkVideoParams,
  VkVideoInput,
};

export {
  parseVkVideoUrl,
  parseVkVideoConfig,
  buildVkVideoEmbedUrl,
  vkVideoAspectRatio,
};
