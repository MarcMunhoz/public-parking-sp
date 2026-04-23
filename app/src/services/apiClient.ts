const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const OVERPASS_INTERPRETER_URL = 'https://overpass-api.de/api/interpreter';

const nominatimHeaders: HeadersInit = {
  Accept: 'application/json',
  'Accept-Language': 'pt-BR'
};

const overpassHeaders: HeadersInit = {
  Accept: 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
};

export const apiClient = {
  connections: {
    nominatimSearchUrl: NOMINATIM_SEARCH_URL,
    nominatimReverseUrl: NOMINATIM_REVERSE_URL,
    overpassInterpreterUrl: OVERPASS_INTERPRETER_URL
  } as const,

  requestNominatim: async (url: URL): Promise<Response> => {
    return fetch(url.toString(), {
      headers: nominatimHeaders
    });
  },

  requestOverpass: async (query: string): Promise<Response> => {
    return fetch(OVERPASS_INTERPRETER_URL, {
      method: 'POST',
      headers: overpassHeaders,
      body: new URLSearchParams({ data: query })
    });
  }
};

export type ApiClient = typeof apiClient;
