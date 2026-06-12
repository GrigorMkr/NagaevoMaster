import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout/Layout';
import { HomePage } from '@/pages/HomePage/HomePage';
import { ServicesPage } from '@/pages/ServicesPage/ServicesPage';
import { ServicesCategoryPage } from '@/pages/ServicesCategoryPage/ServicesCategoryPage';
import { ServiceDetailPage } from '@/pages/ServiceDetailPage/ServiceDetailPage';
import { ForumPage } from '@/pages/ForumPage/ForumPage';
import { ForumCategoryPage } from '@/pages/ForumCategoryPage/ForumCategoryPage';
import { ForumTopicPage } from '@/pages/ForumTopicPage/ForumTopicPage';
import { SearchPage } from '@/pages/SearchPage/SearchPage';
import { AddListingPage } from '@/pages/AddListingPage/AddListingPage';
import { ProfilePage } from '@/pages/ProfilePage/ProfilePage';
import { AuthPage } from '@/pages/AuthPage/AuthPage';
import { AboutPage } from '@/pages/AboutPage/AboutPage';
import { ContactPage } from '@/pages/ContactPage/ContactPage';
import { NewsPage } from '@/pages/NewsPage/NewsPage';
import { NotFoundPage } from '@/pages/NotFoundPage/NotFoundPage';
function AppRoutes() {
    return (<Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />}/>
        <Route path="services" element={<ServicesPage />}/>
        <Route path="services/beauty/:subcategory" element={<ServicesCategoryPage />}/>
        <Route path="services/:category" element={<ServicesCategoryPage />}/>
        <Route path="service/:id" element={<ServiceDetailPage />}/>
        <Route path="forum" element={<ForumPage />}/>
        <Route path="forum/topic/:id" element={<ForumTopicPage />}/>
        <Route path="forum/:category" element={<ForumCategoryPage />}/>
        <Route path="news" element={<NewsPage />}/>
        <Route path="search" element={<SearchPage />}/>
        <Route path="add-listing" element={<AddListingPage />}/>
        <Route path="profile" element={<ProfilePage />}/>
        <Route path="auth" element={<AuthPage />}/>
        <Route path="about" element={<AboutPage />}/>
        <Route path="contact" element={<ContactPage />}/>
        <Route path="*" element={<NotFoundPage />}/>
      </Route>
    </Routes>);
}

export {
  AppRoutes,
}
