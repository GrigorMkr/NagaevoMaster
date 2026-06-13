import { useState } from 'react';
import toast from 'react-hot-toast';
import { PageMeta } from '@/components/ui/PageMeta/PageMeta';
import { PageHeader } from '@/components/ui/PageHeader/PageHeader';
import { Button } from '@/components/ui/Button/Button';
import { SERVICE_CATEGORIES } from '@/data/categories';
import { getCategoryCover } from '@/data/mock/listingImages';
import { Reveal } from '@/components/ui/Reveal/Reveal';
import pageStyles from '@/styles/page.module.css';
import styles from './AddListingPage.module.css';
const STEPS = [
    'Категория',
    'Подкатегория',
    'Описание',
    'Фото',
    'Предпросмотр',
    'Публикация',
];
function AddListingPage() {
    const [step, setStep] = useState(0);
    const [category, setCategory] = useState('');
    const selectedCat = SERVICE_CATEGORIES.find((c) => c.slug === category);
    const handlePublish = () => {
        toast.success('Объявление отправлено на модерацию (демо)');
    };
    return (<>
      <PageMeta title="Добавить объявление" canonical="/add-listing"/>

      <div className={pageStyles.page}>
        <div className="container">
          <PageHeader badge="Мастерам" title="Добавить объявление" subtitle="6 шагов — с модерацией перед публикацией"/>

          <Reveal delay={60}>
            <ol className={styles.steps}>
              {STEPS.map((label, i) => (<li key={label} className={i === step ? styles.stepActive : i < step ? styles.stepDone : ''}>
                  {i + 1}. {label}
                </li>))}
            </ol>
          </Reveal>

          <Reveal delay={100}>
          <div className={styles.panel} key={step}>
            {step === 0 && (<div className={`${styles.categoryGrid} motion-stagger`}>
                {SERVICE_CATEGORIES.map((cat) => (<button key={cat.slug} type="button" className={category === cat.slug ? styles.categoryButtonActive : styles.categoryButton} onClick={() => setCategory(cat.slug)}>
                    <span className={styles.categoryThumb}>
                      <img className={styles.categoryThumbImage} src={getCategoryCover(cat.slug)} alt="" loading="lazy" />
                    </span>
                    <span className={styles.categoryName}>{cat.name}</span>
                  </button>))}
              </div>)}

            {step === 1 && selectedCat && (<div className={styles.categoryGrid}>
                {selectedCat.subcategories.map((sub) => (<span key={sub.slug} className={styles.subcategoryTag}>{sub.name}</span>))}
              </div>)}

            {step === 2 && (<textarea className={pageStyles.input} rows={6} placeholder="Описание услуги, цена, опыт..." aria-label="Описание"/>)}

            {step === 3 && (<div className={styles.upload}>
                <p>Drag & drop — до 10 фото (подключите загрузку к API)</p>
              </div>)}

            {step === 4 && (<p className="textMuted">Предпросмотр карточки перед отправкой</p>)}

            {step === 5 && (<p>Объявление будет проверено модератором перед публикацией.</p>)}
          </div>

          <div className={styles.nav}>
            {step > 0 && (<Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                Назад
              </Button>)}
            {step < STEPS.length - 1 ? (<Button onClick={() => setStep((s) => s + 1)} disabled={step === 0 && !category}>
                Далее
              </Button>) : (<Button onClick={handlePublish}>Опубликовать</Button>)}
          </div>
          </Reveal>
        </div>
      </div>
    </>);
}

export {
  AddListingPage,
}
