import { Outlet, useLocation } from 'react-router-dom';
import { ScrollToTop } from '@/components/routing/ScrollToTop';
import { IosSafariPushBanner } from '@/components/push/IosSafariPushBanner/IosSafariPushBanner';
import { Header } from '../Header/Header';
import { Footer } from '../Footer/Footer';
import { CookieConsent } from '../CookieConsent/CookieConsent';
import { NativeTabBar } from '@/components/native/NativeTabBar/NativeTabBar';
import { SiteBackground } from '@/components/layout/SiteBackground/SiteBackground';
import styles from './Layout.module.css';
function Layout() {
    const location = useLocation();
    return (<div className={styles.layout}>
      <ScrollToTop />
      <SiteBackground />

      <Header />
      <IosSafariPushBanner />
      <main className={styles.main}>
        <div className={styles.mainInner}>
          <Outlet key={location.pathname}/>
        </div>
      </main>
      <Footer />
      <NativeTabBar />
      <CookieConsent />
    </div>);
}

export {
  Layout,
}
