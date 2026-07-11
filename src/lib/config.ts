// External service endpoints. Every value can be overridden per environment so
// capacity upgrades (commercial tiles, self-hosted routing/geocoding) are a
// Vercel env-var change, never a code change. Defaults are free public services.

const env = import.meta.env

export const TILE_URL: string =
  env.VITE_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

export const TILE_URL_DARK: string =
  env.VITE_TILE_URL_DARK ?? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'

export const TILE_ATTRIBUTION: string =
  env.VITE_TILE_ATTRIBUTION ??
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

/** Base URL including the routing profile, e.g. …/route/v1/foot */
export const OSRM_URL: string =
  env.VITE_OSRM_URL ?? 'https://routing.openstreetmap.de/routed-foot/route/v1/foot'

export const PHOTON_URL: string = env.VITE_PHOTON_URL ?? 'https://photon.komoot.io'
