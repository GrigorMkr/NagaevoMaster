import { memo } from 'react';
import { Link } from 'react-router-dom';
import { BoardPortalGrid } from '@/components/board/BoardPortalGrid/BoardPortalGrid';
import { boardPath } from '@/constants';
import { SectionHead } from './SectionHead';
import styles from '../HomePage.module.css';

const BoardPortalSection = memo(function BoardPortalSection() {
  return (
    <div className={styles.contentBlock}>
      <SectionHead
        badge="Соседи"
        title="Доска объявлений"
        description="Продажа, работа и потеряшки — всё в одном месте."
      />
      <BoardPortalGrid compact />
      <p className={styles.boardMore}>
        <Link to={boardPath()} className={styles.moreLink}>Все разделы доски →</Link>
      </p>
    </div>
  );
});

export {
  BoardPortalSection,
};
