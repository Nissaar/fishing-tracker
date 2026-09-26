import { useCallback, useRef, useState } from 'react';
import { adminAPI, DROPDOWN_ENDPOINTS } from '../../../services/adminAPI';

const KINDS = Object.keys(DROPDOWN_ENDPOINTS);
const EMPTY = Object.fromEntries(KINDS.map(kind => [kind, []]));

/**
 * The dropdown lists the Admin page manages, loaded once per visit and shared
 * by the Dropdowns tab and the entry editor. After an add, edit or delete only
 * the list that changed is reloaded — refetching all five every time used to
 * run the admin into its own rate limit (100 requests per 15 minutes).
 */
export default function useAdminDropdowns() {
  const [lists, setLists] = useState(EMPTY);
  const [error, setError] = useState(null);
  const loadedRef = useRef(false);

  const refresh = useCallback(async (kind) => {
    const list = await adminAPI.getDropdownList(kind);
    setLists(prev => ({ ...prev, [kind]: list }));
  }, []);

  const ensureLoaded = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setError(null);
    const results = await Promise.allSettled(KINDS.map(kind => adminAPI.getDropdownList(kind)));
    setLists(Object.fromEntries(KINDS.map((kind, i) => [kind, results[i].status === 'fulfilled' ? results[i].value : []])));
    if (results.some(result => result.status === 'rejected')) {
      // Allow a retry to fetch again
      loadedRef.current = false;
      setError(new Error('Some lists failed to load'));
    }
  }, []);

  return { lists, error, ensureLoaded, refresh };
}
