/**
 * The Muskai model registry — every Alibaba DashScope model available on the
 * account, grouped by capability. This is the single source of truth used by
 * the API (routing + quota ledger) and the web app (model pickers, fleet grid).
 *
 * Each model has its OWN free-quota pool on DashScope. When a pool is empty
 * DashScope returns HTTP 403 (AllocationQuota.FreeTierOnly) and the router
 * moves to the next model in the capability's chain (chainOrder ascending).
 */

export const CAPABILITIES = [
  'TEXT_TO_VIDEO',
  'IMAGE_TO_VIDEO',
  'KEYFRAME_TO_VIDEO',
  'REFERENCE_TO_VIDEO',
  'VIDEO_EDIT',
  'TEXT_TO_IMAGE',
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export interface ModelDefinition {
  /** DashScope model id, sent verbatim to the API. */
  id: string;
  /** Human-friendly name for the UI. */
  displayName: string;
  capability: Capability;
  /** Size of the free-quota pool granted on the account (in "units" — the
   *  platform does not promise whether a unit is one call or one second, so
   *  the UI always says "units"). */
  quotaTotal: number;
  /** Position inside the capability's fallback chain (1 = tried first). */
  chainOrder: number;
  /** One-line description for the UI. */
  note: string;
}

export const MODEL_REGISTRY: readonly ModelDefinition[] = [
  // — Text to video ————————————————————————————————————————————————
  {
    id: 'wan2.1-t2v-turbo',
    displayName: 'Wan 2.1 T2V Turbo',
    capability: 'TEXT_TO_VIDEO',
    quotaTotal: 200,
    chainOrder: 1,
    note: 'Fastest text-to-video, biggest pool. The default engine.',
  },
  {
    id: 'wan2.1-t2v-plus',
    displayName: 'Wan 2.1 T2V Plus',
    capability: 'TEXT_TO_VIDEO',
    quotaTotal: 200,
    chainOrder: 2,
    note: 'Higher quality than Turbo, same pool size.',
  },
  {
    id: 'wan2.2-t2v-plus',
    displayName: 'Wan 2.2 T2V Plus',
    capability: 'TEXT_TO_VIDEO',
    quotaTotal: 50,
    chainOrder: 3,
    note: 'Newer generation, better motion.',
  },
  {
    id: 'wan2.5-t2v-preview',
    displayName: 'Wan 2.5 T2V Preview',
    capability: 'TEXT_TO_VIDEO',
    quotaTotal: 50,
    chainOrder: 4,
    note: 'Newest preview model.',
  },
  {
    id: 'happyhorse-1.1-t2v',
    displayName: 'HappyHorse 1.1 T2V',
    capability: 'TEXT_TO_VIDEO',
    quotaTotal: 10,
    chainOrder: 5,
    note: 'Last-resort text-to-video, small pool.',
  },
  // — Image to video (also the extension engine) ——————————————————
  {
    id: 'wan2.6-i2v',
    displayName: 'Wan 2.6 I2V',
    capability: 'IMAGE_TO_VIDEO',
    quotaTotal: 50,
    chainOrder: 1,
    note: 'Animates a still image. Powers segment extensions.',
  },
  {
    id: 'wan2.5-i2v-preview',
    displayName: 'Wan 2.5 I2V Preview',
    capability: 'IMAGE_TO_VIDEO',
    quotaTotal: 50,
    chainOrder: 2,
    note: 'Newer image-to-video preview.',
  },
  // — Keyframes to video —————————————————————————————————————————
  {
    id: 'wan2.1-kf2v-plus',
    displayName: 'Wan 2.1 KF2V Plus',
    capability: 'KEYFRAME_TO_VIDEO',
    quotaTotal: 200,
    chainOrder: 1,
    note: 'Animates between a first and last frame.',
  },
  // — Text to image (keyframe + poster generation) ————————————————
  {
    id: 'wan2.2-t2i-flash',
    displayName: 'Wan 2.2 T2I Flash',
    capability: 'TEXT_TO_IMAGE',
    quotaTotal: 100,
    chainOrder: 1,
    note: 'Fast image generation for keyframes.',
  },
  // — Reference to video ——————————————————————————————————————————
  {
    id: 'happyhorse-1.1-r2v',
    displayName: 'HappyHorse 1.1 R2V',
    capability: 'REFERENCE_TO_VIDEO',
    quotaTotal: 10,
    chainOrder: 1,
    note: 'Generates video guided by a reference image.',
  },
  {
    id: 'wan2.1-vace-plus',
    displayName: 'Wan 2.1 VACE Plus',
    capability: 'REFERENCE_TO_VIDEO',
    quotaTotal: 50,
    chainOrder: 2,
    note: 'VACE reference-to-video with a larger pool.',
  },
  // — Video edit ——————————————————————————————————————————————————
  // Note: wan2.1-vace-plus appears in two chains (reference + edit) because
  // the model serves both functions. The registry keeps one row per
  // (model, capability) pair; the quota pool is shared on DashScope's side.
  {
    id: 'wan2.1-vace-plus',
    displayName: 'Wan 2.1 VACE Plus',
    capability: 'VIDEO_EDIT',
    quotaTotal: 50,
    chainOrder: 1,
    note: 'Edit an existing video with a prompt.',
  },
  {
    id: 'happyhorse-1.0-video-edit',
    displayName: 'HappyHorse 1.0 Video Edit',
    capability: 'VIDEO_EDIT',
    quotaTotal: 10,
    chainOrder: 2,
    note: 'Prompt-based video editing, small pool.',
  },
];

/** Models for one capability, in fallback-chain order. */
export function modelsForCapability(capability: Capability): ModelDefinition[] {
  return MODEL_REGISTRY.filter((m) => m.capability === capability).sort(
    (a, b) => a.chainOrder - b.chainOrder,
  );
}

/** Look up one registry row by DashScope model id + capability. */
export function findModel(id: string, capability?: Capability): ModelDefinition | undefined {
  return MODEL_REGISTRY.find(
    (m) => m.id === id && (capability === undefined || m.capability === capability),
  );
}

export const CAPABILITY_LABELS: Record<Capability, string> = {
  TEXT_TO_VIDEO: 'Text to Video',
  IMAGE_TO_VIDEO: 'Image to Video',
  KEYFRAME_TO_VIDEO: 'Keyframes to Video',
  REFERENCE_TO_VIDEO: 'Reference to Video',
  VIDEO_EDIT: 'Video Edit',
  TEXT_TO_IMAGE: 'Text to Image',
};
