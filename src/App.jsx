import './aws-config';
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import Analysis from './pages/Analysis'
import Holdings from './pages/Holdings'
import Transactions from './pages/Transactions'
import IndexFunds from './pages/IndexFunds'
import InvestorScore from './pages/InvestorScore'
import PortfolioHealth from './pages/PortfolioHealth'
import CashIntelligence from './pages/CashIntelligence'
import ShadowPortfolios from './pages/ShadowPortfolios'
import Challenges from './pages/Challenges'
import SimulationLab from './pages/SimulationLab'
import MarketInsights from './pages/MarketInsights'
import NotificationSettings from './pages/NotificationSettings'
import ContactSupport from './pages/ContactSupport'
import PracticeTrading from './pages/PracticeTrading'
import GoalIntelligence from './pages/GoalIntelligence'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Disclaimer from './pages/Disclaimer'
import PlatformPhilosophy from './pages/PlatformPhilosophy'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/companies" element={<Companies />} />
          
          <Route path="/analysis" element={<Analysis />} />
          
          <Route path="/holdings" element={<Holdings />} />
          
          <Route path="/transactions" element={<Transactions />} />
          
          <Route path="/index-funds" element={<IndexFunds />} />
          
          <Route path="/investor-score" element={<InvestorScore />} />
          
          <Route path="/portfolio-health" element={<PortfolioHealth />} />
          
          <Route path="/cash-intelligence" element={<CashIntelligence />} />
          
          <Route path="/shadow-portfolios" element={<ShadowPortfolios />} />
          
          <Route path="/challenges" element={<Challenges />} />
          
          <Route path="/simulation-lab" element={<SimulationLab />} />
          
          <Route path="/market-insights" element={<MarketInsights />} />
          
          <Route path="/notification-settings" element={<NotificationSettings />} />
          
          <Route path="/contact-support" element={<ContactSupport />} />
          
          <Route path="/practice-trading" element={<PracticeTrading />} />
          
          <Route path="/goal-intelligence" element={<GoalIntelligence />} />
          
          <Route path="/terms-of-service" element={<TermsOfService />} />
          
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          
          <Route path="/disclaimer" element={<Disclaimer />} />
          
          <Route path="/platform-philosophy" element={<PlatformPhilosophy />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
