import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';

/** GET helper with loading / error / reload. `url` may be null to skip. */
export default function useFetch(url, params, fallbackError = 'Unable to load data.') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState('');
  const key = JSON.stringify(params || {});

  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(url, { params: JSON.parse(key) });
      setData(res.data);
    } catch (e) {
      setError(errorMessage(e, fallbackError));
    } finally {
      setLoading(false);
    }
  }, [url, key, fallbackError]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load, setData };
}
