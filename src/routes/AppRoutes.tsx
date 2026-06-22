import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout/Layout';
import { RequireAuth } from '@/components/routing/RequireAuth/RequireAuth';
import { HomePage } from '@/pages/HomePage/HomePage';
import { BoardKindPage } from '@/pages/BoardKindPage/BoardKindPage';
import { BoardHubPage } from '@/pages/BoardHubPage/BoardHubPage';
import { ServicesPage } from '@/pages/ServicesPage/ServicesPage';
import { ServicesCategoryPage } from '@/pages/ServicesCategoryPage/ServicesCategoryPage';
import { ServiceDetailPage } from '@/pages/ServiceDetailPage/ServiceDetailPage';
import { ForumPage } from '@/pages/ForumPage/ForumPage';
import { ForumCategoryPage } from '@/pages/ForumCategoryPage/ForumCategoryPage';
import { ForumTopicPage } from '@/pages/ForumTopicPage/ForumTopicPage';
import { SearchPage } from '@/pages/SearchPage/SearchPage';
import { AddListingPage } from '@/pages/AddListingPage/AddListingPage';
import { EditListingPage } from '@/pages/EditListingPage/EditListingPage';
import { ProfilePage } from '@/pages/ProfilePage/ProfilePage';
import { AuthPage } from '@/pages/AuthPage/AuthPage';
import { AboutPage } from '@/pages/AboutPage/AboutPage';
import { ContactPage } from '@/pages/ContactPage/ContactPage';
import { NewsPage } from '@/pages/NewsPage/NewsPage';
import { MessagesRedirect } from '@/pages/MessagesPage/MessagesRedirect';
import { AppDownloadPage } from '@/pages/AppDownloadPage/AppDownloadPage';
import { NativeOAuthReturnPage } from '@/pages/NativeOAuthReturnPage/NativeOAuthReturnPage';
import { NotFoundPage } from '@/pages/NotFoundPage/NotFoundPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route
          path="board"
          element={(
            <RequireAuth>
              <BoardHubPage />
            </RequireAuth>
          )}
        />
        <Route
          path="board/:kind"
          element={(
            <RequireAuth>
              <BoardKindPage />
            </RequireAuth>
          )}
        />
        <Route
          path="services"
          element={(
            <RequireAuth>
              <ServicesPage />
            </RequireAuth>
          )}
        />
        <Route
          path="services/beauty/:subcategory"
          element={(
            <RequireAuth>
              <ServicesCategoryPage />
            </RequireAuth>
          )}
        />
        <Route
          path="services/:category"
          element={(
            <RequireAuth>
              <ServicesCategoryPage />
            </RequireAuth>
          )}
        />
        <Route
          path="service/:id"
          element={(
            <RequireAuth>
              <ServiceDetailPage />
            </RequireAuth>
          )}
        />
        <Route
          path="forum"
          element={(
            <RequireAuth>
              <ForumPage />
            </RequireAuth>
          )}
        />
        <Route
          path="forum/topic/:id"
          element={(
            <RequireAuth>
              <ForumTopicPage />
            </RequireAuth>
          )}
        />
        <Route
          path="forum/:category"
          element={(
            <RequireAuth>
              <ForumCategoryPage />
            </RequireAuth>
          )}
        />
        <Route path="news" element={<NewsPage />} />
        <Route
          path="search"
          element={(
            <RequireAuth>
              <SearchPage />
            </RequireAuth>
          )}
        />
        <Route path="add-listing" element={<AddListingPage />} />
        <Route path="edit-listing/:id" element={<EditListingPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="messages" element={<MessagesRedirect />} />
        <Route path="messages/:conversationId" element={<MessagesRedirect />} />
        <Route path="auth/app-return" element={<NativeOAuthReturnPage />} />
        <Route path="auth" element={<AuthPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="app" element={<AppDownloadPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export {
  AppRoutes,
};
