import { useEffect, useState } from 'react';
import api from './api';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = Cookies.get('token');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const res = await api.get('/api/profile', {
          headers: {
            Authorization: `Bearer ${token}` 
          }
        });
        setUser(res.data.user);
      } catch (err) {
        toast.error('Session expired, please login again');
        Cookies.remove('token');
        navigate('/');
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    Cookies.remove('token'); 
    toast.success('Logged out!');
    navigate('/');
  };

  if (!user) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>;
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Welcome,{user.name}!</h2>
        <hr />
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
const styles = {
  container:  { display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'white' },
  card:       { background:'white', padding:'2rem', borderRadius:'10px', width:'400px', boxShadow:'0 4px 15px rgba(0,0,0,0.1)' },
  logoutBtn:  { marginTop:'20px', padding:'10px 20px', background:'#ef4444', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }
};

export default Dashboard;