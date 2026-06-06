import { Routes, Route } from "react-router-dom";
import Landing from "./components/Landing";
import Scanner from "./components/Scanner";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/scan" element={<Scanner />} />
    </Routes>
  );
}
