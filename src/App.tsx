import { BrowserRouter, Route, Routes } from 'react-router-dom'
import MapView from './MapView'
import RegisterView from './RegisterView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapView />} />
        <Route path="/register" element={<RegisterView />} />
      </Routes>
    </BrowserRouter>
  )
}
