import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ROUTES } from '@/constants';
import { completeOAuthLogin, parseOAuthSearch } from '@/services/completeOAuthLogin';
import { isNativeApp } from '@/utils/nativeApp';

function useNativeOAuthCompletion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handledSearchRef = useRef('');

  useEffect(() => {
    if (!isNativeApp()) return;

    const search = searchParams.toString();
    if (!search) return;

    const { oauth, code, handoff, oauthError } = parseOAuthSearch(`?${search}`);
    if (!oauthError && oauth !== '1' && !code && !handoff) return;
    if (handledSearchRef.current === search) return;

    handledSearchRef.current = search;

    void completeOAuthLogin(`?${search}`).then((result) => {
      if (result.status === 'pending') return;
      if (result.status === 'success') {
        navigate(result.returnPath, { replace: true });
        return;
      }
      if (result.status === 'error') {
        toast.error(result.message);
        navigate(ROUTES.AUTH, { replace: true });
      }
    });
  }, [navigate, searchParams]);
}

export {
  useNativeOAuthCompletion,
};
