import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button/Button';
import {
  acceptFriendRequest,
  fetchFriendRelation,
  removeFriendship,
  sendFriendRequest,
} from '@/services/friendsApi';
import type { FriendRelation } from '@/types/friend';
import { getErrorMessage } from '@/utils/errorMessage';

interface AddFriendButtonProps {
  userId: string;
  size?: 'sm' | 'md';
}

function AddFriendButton({ userId, size = 'sm' }: AddFriendButtonProps) {
  const [relation, setRelation] = useState<FriendRelation>('none');
  const [friendshipId, setFriendshipId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const reload = () => {
    setLoading(true);
    void fetchFriendRelation(userId)
      .then((data) => {
        setRelation(data.relation);
        setFriendshipId(data.friendshipId);
      })
      .catch(() => {
        setRelation('none');
        setFriendshipId(undefined);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, [userId]);

  const handleAdd = async () => {
    setActing(true);
    try {
      const result = await sendFriendRequest(userId);
      setRelation(result.status === 'accepted' ? 'friends' : 'pending_sent');
      setFriendshipId(result.id);
      toast.success(result.status === 'accepted' ? 'Теперь вы друзья' : 'Заявка отправлена');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отправить заявку'));
    } finally {
      setActing(false);
    }
  };

  const handleAccept = async () => {
    if (!friendshipId) return;
    setActing(true);
    try {
      await acceptFriendRequest(friendshipId);
      setRelation('friends');
      toast.success('Заявка принята');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось принять заявку'));
    } finally {
      setActing(false);
    }
  };

  const handleRemove = async () => {
    if (!friendshipId) return;
    setActing(true);
    try {
      await removeFriendship(friendshipId);
      setRelation('none');
      setFriendshipId(undefined);
      toast.success('Заявка отменена');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось выполнить действие'));
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return null;
  }

  if (relation === 'friends') {
    return (
      <Button type="button" size={size} variant="outline" disabled>
        В друзьях
      </Button>
    );
  }

  if (relation === 'pending_sent') {
    return (
      <Button type="button" size={size} variant="outline" loading={acting} onClick={handleRemove}>
        Отменить заявку
      </Button>
    );
  }

  if (relation === 'pending_received') {
    return (
      <Button type="button" size={size} loading={acting} onClick={handleAccept}>
        Принять в друзья
      </Button>
    );
  }

  return (
    <Button type="button" size={size} variant="outline" loading={acting} onClick={handleAdd}>
      В друзья
    </Button>
  );
}

export {
  AddFriendButton,
}
