import { Outlet, useLocation } from 'react-router-dom';
import { ScrollToTop } from '@/components/routing/ScrollToTop';
import { IosSafariPushBanner } from '@/components/push/IosSafariPushBanner/IosSafariPushBanner';
import { Header } from '../Header/Header';
import { Footer } from '../Footer/Footer';
import { CookieConsent } from '../CookieConsent/CookieConsent';
import { NativeTabBar } from '@/components/native/NativeTabBar/NativeTabBar';
import styles from './Layout.module.css';
function Layout() {
    const location = useLocation();
    return (<div className={styles.layout}>
      <ScrollToTop />
      <div className="siteSurface" aria-hidden="true">
        <div className="siteSurface__photo siteSurface__photo1"/>
        <div className="siteSurface__photo siteSurface__photo2"/>
        <div className="siteSurface__photo siteSurface__photo3"/>
        <div className="siteSurface__photo siteSurface__photo4"/>
        <div className="siteSurface__photo siteSurface__photo5"/>
        <div className="siteSurface__photo siteSurface__photo6"/>
        <div className="siteSurface__veil"/>
        <div className="siteSurface__wash"/>
        <div className="siteSurface__blob siteSurface__blobGreen"/>
        <div className="siteSurface__blob siteSurface__blobGold"/>
        <div className="siteSurface__blob siteSurface__blobCoral"/>
        <div className="siteSurface__blob siteSurface__blobMint"/>
        <div className="siteSurface__ring siteSurface__ring1"/>
        <div className="siteSurface__ring siteSurface__ring2"/>
        <div className="siteSurface__sparkles"/>
        <div className="siteSurface__grid"/>
        <div className="siteSurface__hills"/>
        <div className="siteSurface__shine"/>
      </div>

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
