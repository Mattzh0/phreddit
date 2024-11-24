import { useState } from 'react';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();

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
              />
              <label htmlFor="password">Password:</label>
              <input 
                type="text" 
                id="user-password" 
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="welcome-button-container">
                <button type="submit" className="login-button">Login</button>
              </div>
          </form>
      </div>
    </div>
  )
}