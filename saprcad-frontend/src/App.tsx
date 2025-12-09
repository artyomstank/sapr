// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PreprocessorPage from './pages/PreprocessorPage';
import CalculationSuccessPage from './pages/CalculationSuccessPage';
import PostprocessorPage from './pages/PostprocessorPage';

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/preprocessor" replace />} />
                <Route path="/preprocessor" element={<PreprocessorPage />} />
                <Route path="/calculation-success" element={<CalculationSuccessPage />} />
                <Route path="/postprocessor" element={<PostprocessorPage />} />
            </Routes>
        </Router>
    );
};

export default App;