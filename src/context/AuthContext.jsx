import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot, writeBatch, query, where, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

const SELECTED_COMPANY_KEY = 'stockflow_selected_company';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userDept, setUserDept] = useState(null);
  const [userCompany, setUserCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [userName, setUserName] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser = () => { };
    let unsubscribeCompanies = () => { };

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Ensure the caller has a Firestore user doc with company/role so rules pass
        const userRef = doc(db, 'users', currentUser.uid);
        const fallbackCompany = localStorage.getItem(SELECTED_COMPANY_KEY) || null;
        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email || null,
              company: fallbackCompany,
              role: 'DEPARTMENT_USER',
              status: 'active',
              fullName: currentUser.email?.split('@')[0] || 'User',
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
            });
          } else {
            const data = snap.data() || {};
            const patch = {};
            if (!data.company) patch.company = fallbackCompany;
            if (!data.role) patch.role = 'DEPARTMENT_USER';
            if (!data.status) patch.status = 'active';
            patch.lastLoginAt = serverTimestamp();
            if (Object.keys(patch).length) {
              await setDoc(userRef, patch, { merge: true });
            }
          }
        } catch (err) {
          console.error('Failed to bootstrap user doc:', err);
        }

        // REAL-TIME USER DATA
        unsubscribeUser = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const userData = snap.data();
            setUserRole(userData.role);
            setUserName(userData.fullName || 'User');
            setUserDept(userData.department || null);
            setUserPhoto(userData.photoURL || null);
            setUserData(userData);

            const baseCompany = userData.company || null;
            const saved = localStorage.getItem(SELECTED_COMPANY_KEY);
            setUserCompany(saved || baseCompany);
          }
          setLoading(false);
        });

        // REAL-TIME COMPANIES LIST
        unsubscribeCompanies = onSnapshot(collection(db, 'companies'), (snap) => {
          const list = snap.docs
            .map((d) => d.data()?.name)
            .filter(Boolean)
            .sort((a, b) => String(a).localeCompare(String(b)));
          setCompanies(list);

          // Default selection logic
          if (!localStorage.getItem(SELECTED_COMPANY_KEY) && list.length > 0) {
            setUserCompany(list[0]);
            localStorage.setItem(SELECTED_COMPANY_KEY, list[0]);
          }
        });

      } else {
        setUser(null);
        setUserRole(null);
        setUserName(null);
        setUserDept(null);
        setUserPhoto(null);
        setUserData(null);
        setUserCompany(null);
        setCompanies([]);
        unsubscribeUser();
        unsubscribeCompanies();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUser();
      unsubscribeCompanies();
    };
  }, []);

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

    setActiveCompany(name);
  };

  const deleteCompany = async (companyName) => {
    if (!companyName) return;
    await deleteDoc(doc(db, 'companies', companyName));

    if (userCompany === companyName) {
      setActiveCompany(null);
    }
  };

  const updateCompany = async (oldName, newName) => {
    if (!oldName || !newName || oldName === newName) return;
    const cleanNewName = newName.trim();
    if (!cleanNewName) return;

    // This is complex because name is the document ID and used as a foreign key
    // 1. Create new company doc
    const oldDocRef = doc(db, 'companies', oldName);
    const oldSnap = await getDoc(oldDocRef);
    if (!oldSnap.exists()) return;

    const data = oldSnap.data();
    await setDoc(doc(db, 'companies', cleanNewName), {
      ...data,
      name: cleanNewName,
      updatedAt: new Date()
    });

    // 2. Delete old company doc
    await deleteDoc(oldDocRef);

    // 3. Update references in other collections
    const batch = writeBatch(db);
    const collectionsToUpdate = [
      'users',
      'products',
      'departments',
      'incomingStock',
      'outgoingStock',
      'returns',
      'activities',
      'vendors'
    ];

    for (const collName of collectionsToUpdate) {
      const q = query(collection(db, collName), where('company', '==', oldName));
      const snap = await getDocs(q);
      snap.forEach((dRef) => {
        batch.update(doc(db, collName, dRef.id), { company: cleanNewName });
      });
    }

    await batch.commit();

    // 4. Update current selection if it was the modified company
    if (userCompany === oldName) {
      setActiveCompany(cleanNewName);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = useMemo(() => ({
    user,
    userName,
    userPhoto,
    userData,
    userRole,
    userDept,
    userCompany,
    companies,
    setActiveCompany,
    createCompany,
    updateCompany,
    deleteCompany,
    loading,
    logout,
  }), [user, userName, userPhoto, userData, userRole, userDept, userCompany, companies, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
