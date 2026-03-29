import { useState, useEffect } from 'react';
import Authentification from './components/Authentication/Authentication'
import Loading from './components/Loading';
import { AUTH_INVALID_EVENT, apiHelper } from './api/apiHelper';
import type { verifyTokenBody, verifyTokenResponse } from '@shared/types/api/authApi';
import type { Role } from '@shared/types/roles';
import Authenticated from './components/Authenticated/Authenticated';


function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [role, setRole] = useState<Role | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  const forceLogout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
    setRole(null);
    setUsername(null);
    setIsChecking(false);
  };

  useEffect(() => {
    const onAuthInvalid = () => {
      forceLogout();
    };

    window.addEventListener(AUTH_INVALID_EVENT, onAuthInvalid);
    return () => {
      window.removeEventListener(AUTH_INVALID_EVENT, onAuthInvalid);
    };
  }, []);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {

        return setIsChecking(false);

      };
      await apiHelper.post<verifyTokenBody, verifyTokenResponse>("/auth/verifyToken", { token })
        .then(res => {
          const apiResponse = res.data;

          if (!apiResponse) {
            return;
          };
          if (apiResponse.success) {
            setLoggedIn(true);
            setRole(apiResponse.role || null);
            setUsername(apiResponse.username || null);
          } else {
            forceLogout();
          };
        });

      setIsChecking(false);
    })();
  }, []);

  if (isChecking) {
    return <Loading />
  };

  const handleLogout = () => {
    forceLogout();
  };

  return (
    <div>
      {loggedIn ?
        <Authenticated
          role={role}
          username={username}
          onLogout={handleLogout}
        /> :
        <Authentification onAuthSuccess={({ role, username }) => {
          setLoggedIn(true);
          setRole(role);
          setUsername(username);
        }} />}
    </div>
  )

}

export default App
