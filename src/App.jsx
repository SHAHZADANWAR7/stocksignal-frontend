import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import Home from './pages/Home'
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
          <Route path="/Home" element={<Home />} />
          
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          
          <Route path="/companies" element={<Companies />} />
          <Route path="/Companies" element={<Companies />} />
          
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/Analysis" element={<Analysis />} />
          
          <Route path="/holdings" element={<Holdings />} />
          <Route path="/Holdings" element={<Holdings />} />
          
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/Transactions" element={<Transactions />} />
          
          <Route path="/indexfunds" element={<IndexFunds />} />
          <Route path="/IndexFunds" element={<IndexFunds />} />
          
          <Route path="/investorscore" element={<InvestorScore />} />
          <Route path="/InvestorScore" element={<InvestorScore />} />
          
          <Route path="/portfoliohealth" element={<PortfolioHealth />} />
          <Route path="/PortfolioHealth" element={<PortfolioHealth />} />
          
          <Route path="/cashintelligence" element={<CashIntelligence />} />
          <Route path="/CashIntelligence" element={<CashIntelligence />} />
          
          <Route path="/shadowportfolios" element={<ShadowPortfolios />} />
          <Route path="/ShadowPortfolios" element={<ShadowPortfolios />} />
          
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/Challenges" element={<Challenges />} />
          
          <Route path="/simulationlab" element={<SimulationLab />} />
          <Route path="/SimulationLab" element={<SimulationLab />} />
          
          <Route path="/marketinsights" element={<MarketInsights />} />
          <Route path="/MarketInsights" element={<MarketInsights />} />
          
          <Route path="/notificationsettings" element={<NotificationSettings />} />
          <Route path="/NotificationSettings" element={<NotificationSettings />} />
          
          <Route path="/contactsupport" element={<ContactSupport />} />
          <Route path="/ContactSupport" element={<ContactSupport />} />
          
          <Route path="/practicetrading" element={<PracticeTrading />} />
          <Route path="/PracticeTrading" element={<PracticeTrading />} />
          
          <Route path="/goalintelligence" element={<GoalIntelligence />} />
          <Route path="/GoalIntelligence" element={<GoalIntelligence />} />
          
          <Route path="/termsofservice" element={<TermsOfService />} />
          <Route path="/TermsOfService" element={<TermsOfService />} />
          
          <Route path="/privacypolicy" element={<PrivacyPolicy />} />
          <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
          
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/Disclaimer" element={<Disclaimer />} />
          
          <Route path="/platformphilosophy" element={<PlatformPhilosophy />} />
          <Route path="/PlatformPhilosophy" element={<PlatformPhilosophy />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
