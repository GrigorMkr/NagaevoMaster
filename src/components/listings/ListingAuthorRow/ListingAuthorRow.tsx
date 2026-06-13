import type { ListingAuthor } from '@/types/listing';
import { UserAvatar } from '@/components/ui/UserAvatar/UserAvatar';
import styles from './ListingAuthorRow.module.css';

interface ListingAuthorRowProps {
  author: ListingAuthor;
  compact?: boolean;
}

function ListingAuthorRow({ author, compact = false }: ListingAuthorRowProps) {
  return (
    <div className={compact ? styles.rowCompact : styles.row}>
      <UserAvatar name={author.name} src={author.avatarUrl} size={compact ? 'sm' : 'md'} />
      <div className={styles.info}>
        <span className={styles.name}>{author.name}</span>
        <span className={styles.login}>@{author.login}</span>
      </div>
    </div>
  );
}

export {
  ListingAuthorRow,
}
