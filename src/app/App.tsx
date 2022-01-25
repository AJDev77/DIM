import { settingSelector } from 'app/dim-api/selectors';
import { set } from 'app/storage/idb-keyval';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import React, { Suspense, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router';
import styles from './App.m.scss';
import Developer from './developer/Developer';
import ActivityTracker from './dim-ui/ActivityTracker';
import ClickOutsideRoot from './dim-ui/ClickOutsideRoot';
import ErrorBoundary from './dim-ui/ErrorBoundary';
import PageLoading from './dim-ui/PageLoading';
import ShowPageLoading from './dim-ui/ShowPageLoading';
import HotkeysCheatSheet from './hotkeys/HotkeysCheatSheet';
import { t } from './i18next-t';
import Login from './login/Login';
import NotificationsContainer from './notifications/NotificationsContainer';
import About from './shell/About';
import AccountRedirectRoute from './shell/AccountRedirectRoute';
import DefaultAccount from './shell/DefaultAccount';
import Destiny from './shell/Destiny';
import ErrorPanel from './shell/ErrorPanel';
import GATracker from './shell/GATracker';
import Header from './shell/Header';
import Privacy from './shell/Privacy';
import ScrollToTop from './shell/ScrollToTop';
import SneakyUpdates from './shell/SneakyUpdates';
import { deleteDatabase } from './storage/idb-keyval';
import { reportException } from './utils/exceptions';
import { errorLog } from './utils/log';

const WhatsNew = React.lazy(
  () => import(/* webpackChunkName: "whatsNew" */ './whats-new/WhatsNew')
);

// These three are all from the same chunk
const SettingsPage = React.lazy(async () => ({
  default: (await import(/* webpackChunkName: "settings" */ './settings/components')).SettingsPage,
}));
const SearchHistory = React.lazy(
  () => import(/* webpackChunkName: "searchHistory" */ './search/SearchHistory')
);

export default function App() {
  const language = useSelector(settingSelector('language'));
  const itemQuality = useSelector(settingSelector('itemQuality'));
  const showNewItems = useSelector(settingSelector('showNewItems'));
  const charColMobile = useSelector(settingSelector('charColMobile'));
  const needsLogin = useSelector((state: RootState) => state.accounts.needsLogin);
  const needsDeveloper = useSelector((state: RootState) => state.accounts.needsDeveloper);
  const storageWorks = useStorageTest();

  if (!storageWorks) {
    return (
      <div className="dim-page">
        <ErrorPanel
          title={t('Help.NoStorage')}
          fallbackMessage={t('Help.NoStorageMessage')}
          showTwitters={true}
        />
      </div>
    );
  }

  return (
    <div
      key={`lang-${language}`}
      className={clsx(styles.app, `lang-${language}`, `char-cols-${charColMobile}`, {
        itemQuality,
        'show-new-items': showNewItems,
      })}
    >
      <ScrollToTop />
      <GATracker />
      <SneakyUpdates />
      <ClickOutsideRoot>
        <Header />
        <PageLoading />
        <ErrorBoundary name="DIM Code">
          <Suspense fallback={<ShowPageLoading message={t('Loading.Code')} />}>
            <Routes>
              <Route path="about" element={<About />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="whats-new" element={<WhatsNew />} />
              <Route path="login" element={<Login />} />
              <Route path="settings" element={<SettingsPage />} />
              {$DIM_FLAVOR === 'dev' && <Route path="developer" element={<Developer />} />}
              {needsLogin ? (
                <Route
                  path="*"
                  element={
                    $DIM_FLAVOR === 'dev' && needsDeveloper ? (
                      <Navigate to="/developer" />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
              ) : (
                <>
                  <Route path="search-history" element={<SearchHistory />} />
                  <Route path=":membershipId/d:destinyVersion/*" element={<Destiny />} />
                  {[
                    'inventory',
                    'progress',
                    'records',
                    'optimizer',
                    'loadouts',
                    'organizer',
                    'vendors/:vendorId',
                    'vendors',
                    'record-books',
                    'activities',
                    'armory/:itemHash',
                  ].map((path) => (
                    <Route key={path} path={path} element={<AccountRedirectRoute />} />
                  ))}
                  <Route
                    path="*"
                    element={
                      needsLogin ? (
                        $DIM_FLAVOR === 'dev' && needsDeveloper ? (
                          <Navigate to="developer" />
                        ) : (
                          <Navigate to="login" />
                        )
                      ) : (
                        <DefaultAccount />
                      )
                    }
                  />
                </>
              )}
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <NotificationsContainer />
        <ActivityTracker />
        <HotkeysCheatSheet />
      </ClickOutsideRoot>
    </div>
  );
}

/** Test that localStorage and IndexedDB work */
function useStorageTest() {
  const [storageWorks, setStorageWorks] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        localStorage.setItem('test', 'true');
      } catch (e) {
        errorLog('storage', 'Failed localStorage Test', e);
        setStorageWorks(false);
        return;
      }

      if (!window.indexedDB) {
        errorLog('storage', 'IndexedDB not available');
        setStorageWorks(false);
        return;
      }

      try {
        await set('idb-test', true);
      } catch (e) {
        errorLog('storage', 'Failed IndexedDB Test - trying to delete database', e);
        try {
          await deleteDatabase();
          await set('idb-test', true);
          // Report to sentry, I want to know if this ever works
          reportException('deleting database fixed IDB', e);
        } catch (e2) {
          errorLog('storage', 'Failed IndexedDB Test - deleting database did not help', e);
          setStorageWorks(false);
        }
      }
    })();
  }, []);

  return storageWorks;
}
