import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';

const useApi = (apiFn) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(...args);
      setData(res.data.data);
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Xatolik yuz berdi';
      setError(msg);
      enqueueSnackbar(msg, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { data, loading, error, execute };
};

export default useApi;
