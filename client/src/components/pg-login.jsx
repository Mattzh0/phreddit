import { useState } from 'react';
import axios from 'axios';

export default function Login( { displayPage, updateLoginStatus }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post('http://localhost:8000/users/login', { email, password }, {withCredentials: true});
      console.log('Login successful:', response.data.message);

      updateLoginStatus();
      displayPage('home');
    }
    catch (error) {
      if (error.response && error.response.status === 400) {
        alert(error.response.data.message);  // email or password was incorrect
      } 
      else {
        alert('An error occurred while logging in the user.');
      }
    }
  }
  
  return (
    <div className='welcome-container'>
      <div className="welcome">
        <h1 className="welcome-text">Welcome to Phreddit</h1>
          <form className="welcome-form-container" onSubmit={handleLogin}>
              <label htmlFor="email">Email:</label>
              <input 
                type="text" 
                id="user-email" 
                onChange={(e) => setEmail(e.target.value)}
                required
                value = {email}
              />
              <label htmlFor="password">Password:</label>
              <input 
                type="text" 
                id="user-password" 
                onChange={(e) => setPassword(e.target.value)}
                required
                value = {password}
              />
              <div className="welcome-button-container">
                <button type="submit" className="login-button">Login</button>
              </div>
          </form>
      </div>
    </div>
  )
}