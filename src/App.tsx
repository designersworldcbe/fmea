import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FMEAList from './pages/FMEAList';
import ControlPlanList from './pages/ControlPlanList';
import Library from './pages/Library';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="fmeas" element={<FMEAList />} />
        <Route path="control-plans" element={<ControlPlanList />} />
        <Route path="library" element={<Library />} />
      </Route>
    </Routes>
  );
}
