import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button/Button';
import { createForumReply } from '@/services/forumApi';
import { getErrorMessage } from '@/utils/errorMessage';
import pageStyles from '@/styles/page.module.css';
import styles from './ForumReplyForm.module.css';

interface ForumReplyFormProps {
  topicId: string;
  disabled?: boolean;
  onReplyAdded: () => void;
}

function ForumReplyForm({ topicId, disabled, onReplyAdded }: ForumReplyFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = content.trim().length >= 1 && !disabled;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await createForumReply(topicId, content.trim());
      setContent('');
      toast.success('Ответ опубликован');
      onReplyAdded();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось отправить ответ'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
      <label className="sr-only" htmlFor="forum-reply">Ваш ответ</label>
      <textarea
        id="forum-reply"
        className={styles.textarea}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Напишите ответ…"
        rows={4}
        maxLength={5000}
        disabled={disabled}
        required
      />
      <Button type="submit" size="sm" loading={submitting} disabled={!canSubmit}>
        Отправить ответ
      </Button>
      {disabled && (
        <p className={pageStyles.formError}>Тема закрыта для новых ответов</p>
      )}
    </form>
  );
}

export {
  ForumReplyForm,
}
