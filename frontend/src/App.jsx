import { BrowserRouter, Routes, Route } from 'react-router-dom'; //page navigation
import Register from './Register';
import Login from './Login';
import Dashboard from './Dashboard';
import { ToastContainer } from 'react-toastify';                 // show notification
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/"          element={<Login />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;