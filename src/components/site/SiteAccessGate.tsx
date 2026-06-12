import { useCallback, useState } from 'react';
import { applyPreviewAccessFromUrl, isSiteOpenForUser } from '@/utils/siteAccess';
import { ComingSoonPage } from '@/pages/ComingSoonPage/ComingSoonPage';
interface SiteAccessGateProps {
    children: React.ReactNode;
}
function readInitialAccess(): boolean {
    applyPreviewAccessFromUrl();
    return isSiteOpenForUser();
}
function SiteAccessGate({ children }: SiteAccessGateProps) {
    const [hasAccess, setHasAccess] = useState(readInitialAccess);
    const handleAccessGranted = useCallback(() => {
        setHasAccess(true);
    }, []);
    if (!hasAccess) {
        return <ComingSoonPage onAccessGranted={handleAccessGranted}/>;
    }
    return children;
}

export {
  SiteAccessGate,
}
