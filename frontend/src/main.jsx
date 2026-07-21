import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Navigate } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider.jsx'
import Layout from './Layout.jsx'
import Login from './components/Login/Login.jsx'
import Standing from './components/Standing/Standing.jsx'
import Contest from './components/Contest/Contest.jsx'
import AdminDashboard from './components/Admin/AdminDashboard.jsx'
import Profile from './components/Profile/Profile.jsx'

const ProtectedRoute = ({ children }) => {
  if (!localStorage.getItem('isAuthenticated')) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  if (!localStorage.getItem('isAuthenticated')) {
    return <Navigate to="/login" replace />;
  }
  if (localStorage.getItem('userRole') !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path='/login' element={<Login />} />
      <Route path='/' element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Standing />} />
        <Route path='standing' element={<Standing />} />
        <Route path='contest' element={<Contest />} />
        <Route path='profile' element={<Profile />} />
        <Route path='profile/:username' element={<Profile />} />
        <Route path='admin' element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      </Route>
    </>
  )
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
)
