import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import TestRunner from './TestRunner.jsx';
import './index.css'

const Root = () => {
  const [isMultiTest, setIsMultiTest] = useState(false);
  
  // This layout wrapper ensures React limits re-renders of the game vs runner
  if (isMultiTest) {
    return <TestRunner onExit={() => setIsMultiTest(false)} />;
  }
  return <App onStartMultiTest={() => setIsMultiTest(true)} />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Root />
    </React.StrictMode>
)
