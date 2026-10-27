import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroSearch from './components/HeroSearch';
import SearchResults from './components/SearchResults';
import CompareSection from './components/CompareSection';
import AlertsSection from './components/AlertsSection';
import AlertModal from './components/AlertModal';
import Toast from './components/Toast';
import Footer from './components/Footer';
import { API } from './services/api';

export default function App() {
  const [alerts, setAlerts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pr_alerts') || '[]');
    } catch {
      return [];
    }
  });

  const [searchData, setSearchData] = useState({
    query: '',
    all: [],
    by_platform: {},
    isSearching: false,
    isDemo: false,
    hasSearched: false
  });

  const [compareData, setCompareData] = useState({
    product: null,
    results: [],
    isLoading: false
  });

  const [modalState, setModalState] = useState({
    isOpen: false,
    defaultProduct: ''
  });

  const [toast, setToast] = useState({
    show: false,
    msg: '',
    icon: '✓'
  });

  const showToast = (msg, icon = '✓', duration = 3000) => {
    setToast({ show: true, msg, icon });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, duration);
  };

  const handleSearch = async (query, platforms) => {
    setSearchData(prev => ({
      ...prev,
      query,
      isSearching: true,
      hasSearched: true
    }));

    try {
      const data = await API.search(query, platforms);
      setSearchData({
        query,
        all: data.all || [],
        by_platform: data.by_platform || {},
        isSearching: false,
        hasSearched: true
      });

      if (!data.all || data.all.length === 0) {
        showToast(`No live deals found for "${query}"`, '🔍', 4000);
      } else {
        setTimeout(() => {
          document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (err) {
      console.error(err);
      setSearchData(prev => ({ ...prev, isSearching: false }));
      showToast('Search encountered an error. Please try again.', '✕', 4000);
    }
  };

  const handleCompare = async (product) => {
    setCompareData({
      product,
      results: [],
      isLoading: true
    });

    setTimeout(() => {
      document.getElementById('compare-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    showToast('Comparing prices across platforms…', '🔍', 2500);

    try {
      const data = await API.compare(product.name);
      setCompareData({
        product,
        results: data.results || [],
        isLoading: false
      });
    } catch (err) {
      console.error(err);
      setCompareData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSaveAlert = (newAlert) => {
    const updated = [...alerts, newAlert];
    setAlerts(updated);
    localStorage.setItem('pr_alerts', JSON.stringify(updated));
    showToast(`Alert saved for ₹${newAlert.targetPrice.toLocaleString('en-IN')}`, '🔔');
  };

  const handleDeleteAlert = (id) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    localStorage.setItem('pr_alerts', JSON.stringify(updated));
    showToast('Alert removed', '✓');
  };

  const handleOpenAlert = (productName = '') => {
    setModalState({
      isOpen: true,
      defaultProduct: productName
    });
  };

  const handleCloseAlert = () => {
    setModalState({
      isOpen: false,
      defaultProduct: ''
    });
  };

  return (
    <>
      <div className="bg-texture" aria-hidden="true" />

      <Toast toast={toast} />

      <AlertModal
        isOpen={modalState.isOpen}
        defaultProduct={modalState.defaultProduct}
        onClose={handleCloseAlert}
        onSaveAlert={handleSaveAlert}
      />

      <Header onOpenAlert={handleOpenAlert} />

      <main>
        <HeroSearch
          onSearch={handleSearch}
          isSearching={searchData.isSearching}
        />

        {searchData.hasSearched && (
          <SearchResults
            query={searchData.query}
            allProducts={searchData.all}
            byPlatform={searchData.by_platform}
            isDemo={searchData.isDemo}
            onCompare={handleCompare}
          />
        )}

        <CompareSection
          product={compareData.product}
          compareResults={compareData.results}
          isLoading={compareData.isLoading}
          onOpenAlert={handleOpenAlert}
        />

        <AlertsSection
          alerts={alerts}
          onDeleteAlert={handleDeleteAlert}
        />
      </main>

      <Footer />
    </>
  );
}
