import { createBrowserRouter } from 'react-router-dom';

import EditorLayout from './apps/editor';

import LayoutDefault from './apps/web/layouts';
import HomeClient from './apps/web/pages/home';
import WebListSpace from './apps/web/pages/space-list';
import WebAboutUs from './apps/web/pages/about-us';
import WebContact from './apps/web/pages/contact';
import WebSpace from './apps/web/pages/space-detail';
import WebUser from './apps/web/pages/user-profile';
import Guide from './apps/web/pages/guide/Guide';
import News from './apps/web/pages/news/News';
import NewsDetail from './apps/web/pages/news-detail/NewsDetail';

import HomeEditor from './apps/editor/App';

import TestAPI from './apps/test-api';
import Space from './apps/web/pages/space-detail';
import ManageSpace from './apps/web/pages/manage-space/ManageSpace';
import ManageResource from './apps/web/pages/manage-resource/ManageResource';
import PricingPage from './apps/web/pages/pricing-page/PricingPage';
import ManageUser from './apps/web/pages/manage-user/ManageUser';
import ManageNews from './apps/web/pages/manage-news/ManageNews';

export const router = createBrowserRouter([
  {
    element: <LayoutDefault />,
    children: [
      { index: true, element: <HomeClient /> },
      { path: '/listspace', element: <WebListSpace /> },
      { path: '/about', element: <WebAboutUs /> },
      { path: '/contact', element: <WebContact /> },
      { path: '/space/:prop', element: <WebSpace /> },
      { path: '/user/:prop', element: <WebUser /> },
      { path: '/user', element: <WebUser /> },

      { path: '/guide', element: <Guide /> },
      { path: '/pricing', element: <PricingPage /> },

      { path: '/news', element: <News /> },
      { path: '/news/:id', element: <NewsDetail /> },

      { path: '/manage/news', element: <ManageNews /> },
      { path: '/manage/user', element: <ManageUser /> },
      { path: '/manage/space', element: <ManageSpace /> },
      { path: '/manage/resource', element: <ManageResource /> },

      { path: 'test-api', element: <TestAPI /> },
    ],
  },
  {
    path: '/editor',
    element: <EditorLayout />,
    children: [{ index: true, element: <HomeEditor /> }],
  },
  {
    path: '/exhibition-edit/:slug',
    element: <EditorLayout />,
    children: [{ index: true, element: <HomeEditor /> }],
  },
  {
    path: '/exhibition/:slug',
    element: <EditorLayout />,
    children: [{ index: true, element: <HomeEditor /> }],
  },
  {
    path: '/template-edit/:slug',
    element: <EditorLayout />,
    children: [{ index: true, element: <HomeEditor /> }],
  },
  {
    path: '/template/:slug',
    element: <EditorLayout />,
    children: [{ index: true, element: <HomeEditor /> }],
  },
]);
