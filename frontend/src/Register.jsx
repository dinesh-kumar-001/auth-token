import { useState } from 'react';
import api from './api';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: '', email: '', password: ''
  });

  // Input change handle
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/register', formData);
      toast.success(res.data.message);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button style={styles.button} type="submit">Register</button>
        </form>
        <p>Already have account? <Link to="/">Login</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#f0f2f5' },
  card:      { background:'white', padding:'2rem', borderRadius:'10px', width:'350px', boxShadow:'0 4px 15px rgba(0,0,0,0.1)' },
  input:     { width:'100%', padding:'10px', margin:'8px 0', borderRadius:'6px', border:'1px solid #ddd', boxSizing:'border-box' },
  button:    { width:'100%', padding:'10px', background:'#4f46e5', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', marginTop:'10px' }
};

export default Register;