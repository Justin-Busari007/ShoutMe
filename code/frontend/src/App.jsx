import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Register from "./pages/Register";

function App() {
  return (
    <BrowserRouter>
    
      <div style={{ padding: 20 }}>
        <nav style={{ marginBottom: 20 }}>
          <Link to="/register">Register</Link>
        </nav>

        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;