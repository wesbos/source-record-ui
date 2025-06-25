
import React, { useState } from 'react';
import Demo from '../assets/demo.png';

interface ConnectionStringInputProps {
  onConnect: (connectionString: string, password?: string) => void;
  initialConnectionString?: string;
  error?: string | null;
}

export function ConnectionStringInput({ onConnect, initialConnectionString = '', error }: ConnectionStringInputProps) {
  const [connectionString, setConnectionString] = useState(initialConnectionString);
  const [password, setPassword] = useState(localStorage.getItem('obsPassword') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('obsPassword', password);
    onConnect(connectionString, password);
  };

  return (
    <div className="connection-string-container">
      <img src={Demo} alt="OBS Source Record UI" />
      <form onSubmit={handleSubmit}>
        <h2>Enter OBS WebSocket Connection String</h2>
        {error && <div className="error-message">{error}</div>}
        <input
          type="text"
          value={connectionString}
          onChange={(e) => setConnectionString(e.target.value)}
          placeholder="ws://127.0.0.1:4455"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (optional)"
        />
        <button type="submit">Connect</button>
      </form>
      <div className="instructions">
        <h3>How to Enable the WebSocket Server in OBS:</h3>
        <ol>
          <li>Open OBS.</li>
          <li>Click "Tools" from the menu, then "WebSocket Server Settings".</li>
          <li>Check "Enable WebSocket Server".</li>
          <li>Optionally, set a custom port and password.</li>
        </ol>
      </div>
    </div>
  );
}
