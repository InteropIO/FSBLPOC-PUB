import React, { useEffect } from 'react'
import logo from './logo.svg';
import './App.css';


function getPlatform() {
  // Finsemble
  if (window.FSBL) {
    window.FSBL.getFSBLInfo().then((info) => {
      console.log(info.FSBLVersion);
      window.fin.Window = window.fin.desktop.Window
      window.fin.Application = window.fin.desktop.Application
      window.fin.System = window.fin.desktop.System

      window.fin.Window.me = { uuid: window.finsembleWindow.windowIdentifier.windowName }
    });
    // OF
  } else if (window.fin) {
    window.fin.desktop.Application.getCurrent().getInfo((info) => {
      console.log(info.manifest.startup_app.name)
    });

  } else {
    const platform = window.navigator.userAgent
    console.log(platform)
    return platform
  }


}

function App() {

  useEffect(() => {
    getPlatform()

  }, [])
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
