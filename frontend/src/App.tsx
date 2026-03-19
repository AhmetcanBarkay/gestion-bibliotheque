import { useState, useEffect } from 'react';
import Authentification from './components/Authentication/Authentication'
import Loading from './components/Loading';
import { apiHelper } from './api/apiHelper';
import type { verifyTokenBody } from '@shared/types/api/authApi';
import type { baseResponse } from '@shared/types/api/baseApi';
function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {

        return setIsChecking(false);

      };
      await apiHelper.post<verifyTokenBody, baseResponse>("/auth/verifyToken", { token })
        .then(res => {
          const apiResponse = res.data;

          if (!apiResponse) {
            return;
          };
          if (apiResponse.success) {
            setLoggedIn(true);
          } else {
            localStorage.removeItem("token");
          };
        });

      setIsChecking(false);
    })();
  }, []);

  if (isChecking) {
    return <Loading />
  };
  if (loggedIn) {
    return <div>Connéctée</div>
  };

  return <Authentification setLoggedIn={setLoggedIn} />

}

export default App
