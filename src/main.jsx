import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// ホーム画面追加プロンプト（beforeinstallprompt）を起動直後から捕まえるため先に読み込む
import './utils/pwaInstall'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
