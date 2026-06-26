import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button/Button';
import { FORUM_CATEGORIES } from '@/data/categories';
import { createForumTopic, type ForumTopicListItem } from '@/services/forumApi';
import { forumTopicPath } from '@/utils/constants';
import { validateUserContent } from '@/constants/communityRules';
import { ECHO_FORM_ACTION } from '@/constants/forms';
import { getErrorMessage } from '@/utils/errorMessage';
import pageStyles from '@/styles/page.module.css';
import styles from './ForumNewTopicForm.module.css';

interface ForumNewTopicFormProps {
  defaultCategory?: string;
  onCreated?: (topic: ForumTopicListItem) => void;
}

function ForumNewTopicForm({ defaultCategory, onCreated }: ForumNewTopicFormProps) {
  const navigate = useNavigate();
  const [category, setCategory] = useState(defaultCategory ?? '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    Boolean(category) &&
    title.trim().length >= 5 &&
    content.trim().length >= 10;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const contentError = validateUserContent(title, content);
      if (contentError) {
        toast.error(contentError);
        return;
      }
      const topic = await createForumTopic({
        category,
        title: title.trim(),
        content: content.trim(),
      });
      toast.success('Тема создана');
      if (onCreated) {
        onCreated(topic);
        setTitle('');
        setContent('');
        if (!defaultCategory) setCategory('');
      } else {
        navigate(forumTopicPath(topic.id));
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Не удалось создать тему'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} action={ECHO_FORM_ACTION} method="post" onSubmit={(event) => void handleSubmit(event)}>
      <h2 className={styles.title}>Новая тема</h2>

      {!defaultCategory && (
        <label className={styles.field}>
          <span>Категория</span>
          <select
            className={styles.select}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            required
          >
            <option value="">Выберите категорию</option>
            {FORUM_CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        </label>
      )}

      <label className={styles.field}>
        <span>Заголовок</span>
        <input
          className={pageStyles.input}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="О чём хотите поговорить?"
          minLength={5}
          maxLength={200}
          required
        />
      </label>

      <label className={styles.field}>
        <span>Текст темы</span>
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Опишите вопрос или тему для обсуждения…"
          rows={5}
          minLength={10}
          maxLength={5000}
          required
        />
        {content.trim().length > 0 && content.trim().length < 10 && (
          <span className={pageStyles.formError}>Минимум 10 символов</span>
        )}
      </label>


      <Button type="submit" loading={submitting} disabled={!canSubmit}>
        Опубликовать тему
      </Button>
    </form>
  );
}

export {
  ForumNewTopicForm,
}
