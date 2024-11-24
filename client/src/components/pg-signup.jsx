import { useState } from 'react';
import axios from 'axios';

export default function SignUp() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleRegister = async (event) => {
    event.preventDefault();

    const newUser = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      displayName: displayName
    }
    
    try {
      const response = await axios.post('http://localhost:8000/users/new', newUser);
      
      // clear the registration form after registering
      setEmail('');
      setPassword('');
      setDisplayName('');
    } 
    catch (error) {
      console.error('Error creating community:', error);
    }
  }

  
  return (
    <div className='welcome-container'>
      <div className="welcome">
        <h1 className="welcome-text">Welcome to Phreddit</h1>
          <form className="welcome-form-container" onSubmit={handleRegister}>
          <label htmlFor="email">First Name:</label>
              <input 
                type="text" 
                id="first-name" 
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label htmlFor="email">Last Name:</label>
              <input 
                type="text" 
                id="last-name" 
                onChange={(e) => setEmail(e.target.value)}
                required
              />
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
              <label htmlFor="displayname">Display Name:</label>
              <input 
                type="text" 
                id="user-displayname"
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
              <div className="welcome-button-container">
                <button type="submit" className="register-button">Sign Up</button>
              </div>
          </form>
      </div>
    </div>
  )
}