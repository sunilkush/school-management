import { Outlet } from 'react-router-dom'
import './App.css'
import {ToastContainer} from 'react-toastify'
import 'react-toastify/ReactToastify.css'

function App() {
   return (
    <>
    <Outlet/>
    <ToastContainer/>
    </>
  )
}

export default App
