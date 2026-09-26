import { useCallback, useEffect, useState } from 'react';
import { dropdownAPI, fishingAPI } from '../services/api';

const LOADERS = {
  locations: async () => (await fishingAPI.getLocations()).data?.locations || [],
  fishingTypes: async () => (await dropdownAPI.fishingTypes()).data,
  fishingMethods: async () => (await dropdownAPI.fishingMethods()).data,
  baits: async () => (await dropdownAPI.baits()).data,
  fishSpecies: async () => (await dropdownAPI.fishSpecies()).data
};

const asList = (value) => (Array.isArray(value) ? value : []);

/**
 * Loads the option lists a form needs, e.g.
 * useDropdownOptions(['locations', 'fishingTypes']).
 * Returns { options, loading, error, reload }; `error` is set if any list
 * failed, and the lists that did load are still returned.
 */
export default function useDropdownOptions(kinds) {
  const key = kinds.join(',');
  const [options, setOptions] = useState(() => Object.fromEntries(kinds.map(kind => [kind, []])));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // One failing list shouldn't blank the others
    const names = key.split(',');
    const results = await Promise.allSettled(names.map(kind => LOADERS[kind]()));
    setOptions(Object.fromEntries(names.map((kind, i) => [
      kind, results[i].status === 'fulfilled' ? asList(results[i].value) : []
    ])));
    const failed = results.find(result => result.status === 'rejected');
    if (failed) setError(failed.reason);
    setLoading(false);
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { options, loading, error, reload: load };
}
