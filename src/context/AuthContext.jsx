import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

const SELECTED_COMPANY_KEY = 'stockflow_selected_company';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userCompany, setUserCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user role and company from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
          const baseCompany = userData.company || null;
          const saved = localStorage.getItem(SELECTED_COMPANY_KEY);
          setUserCompany(saved || baseCompany);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserCompany(null);
        setCompanies([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const loadCompanies = async () => {
      if (!user) return;

      // Fetch all companies so any user can select them
      const snap = await getDocs(collection(db, 'companies'));
      const list = snap.docs
        .map((d) => d.data()?.name)
        .filter(Boolean)
        .sort((a, b) => String(a).localeCompare(String(b)));
      setCompanies(list);

      // If no company is selected yet, default to the first available
      if (!userCompany && list.length > 0) {
        setUserCompany(list[0]);
        localStorage.setItem(SELECTED_COMPANY_KEY, list[0]);
      }
    };

    loadCompanies().catch((e) => console.error('Error loading companies', e));
  }, [user, userRole, userCompany]);

  const setActiveCompany = (companyName) => {
    setUserCompany(companyName);
    if (companyName) localStorage.setItem(SELECTED_COMPANY_KEY, companyName);
    else localStorage.removeItem(SELECTED_COMPANY_KEY);
  };

  const createCompany = async (companyName) => {
    if (!companyName) return;
    const name = companyName.trim();
    if (!name) return;

    await setDoc(doc(db, 'companies', name), {
      name,
      createdAt: new Date(),
      status: 'active',
      createdBy: user?.uid || null,
    });

    if (userRole === 'SUPER_ADMIN') {
      setCompanies((prev) => Array.from(new Set([...(prev || []), name])).sort((a, b) => a.localeCompare(b)));
    }
    setActiveCompany(name);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = useMemo(() => ({
    user,
    userRole,
    userCompany,
    companies,
    setActiveCompany,
    createCompany,
    loading,
    logout,
  }), [user, userRole, userCompany, companies, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
