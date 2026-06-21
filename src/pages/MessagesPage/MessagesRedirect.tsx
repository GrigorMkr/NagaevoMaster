import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { profileMessagesPath } from '@/utils/constants';

function MessagesRedirect() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [searchParams] = useSearchParams();
  const withUser = searchParams.get('with');

  if (conversationId) {
    return <Navigate to={profileMessagesPath(conversationId)} replace />;
  }
  if (withUser) {
    return <Navigate to={profileMessagesPath(undefined, withUser)} replace />;
  }
  return <Navigate to={profileMessagesPath()} replace />;
}

export {
  MessagesRedirect,
}
