import { createContext, useContext } from 'react';
import type { Map } from 'mmr-gl';

interface VkMapContextValue {
  map: Map | null;
  mapLoaded: boolean;
}

const VkMapContext = createContext<VkMapContextValue>({ map: null, mapLoaded: false });

function useVkMap(): VkMapContextValue {
  return useContext(VkMapContext);
}

export type {
  VkMapContextValue,
};

export {
  VkMapContext,
  useVkMap,
};
