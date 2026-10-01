import PageLayout from "./components/PageLayout.jsx";
import React, {useEffect, useState} from "react";
import {Route, Routes, useNavigate} from "react-router-dom";
import MainContainer from "./components/MainContainer.jsx";
import About from "./components/About.jsx";
import LoginForm from "./components/auth/LoginForm.jsx";
import fetcher from "./utils/fetcher.js";
import ErrorPage from "./components/ErrorPage.jsx";
import Logout from "./components/auth/Logout.jsx";
import EmprunteurHome from "./components/page/EmprunteurHome.jsx";
import PreposeHome from "./components/page/PreposeHome.jsx";
import GestionnaireValidation from "./components/page/GestionnaireValidation.jsx";
import RegisterForm from "./components/auth/RegisterForm.jsx";
import {createTranslationMessage} from "./utils/i18nMessage.js";

function App() {
  const [user, setUser] = useState({})
  const [authChecked, setAuthChecked] = useState(() => !localStorage.getItem('token'))
  const [error, setError] = useState(null)
  const navigate = useNavigate();

  let token = localStorage.getItem('token')

  useEffect(() => {
      if (token) {
        setAuthChecked(false);

        try {
          fetcher('user/me', {})
            .then(async (res) => {
                if (!res.ok) {
                  switch (res.status) {
                    case 401:
                      localStorage.clear();
                      setUser(null);
                      throw {status: 401, ...createTranslationMessage("errors.unauthorized")};
                    case 403:
                      throw {status: 403, ...createTranslationMessage("errors.forbidden")};
                    case 404:
                      throw {status: 404, ...createTranslationMessage("errors.notFound")};
                    default:
                      throw {status: res.status, ...createTranslationMessage("errors.requestFailedGeneric")};
                  }
                }
                const data = await res.json();
                let newUser = {...data, isLoggedIn: true}
                setUser(newUser)
              }
            ).catch(async (err) => {
            setError(err?.key ? err : createTranslationMessage("errors.requestFailedGeneric"))
              navigate('/error')
            }).finally(() => {
              setAuthChecked(true)
          })

        } catch (err) {
          if (!error) {
            setError(err?.key ? err : createTranslationMessage("errors.requestFailedGeneric"))
            navigate('/error')
          }
          setAuthChecked(true)
        }
      } else {
        setAuthChecked(true)
      }
      }, [token]
  );

  return (
    <div>
      <Routes>
        <Route path="/" element={<PageLayout user={user}/>}>
          <Route index element={<MainContainer setError={setError}/>}/>
          <Route path='about' element={<About/>}/>
          <Route path='login' element={<LoginForm user={user} authChecked={authChecked} setError={setError}/>}/>
          <Route path='logout' element={<Logout setUser={setUser}/>}/>
          <Route path='emprunteur' element={<EmprunteurHome/>}/>
          <Route path='prepose' element={<PreposeHome/>}/>
          <Route path='gestionnaire' element={<GestionnaireValidation/>}/>
          <Route path= 'register' element={<RegisterForm user={user} authChecked={authChecked} setError={setError}/>}/>
          <Route path='error' element={<ErrorPage error={error}/>}/>
          <Route path='*' element={<ErrorPage error={{status: 404}}/>}/>
        </Route>
      </Routes>

    </div>
  );
}

export default App;
