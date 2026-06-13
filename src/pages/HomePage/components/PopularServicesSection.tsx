import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { POPULAR_SERVICES } from '@/data/mockListings';
import { getListingImages } from '@/data/mock/listingImages';
import { searchPath } from '@/constants';
import { SectionHead } from './SectionHead';
import styles from '../HomePage.module.css';

const PopularServicesSection = memo(function PopularServicesSection() {
    return (<div className={styles.contentBlock}>
      <SectionHead badge="Популярно" title="16 популярных услуг"/>
      <div className={styles.popularGrid}>
        {POPULAR_SERVICES.map((item) => {
            const cover = getListingImages(item.category, item.subcategory, item.id)[0] ?? '';

            return (
              <PopularServiceCard
                key={item.id}
                to={searchPath(item.title)}
                cover={cover}
                title={item.title}
                count={item.count}
                icon={item.icon}
              />
            );
        })}
      </div>
    </div>);
});

interface PopularServiceCardProps {
  to: string;
  cover: string;
  title: string;
  count: number;
  icon: string;
}

function PopularServiceCard({ to, cover, title, count, icon }: PopularServiceCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link to={to} className={styles.popularCard}>
      <div className={styles.popularMedia}>
        {cover && !imageFailed ? (
          <img
            className={styles.popularImage}
            src={cover}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className={styles.popularIcon}>{icon}</span>
        )}
      </div>
      <span className={styles.popularTitle}>{title}</span>
      <span className={styles.popularCount}>{count} мастеров</span>
    </Link>
  );
}

export {
  PopularServicesSection,
}
