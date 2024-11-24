export default function Welcome( { displayPage }) {
  
  return (
    <div className='welcome-container'>
      <div className="welcome">
        <h1 className="welcome-text">Welcome to Phreddit</h1>
          <div className="welcome-button-container">
            <button onClick={() => displayPage('sign-up')} className="register-button">Register</button>
            <button onClick={() => displayPage('login')} className="login-button">Login</button>
            <button onClick={() => displayPage()} className="guest-button">Continue as Guest</button>
          </div>
      </div>
    </div>
  )
}