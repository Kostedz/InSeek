import PageLayout from "./components/PageLayout.jsx";
import React, {useEffect, useState} from "react";
import {Route, Routes, useNavigate} from "react-router-dom";
import MainContainer from "./components/MainContainer.jsx";
import EtudiantAccueil from "./components/page/EtudiantAccueil.jsx";
import About from "./components/About.jsx";
import LoginForm from "./components/auth/LoginForm.jsx";
import fetcher from "./utils/fetcher.js";
import ErrorPage from "./components/ErrorPage.jsx";
import Logout from "./components/auth/Logout.jsx";
import GestionnaireValidation from "./components/page/GestionnaireValidation.jsx";
import EtudiantTeleverseCV from "./components/page/EtudiantTeleverseCV.jsx";
import EmployeurOffres from "./components/page/EmployeurOffres.jsx";
import RegisterForm from "./components/auth/RegisterForm.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import {createTranslationMessage} from "./utils/i18nMessage.js";
import {useTranslation} from "react-i18next";
import GestionnaireCvValidation from "./components/page/GestionnaireCvValidation.jsx";

function App() {
  const [user, setUser] = useState({})
  const [authChecked, setAuthChecked] = useState(() => !localStorage.getItem('token'))
  const [error, setError] = useState(null)
  const navigate = useNavigate();
  const { t } = useTranslation();
    const userRole = String(user?.role ?? "").replace(/^ROLE_/, "").toUpperCase();

  let token = localStorage.getItem('token')

    useEffect(() => {
        Object.keys(localStorage)
            .filter((key) => key.startsWith("inseek.student.cv."))
            .forEach((key) => localStorage.removeItem(key));
    }, []);

  useEffect(() => {
      if (token) {
        setAuthChecked(false);

        try {
          fetcher('user/me', {})
            .then(async (res) => {
                if (!res.ok) {
                  switch (res.status) {
                    case 401:
                        localStorage.removeItem("token");
                        localStorage.removeItem("devAccess");
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
                let newUser = {
                    ...data,
                    isLoggedIn: true,
                    isDevAccess: localStorage.getItem("devAccess") === "true",
                }
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
          <Route path="/" element={<PageLayout user={user} setUser={setUser}/>}>
              <Route index element={user?.isLoggedIn && userRole === "ETUDIANT"
                  ? <EtudiantAccueil user={user}/>
                  : <MainContainer user={user}/>
              }/>
          <Route path='about' element={<About/>}/>
              <Route path='login' element={<LoginForm user={user} authChecked={authChecked} setUser={setUser}/>}/>
          <Route path='logout' element={<Logout setUser={setUser}/>}/>
              <Route path='etudiant' element={
                                          <ProtectedRoute user={user} authChecked={authChecked}
                                                          allowedRoles={["ETUDIANT"]}>
                                              <EtudiantTeleverseCV user={user}/>
                                         </ProtectedRoute>
                                     }/>
              <Route path='employeur' element={
                                           <ProtectedRoute user={user} authChecked={authChecked}
                                                           allowedRoles={["EMPLOYEUR"]}>
                                              <EmployeurOffres
                                                  user={user}
                                                  canManageOffers={Boolean(user?.isLoggedIn)}
                                                  companyName={user?.nomCompagnie ?? ""}
                                                  isAccountEmailValidated={Boolean(user?.isDevAccess) || user?.emailValidated !== false}
                                              />
                                          </ProtectedRoute>
                                      }/>
              <Route path='gestionnaire' element={
                                              <ProtectedRoute user={user} authChecked={authChecked}
                                                              allowedRoles={["GESTIONNAIRE"]}>
                                                 <GestionnaireValidation/>
                                             </ProtectedRoute>
                                         }/>
              <Route path='gestionnaire/cv' element={
                                              <ProtectedRoute user={user} authChecked={authChecked}
                                                              allowedRoles={["GESTIONNAIRE"]}>
                                                 <GestionnaireCvValidation/>
                                             </ProtectedRoute>
                                         }/>
              <Route path='register' element={<RegisterForm user={user} authChecked={authChecked} setUser={setUser}/>}/>
          <Route path='error' element={<ErrorPage error={error}/>}/>
          <Route path='*' element={<ErrorPage error={{status: 404}}/>}/>
        </Route>
      </Routes>

    </div>
  );
}

export default App;
