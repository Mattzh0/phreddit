import { useState } from 'react';
import axios from 'axios';

export default function SignUp( {displayPage }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // regex for validating email format
  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // validate the password
  const isPasswordValid = (password, firstName, lastName, displayName, email) => {
    // convert to lowercase for case-insensitive comparison
    const passwordLower = password.toLowerCase();
    const firstNameLower = firstName.toLowerCase();
    const lastNameLower = lastName.toLowerCase();
    const displayNameLower = displayName.toLowerCase();
    const emailPrefix = email.split('@')[0].toLowerCase(); // only need to compare the part before '@'

    // check if password contains any of the forbidden elements
    if (
      passwordLower.includes(firstNameLower) ||
      passwordLower.includes(lastNameLower) ||
      passwordLower.includes(displayNameLower) ||
      passwordLower.includes(emailPrefix)
    ) {
      return false;
    }
    return true;
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (password !== verifyPassword) {
      alert('Passwords must match!');
      setPassword('');
      setVerifyPassword('');
      return
    }

    if (!isValidEmail(email)) {
      alert('Enter a valid email address')
      setEmail('');
      return
    }

     if (!isPasswordValid(password, firstName, lastName, displayName, email)) {
      alert('Your password cannot contain your first name, last name, display name, or email.');
      setPassword('');
      setVerifyPassword('');
      return;
    }

    const newUser = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      displayName: displayName
    }
    
    try {
      await axios.post('http://localhost:8000/users/new', newUser, {withCredentials: true});
      displayPage('welcome');

      // clear the registration form after registering
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setVerifyPassword('');
      setDisplayName('');
    } 
    catch (error) {
      if (error.response && error.response.status === 400) {
        alert(error.response.data.message);  // show specific error (duplicate email or displayName)
      } 
      else {
        alert('An error occurred while registering the user.');
      }
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
                onChange={(e) => setFirstName(e.target.value)}
                required
                value={firstName}
              />
              <label htmlFor="email">Last Name:</label>
              <input 
                type="text" 
                id="last-name" 
                onChange={(e) => setLastName(e.target.value)}
                required
                value={lastName}
              />
              <label htmlFor="email">Email:</label>
              <input 
                type="text" 
                id="user-email" 
                onChange={(e) => setEmail(e.target.value)}
                required
                value={email}
              />
              <label htmlFor="password">Password:</label>
              <input 
                type="password" 
                id="user-password" 
                onChange={(e) => setPassword(e.target.value)}
                required
                value={password}
              />
              <label htmlFor="password">Verify Password:</label>
              <input 
                type="password" 
                id="user-verify-password" 
                onChange={(e) => setVerifyPassword(e.target.value)}
                required
                value={verifyPassword}
              />
              <label htmlFor="displayname">Display Name:</label>
              <input 
                type="text" 
                id="user-displayname"
                onChange={(e) => setDisplayName(e.target.value)}
                required
                value={displayName}
              />
              <div className="welcome-button-container">
                <button type="submit" className="register-button">Sign Up</button>
                <button type="button" onClick={() => displayPage('welcome')}>Back</button>
              </div>
          </form>
      </div>
    </div>
  )
}