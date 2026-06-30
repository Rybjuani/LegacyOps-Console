import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global.css';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { InteractionConsolePage } from './pages/InteractionConsolePage';
import { CustomerSearchPage } from './pages/CustomerSearchPage';
import { Customer360Page } from './pages/Customer360Page';
import { CasesPage } from './pages/CasesPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { SupervisorPage } from './pages/SupervisorPage';
import { SiebelBridgeLabPage } from './pages/SiebelBridgeLabPage';
import { LegacyObservabilityPage } from './pages/LegacyObservabilityPage';
import { MigrationDryRunPage } from './pages/MigrationDryRunPage';
import { SourceOfTruthPage } from './pages/SourceOfTruthPage';
import { RoiPage } from './pages/RoiPage';
import { ModePage } from './pages/ModePage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/interaction-console" element={<InteractionConsolePage />} />
          <Route path="/customers" element={<CustomerSearchPage />} />
          <Route path="/customers/:id" element={<Customer360Page />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/supervisor" element={<SupervisorPage />} />
          <Route path="/siebel-bridge" element={<SiebelBridgeLabPage />} />
          <Route path="/legacy-observability" element={<LegacyObservabilityPage />} />
          <Route path="/migration" element={<MigrationDryRunPage />} />
          <Route path="/source-of-truth" element={<SourceOfTruthPage />} />
          <Route path="/roi" element={<RoiPage />} />
          <Route path="/mode" element={<ModePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
