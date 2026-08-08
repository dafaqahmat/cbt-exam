import { FC } from 'react';
import AppRoutes from './routes';
import { Link, useLocation } from "react-router";
import { useAuthUser } from './hooks/auth/useAuthUser';
import { useLogout } from './hooks/auth/useLogout';
import './App.css'

const App: FC = () => {
  const location = useLocation();
  const user = useAuthUser();
  const logout = useLogout();

  const isExamPage = location.pathname.match(/^\/peserta\/exams\/\d+\/take$/);
  const homePath = user?.role === 'admin' ? '/admin/dashboard' : '/peserta/exams';

  return (
    <div>
      {!isExamPage && (
        <nav className="navbar navbar-expand-lg bg-dark" data-bs-theme="dark">
          <div className="container">
            <Link to="/" className="navbar-brand">CBT EXAM</Link>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                {user ? (
                  <>
                    <li className="nav-item">
                      <Link to={homePath} className="nav-link">{user.name.toUpperCase()}</Link>
                    </li>
                    <li className="nav-item">
                      <button onClick={logout} className="btn btn-link nav-link">LOGOUT</button>
                    </li>
                  </>
                ) : (
                  <li className="nav-item">
                    <Link to="/login" className="nav-link active">LOGIN</Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </nav>
      )}

      <AppRoutes />
    </div>
  )
}

export default App;
