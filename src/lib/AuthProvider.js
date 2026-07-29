"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase"; // Make sure db is exported from firebase.js
import { message } from "antd";
import { redirect } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const getLocalDevUser = () => {
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem('dev_user') : null;
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch additional user data from Firestore
          let userDoc = null;
          try {
            userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          } catch (docErr) {
            console.warn("Firestore user fetch warning:", docErr.message);
          }
          
          if (userDoc && userDoc.exists()) {
            setUser({
              tokens: firebaseUser?.stsTokenManager,
              ...userDoc.data()
            });
          } else {
            setUser(firebaseUser);
          }
        } else {
          const devUser = getLocalDevUser();
          setUser(devUser);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        const devUser = getLocalDevUser();
        setUser(devUser);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [messageApi]);

  // useEffect(() => {
  //   if (!loading && !user) {
  //     messageApi.error("You need to be logged in to access this page");
  //     redirect("/auth/login");
  //   }
  // }, [user, loading, messageApi]);

  return (
    <AuthContext.Provider value={{ user, loading, messageApi }}>
      {contextHolder}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}