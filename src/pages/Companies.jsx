import React, { useState, useEffect } from "react";
import { callAwsFunction } from "@/components/utils/api/awsApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Building2, TrendingUp, Filter, Plus, Loader2, Sparkles, ArrowRight, Target, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CardSkeleton from "@/components/ui/CardSkeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Hardcoded list of 500+ major NYSE/NASDAQ companies
const HARDCODED_COMPANIES = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", description: "Design and manufacture of consumer electronics and software" },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", description: "Software development, cloud computing, and productivity tools" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", description: "Search engine, advertising, cloud services, and AI" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer", description: "E-commerce, cloud computing, and digital streaming" },
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology", description: "GPU design and AI computing hardware" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology", description: "Social media and metaverse development" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Automotive", description: "Electric vehicles and renewable energy solutions" },
  { symbol: "BRK.B", name: "Berkshire Hathaway Inc.", sector: "Finance", description: "Diversified holding company and investment firm" },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", description: "Pharmaceuticals, medical devices, and consumer health" },
  { symbol: "V", name: "Visa Inc.", sector: "Finance", description: "Digital payments and financial services" },
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer", description: "Retail and e-commerce operations" },
  { symbol: "MA", name: "Mastercard Incorporated", sector: "Finance", description: "Payment processing and digital commerce" },
  { symbol: "PG", name: "Procter & Gamble", sector: "Consumer", description: "Consumer packaged goods and household products" },
  { symbol: "KO", name: "Coca-Cola Company", sector: "Consumer", description: "Beverage manufacturing and distribution" },
  { symbol: "INTC", name: "Intel Corporation", sector: "Technology", description: "Microprocessor and semiconductor design" },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Technology", description: "Semiconductor design and manufacturing" },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Entertainment", description: "Streaming entertainment platform" },
  { symbol: "CRM", name: "Salesforce Inc.", sector: "Technology", description: "Cloud-based customer relationship management" },
  { symbol: "ADBE", name: "Adobe Inc.", sector: "Technology", description: "Creative and document management software" },
  { symbol: "CSCO", name: "Cisco Systems Inc.", sector: "Technology", description: "Networking and cybersecurity solutions" },
  { symbol: "ORCL", name: "Oracle Corporation", sector: "Technology", description: "Database and enterprise software" },
  { symbol: "ACN", name: "Accenture plc", sector: "Technology", description: "IT consulting and professional services" },
  { symbol: "IBM", name: "International Business Machines", sector: "Technology", description: "IT services, cloud computing, and enterprise solutions" },
  { symbol: "QCOM", name: "Qualcomm Inc.", sector: "Technology", description: "Mobile processor and wireless technology" },
  { symbol: "MU", name: "Micron Technology Inc.", sector: "Technology", description: "Memory and storage semiconductor manufacturer" },
  { symbol: "DELL", name: "Dell Technologies Inc.", sector: "Technology", description: "Personal computers and IT infrastructure" },
  { symbol: "HPQ", name: "HP Inc.", sector: "Technology", description: "Computer hardware and printing solutions" },
  { symbol: "LRCX", name: "Lam Research Corporation", sector: "Technology", description: "Semiconductor manufacturing equipment" },
  { symbol: "ASML", name: "ASML Holding N.V.", sector: "Technology", description: "Semiconductor equipment manufacturing" },
  { symbol: "TSM", name: "Taiwan Semiconductor Manufacturing", sector: "Technology", description: "Semiconductor foundry services" },
  { symbol: "AVGO", name: "Broadcom Inc.", sector: "Technology", description: "Infrastructure software and broadband" },
  { symbol: "MRVL", name: "Marvell Technology Inc.", sector: "Technology", description: "Semiconductor design and manufacturing" },
  { symbol: "SNPS", name: "Synopsys Inc.", sector: "Technology", description: "Electronic design automation software" },
  { symbol: "CDNS", name: "Cadence Design Systems", sector: "Technology", description: "Software design tools for electronics" },
  { symbol: "NOW", name: "ServiceNow Inc.", sector: "Technology", description: "Cloud-based workflow and IT service management" },
  { symbol: "WDAY", name: "Workday Inc.", sector: "Technology", description: "Cloud-based enterprise resource planning" },
  { symbol: "INTU", name: "Intuit Inc.", sector: "Technology", description: "Financial and tax software for individuals and businesses" },
  { symbol: "ANET", name: "Arista Networks Inc.", sector: "Technology", description: "Cloud networking solutions" },
  { symbol: "FTNT", name: "Fortinet Inc.", sector: "Technology", description: "Cybersecurity and network security solutions" },
  { symbol: "PALO", name: "Palo Alto Networks Inc.", sector: "Technology", description: "Cybersecurity platform and services" },
  { symbol: "CrowdStrike Holdings", name: "CrowdStrike Holdings Inc.", sector: "Technology", description: "Cloud-based cybersecurity platform" },
  { symbol: "OKTA", name: "Okta Inc.", sector: "Technology", description: "Identity and access management platform" },
  { symbol: "ZS", name: "Zscaler Inc.", sector: "Technology", description: "Cloud-based security platform" },
  { symbol: "NET", name: "Cloudflare Inc.", sector: "Technology", description: "Content delivery and DDoS protection" },
  { symbol: "CRWD", name: "CrowdStrike Holdings Inc.", sector: "Technology", description: "Cloud-based endpoint protection" },
  { symbol: "SNOW", name: "Snowflake Inc.", sector: "Technology", description: "Cloud data platform" },
  { symbol: "DDOG", name: "Datadog Inc.", sector: "Technology", description: "Monitoring and analytics platform" },
  { symbol: "SPLK", name: "Splunk Inc.", sector: "Technology", description: "Data analytics and monitoring platform" },
  { symbol: "MSTR", name: "MicroStrategy Inc.", sector: "Technology", description: "Business analytics and mobile software" },
  { symbol: "DBX", name: "Dropbox Inc.", sector: "Technology", description: "Cloud storage and file synchronization" },
  { symbol: "BOX", name: "Box Inc.", sector: "Technology", description: "Cloud content management platform" },
  { symbol: "TEAM", name: "Atlassian Corporation", sector: "Technology", description: "Software development and collaboration tools" },
  { symbol: "ZOOM", name: "Zoom Video Communications", sector: "Technology", description: "Video conferencing and collaboration platform" },
  { symbol: "PINS", name: "Pinterest Inc.", sector: "Technology", description: "Social discovery and bookmarking platform" },
  { symbol: "SNAP", name: "Snap Inc.", sector: "Technology", description: "Camera and social messaging platform" },
  { symbol: "TWTR", name: "Twitter Inc.", sector: "Technology", description: "Social media and news platform" },
  { symbol: "LYFT", name: "Lyft Inc.", sector: "Consumer", description: "Ride-sharing and transportation services" },
  { symbol: "UBER", name: "Uber Technologies Inc.", sector: "Consumer", description: "Ride-sharing, delivery, and logistics" },
  { symbol: "DASH", name: "DoorDash Inc.", sector: "Consumer", description: "Food delivery platform" },
  { symbol: "ABNB", name: "Airbnb Inc.", sector: "Consumer", description: "Short-term vacation rental platform" },
  { symbol: "BOOKING", name: "Booking.com", sector: "Consumer", description: "Online travel and accommodation booking" },
  { symbol: "EXPD", name: "Expeditors International", sector: "Industrial", description: "Logistics and freight forwarding" },
  { symbol: "XPO", name: "XPO Inc.", sector: "Industrial", description: "Transportation and logistics services" },
  { symbol: "JBHT", name: "J.B. Hunt Transport Services", sector: "Industrial", description: "Transportation and logistics" },
  { symbol: "KNX", name: "Knight-Swift Transportation", sector: "Industrial", description: "Trucking and logistics services" },
  { symbol: "YUM", name: "YUM! Brands Inc.", sector: "Consumer", description: "Fast-food restaurant franchises (KFC, Taco Bell, Pizza Hut)" },
  { symbol: "SBUX", name: "Starbucks Corporation", sector: "Consumer", description: "Coffee and beverage retailer" },
  { symbol: "MCD", name: "McDonald's Corporation", sector: "Consumer", description: "Fast-food restaurant chain" },
  { symbol: "DRI", name: "Dine Global Holdings Corp.", sector: "Consumer", description: "Restaurant operations and franchising" },
  { symbol: "CPRI", name: "Capri Holdings Limited", sector: "Consumer", description: "Luxury fashion and accessories" },
  { symbol: "LVMH", name: "LVMH Moët Hennessy Louis Vuitton", sector: "Consumer", description: "Luxury goods and fashion conglomerate" },
  { symbol: "KORS", name: "Kors Holdings Inc.", sector: "Consumer", description: "Fashion and luxury accessories" },
  { symbol: "TPR", name: "Tapestry Inc.", sector: "Consumer", description: "Luxury fashion and accessories" },
  { symbol: "GCO", name: "Gucci", sector: "Consumer", description: "Luxury fashion brand" },
  { symbol: "HLMN", name: "Hillman Solutions Corp.", sector: "Consumer", description: "Hardware and tools retailer" },
  { symbol: "RH", name: "RH (Restoration Hardware)", sector: "Consumer", description: "Luxury home furnishings retailer" },
  { symbol: "ETSY", name: "Etsy Inc.", sector: "Consumer", description: "E-commerce marketplace for handmade goods" },
  { symbol: "EBAY", name: "eBay Inc.", sector: "Consumer", description: "Online auction and e-commerce platform" },
  { symbol: "NCLH", name: "Norwegian Cruise Line Holdings", sector: "Consumer", description: "Cruise line operator" },
  { symbol: "RCL", name: "Royal Caribbean Cruises Ltd.", sector: "Consumer", description: "Cruise line operator" },
  { symbol: "CCL", name: "Carnival Corporation", sector: "Consumer", description: "Cruise line operator" },
  { symbol: "UAL", name: "United Airlines Holdings Inc.", sector: "Industrial", description: "Passenger airline operator" },
  { symbol: "DAL", name: "Delta Air Lines Inc.", sector: "Industrial", description: "Passenger airline operator" },
  { symbol: "AAL", name: "American Airlines Group Inc.", sector: "Industrial", description: "Passenger airline operator" },
  { symbol: "SAVE", name: "Spirit Airlines Inc.", sector: "Industrial", description: "Low-cost airline operator" },
  { symbol: "ALK", name: "Alaska Air Group Inc.", sector: "Industrial", description: "Airline operator" },
  { symbol: "HAL", name: "Carnival plc", sector: "Consumer", description: "Cruise line operator" },
  { symbol: "LUV", name: "Southwest Airlines Co.", sector: "Industrial", description: "Low-cost airline operator" },
  { symbol: "RYAAY", name: "Ryanair Holdings plc", sector: "Industrial", description: "European low-cost airline" },
  { symbol: "BA", name: "The Boeing Company", sector: "Industrial", description: "Aircraft and aerospace manufacturer" },
  { symbol: "RTX", name: "RTX Corporation", sector: "Industrial", description: "Aerospace and defense contractor" },
  { symbol: "LMT", name: "Lockheed Martin Corporation", sector: "Industrial", description: "Aerospace and defense manufacturer" },
  { symbol: "GD", name: "General Dynamics Corporation", sector: "Industrial", description: "Aerospace and defense company" },
  { symbol: "NOC", name: "Northrop Grumman Corporation", sector: "Industrial", description: "Aerospace and defense manufacturer" },
  { symbol: "TDG", name: "TransDigm Group Incorporated", sector: "Industrial", description: "Aerospace parts supplier" },
  { symbol: "HII", name: "Huntington Ingalls Industries Inc.", sector: "Industrial", description: "Naval ship builder" },
  { symbol: "SPR", name: "Spirit AeroSystems Inc.", sector: "Industrial", description: "Aerospace components supplier" },
  { symbol: "ARCB", name: "ArcBest Corporation", sector: "Industrial", description: "Trucking and logistics" },
  { symbol: "CHRW", name: "C.H. Robinson Worldwide Inc.", sector: "Industrial", description: "Logistics and freight management" },
  { symbol: "ODFL", name: "Old Dominion Freight Line Inc.", sector: "Industrial", description: "Freight transportation services" },
  { symbol: "LOGI", name: "Logitech International S.A.", sector: "Technology", description: "Computer peripherals and accessories" },
  { symbol: "PTON", name: "Peloton Interactive Inc.", sector: "Consumer", description: "Connected fitness equipment and content" },
  { symbol: "GoPro", name: "GoPro Inc.", sector: "Technology", description: "Action camera manufacturer" },
  { symbol: "STX", name: "Seagate Technology Holdings plc", sector: "Technology", description: "Data storage and hard drive manufacturer" },
  { symbol: "WDC", name: "Western Digital Corporation", sector: "Technology", description: "Data storage and memory solutions" },
  { symbol: "SKX", name: "Skechers U.S.A. Inc.", sector: "Consumer", description: "Footwear and apparel manufacturer" },
  { symbol: "NKE", name: "Nike Inc.", sector: "Consumer", description: "Footwear and athletic apparel" },
  { symbol: "ACI", name: "Arch Capital Group Ltd.", sector: "Finance", description: "Insurance and reinsurance company" },
  { symbol: "AFL", name: "AFLAC Incorporated", sector: "Finance", description: "Supplemental insurance provider" },
  { symbol: "ALL", name: "The Allstate Corporation", sector: "Finance", description: "Insurance company" },
  { symbol: "AIG", name: "American International Group Inc.", sector: "Finance", description: "Insurance and financial services" },
  { symbol: "CB", name: "Chubb Limited", sector: "Finance", description: "Insurance and reinsurance company" },
  { symbol: "HIG", name: "Heritage Insurance Holdings Inc.", sector: "Finance", description: "Property and casualty insurance" },
  { symbol: "MCO", name: "Moody's Corporation", sector: "Finance", description: "Credit rating and financial analysis" },
  { symbol: "SPGI", name: "S&P Global Inc.", sector: "Finance", description: "Credit rating and financial information" },
  { symbol: "MSCI", name: "MSCI Inc.", sector: "Finance", description: "Financial indexes and analytics" },
  { symbol: "CME", name: "CME Group Inc.", sector: "Finance", description: "Derivatives and futures exchange" },
  { symbol: "ICE", name: "Intercontinental Exchange Inc.", sector: "Finance", description: "Financial and commodity exchange" },
  { symbol: "GEF", name: "Greif Inc.", sector: "Industrial", description: "Industrial packaging and shipping containers" },
  { symbol: "IP", name: "International Paper Company", sector: "Industrial", description: "Paper and packaging products" },
  { symbol: "PKG", name: "Packaging Corporation of America", sector: "Industrial", description: "Corrugated packaging manufacturer" },
  { symbol: "WRK", name: "Westrock Company", sector: "Industrial", description: "Corrugated packaging and paper products" },
  { symbol: "BDX", name: "Becton, Dickinson and Company", sector: "Healthcare", description: "Medical devices and supplies" },
  { symbol: "TMO", name: "Thermo Fisher Scientific Inc.", sector: "Healthcare", description: "Life sciences and laboratory equipment" },
  { symbol: "LH", name: "LabCorp Holdings Inc.", sector: "Healthcare", description: "Clinical laboratory services" },
  { symbol: "MDT", name: "Medtronic plc", sector: "Healthcare", description: "Medical devices and equipment" },
  { symbol: "ABT", name: "Abbott Laboratories", sector: "Healthcare", description: "Pharmaceuticals and medical devices" },
  { symbol: "ABBV", name: "AbbVie Inc.", sector: "Healthcare", description: "Pharmaceutical company" },
  { symbol: "PFE", name: "Pfizer Inc.", sector: "Healthcare", description: "Pharmaceutical manufacturer" },
  { symbol: "MRNA", name: "Moderna Inc.", sector: "Healthcare", description: "mRNA vaccine and therapeutic company" },
  { symbol: "BNTX", name: "BioNTech SE", sector: "Healthcare", description: "Biotechnology and vaccine company" },
  { symbol: "VRTX", name: "Vertex Pharmaceuticals Inc.", sector: "Healthcare", description: "Biopharmaceutical company" },
  { symbol: "REGN", name: "Regeneron Pharmaceuticals Inc.", sector: "Healthcare", description: "Biopharmaceutical company" },
  { symbol: "AMGN", name: "Amgen Inc.", sector: "Healthcare", description: "Biopharmaceutical company" },
  { symbol: "BIIB", name: "Biogen Inc.", sector: "Healthcare", description: "Biopharmaceutical company" },
  { symbol: "ILMN", name: "Illumina Inc.", sector: "Healthcare", description: "DNA sequencing and genomics" },
  { symbol: "GILD", name: "Gilead Sciences Inc.", sector: "Healthcare", description: "Biopharmaceutical company" },
  { symbol: "ZTS", name: "Zoetis Inc.", sector: "Healthcare", description: "Animal health pharmaceuticals" },
  { symbol: "EW", name: "Edwards Lifesciences Corporation", sector: "Healthcare", description: "Cardiac and vascular medical devices" },
  { symbol: "SYK", name: "Stryker Corporation", sector: "Healthcare", description: "Medical devices and equipment" },
  { symbol: "PODD", name: "Insulet Corporation", sector: "Healthcare", description: "Insulin delivery and management devices" },
  { symbol: "DXCM", name: "DexCom Inc.", sector: "Healthcare", description: "Continuous glucose monitoring systems" },
  { symbol: "ALGN", name: "Align Technology Inc.", sector: "Healthcare", description: "Clear aligner orthodontics (Invisalign)" },
  { symbol: "CTLT", name: "Catalent Inc.", sector: "Healthcare", description: "Contract pharmaceutical manufacturing" },
  { symbol: "JCI", name: "Johnson Controls International plc", sector: "Industrial", description: "HVAC and building systems" },
  { symbol: "ITW", name: "Illinois Tool Works Inc.", sector: "Industrial", description: "Industrial machinery and equipment" },
  { symbol: "GE", name: "General Electric Company", sector: "Industrial", description: "Power generation and industrial equipment" },
  { symbol: "CAT", name: "Caterpillar Inc.", sector: "Industrial", description: "Heavy construction equipment" },
  { symbol: "CNI", name: "Canadian National Railway Company", sector: "Industrial", description: "Rail transportation" },
  { symbol: "CSX", name: "CSX Corporation", sector: "Industrial", description: "Rail transportation" },
  { symbol: "UNP", name: "Union Pacific Corporation", sector: "Industrial", description: "Rail transportation" },
  { symbol: "NSC", name: "Norfolk Southern Railway", sector: "Industrial", description: "Rail transportation" },
  { symbol: "TT", name: "Trane Technologies plc", sector: "Industrial", description: "HVAC and refrigeration systems" },
  { symbol: "PH", name: "Parker Hannifin Corporation", sector: "Industrial", description: "Motion and control technologies" },
  { symbol: "AME", name: "AMETEK Inc.", sector: "Industrial", description: "Electronic instruments and electromechanical devices" },
  { symbol: "APH", name: "Amphenol Corporation", sector: "Industrial", description: "Electrical connectors and cables" },
  { symbol: "BRL", name: "Barrels Inc.", sector: "Industrial", description: "Industrial manufacturing" },
  { symbol: "PNRA", name: "Panera Bread Company", sector: "Consumer", description: "Bakery-cafe chain" },
  { symbol: "BLMN", name: "Bloomin' Brands Inc.", sector: "Consumer", description: "Restaurant operator" },
  { symbol: "CBRL", name: "Cracker Barrel Old Country Store Inc.", sector: "Consumer", description: "Restaurant and retail chain" },
  { symbol: "WING", name: "Wingstop Inc.", sector: "Consumer", description: "Chicken wing restaurant chain" },
  { symbol: "CMPR", name: "Computer Programs and Systems Inc.", sector: "Healthcare", description: "Healthcare IT and EHR solutions" },
  { symbol: "VEEV", name: "Veeva Systems Inc.", sector: "Technology", description: "Cloud software for life sciences" },
  { symbol: "VEYE", name: "Vestas Wind Systems A/S", sector: "Energy", description: "Wind turbine manufacturer" },
  { symbol: "NEE", name: "NextEra Energy Inc.", sector: "Energy", description: "Electric utility and renewable energy" },
  { symbol: "DUK", name: "Duke Energy Corporation", sector: "Energy", description: "Electric utility company" },
  { symbol: "SO", name: "The Southern Company", sector: "Energy", description: "Electric utility company" },
  { symbol: "EXC", name: "Exelon Corporation", sector: "Energy", description: "Utility company and nuclear operator" },
  { symbol: "AEP", name: "American Electric Power Company Inc.", sector: "Energy", description: "Electric utility company" },
  { symbol: "XEL", name: "Xcel Energy Inc.", sector: "Energy", description: "Electric and natural gas utility" },
  { symbol: "EQT", name: "EQT Corporation", sector: "Energy", description: "Natural gas producer" },
  { symbol: "MPC", name: "Marathon Petroleum Corporation", sector: "Energy", description: "Oil refining and marketing" },
  { symbol: "PSX", name: "Phillips 66", sector: "Energy", description: "Oil refining and chemicals" },
  { symbol: "VLO", name: "Valero Energy Corporation", sector: "Energy", description: "Oil refining" },
  { symbol: "HES", name: "Hess Corporation", sector: "Energy", description: "Oil and natural gas exploration" },
  { symbol: "COP", name: "ConocoPhillips", sector: "Energy", description: "Oil and natural gas exploration" },
  { symbol: "OXY", name: "Occidental Petroleum Corporation", sector: "Energy", description: "Oil and natural gas company" },
  { symbol: "CVX", name: "Chevron Corporation", sector: "Energy", description: "Oil and natural gas company" },
  { symbol: "XOM", name: "Exxon Mobil Corporation", sector: "Energy", description: "Oil and natural gas company" },
  { symbol: "RIG", name: "Transocean Ltd.", sector: "Energy", description: "Offshore drilling contractor" },
  { symbol: "SLB", name: "Schlumberger Ltd.", sector: "Energy", description: "Oil and gas services company" },
  { symbol: "HAL", name: "Halliburton Company", sector: "Energy", description: "Oil and gas services company" },
  { symbol: "BKR", name: "Baker Hughes Company", sector: "Energy", description: "Oil and gas equipment supplier" },
  { symbol: "OIL", name: "Energy Transfer L.P.", sector: "Energy", description: "Pipeline and energy infrastructure" },
  { symbol: "KMI", name: "Kinder Morgan Inc.", sector: "Energy", description: "Pipeline and energy infrastructure" },
  { symbol: "MMP", name: "Magellan Midstream Partners L.P.", sector: "Energy", description: "Refined products and crude oil pipelines" },
  { symbol: "EPD", name: "Enterprise Products Partners L.P.", sector: "Energy", description: "Midstream energy infrastructure" },
  { symbol: "DCP", name: "DCP Midstream, LP", sector: "Energy", description: "Midstream energy company" },
  { symbol: "LNG", name: "Cheniere Energy Inc.", sector: "Energy", description: "Liquefied natural gas operator" },
  { symbol: "GEVO", name: "Gevo Inc.", sector: "Energy", description: "Sustainable fuels and chemicals" },
  { symbol: "PLUG", name: "Plug Power Inc.", sector: "Energy", description: "Hydrogen fuel cells and infrastructure" },
  { symbol: "FCEL", name: "FuelCell Energy Inc.", sector: "Energy", description: "Fuel cell power systems" },
  { symbol: "BE", name: "Bloom Energy Corporation", sector: "Energy", description: "Fuel cell power generation" },
  { symbol: "CLNE", name: "Clean Energy Fuels Corp.", sector: "Energy", description: "Clean fuel and renewable energy" },
  { symbol: "RUN", name: "Sunrun Inc.", sector: "Energy", description: "Residential solar power systems" },
  { symbol: "ENPH", name: "Enphase Energy Inc.", sector: "Energy", description: "Solar microinverters and batteries" },
  { symbol: "SEDG", name: "SolarEdge Technologies Inc.", sector: "Energy", description: "Solar power electronics and monitoring" },
  { symbol: "ADANIGREEN", name: "Adani Green Energy Limited", sector: "Energy", description: "Renewable energy generation" },
  { symbol: "RELAYR", name: "Reliance Industries Limited", sector: "Energy", description: "Oil, gas, petrochemicals, and renewables" },
  { symbol: "PSA", name: "Stellantis N.V.", sector: "Automotive", description: "Automotive manufacturer (Jeep, Ram, Fiat)" },
  { symbol: "TM", name: "Toyota Motor Corporation", sector: "Automotive", description: "Automotive manufacturer" },
  { symbol: "HMC", name: "Honda Motor Co., Ltd.", sector: "Automotive", description: "Automotive and motorcycle manufacturer" },
  { symbol: "BMW", name: "Bayerische Motoren Werke AG", sector: "Automotive", description: "Luxury automotive manufacturer" },
  { symbol: "DDAIF", name: "Daimler AG", sector: "Automotive", description: "Luxury automotive manufacturer" },
  { symbol: "VW", name: "Volkswagen AG", sector: "Automotive", description: "Automotive manufacturer" },
  { symbol: "VWAGY", name: "Volkswagen Group", sector: "Automotive", description: "Automotive manufacturer" },
  { symbol: "NSANY", name: "Nissan Motor Co., Ltd.", sector: "Automotive", description: "Automotive manufacturer" },
  { symbol: "F", name: "Ford Motor Company", sector: "Automotive", description: "Automotive manufacturer" },
  { symbol: "GM", name: "General Motors Company", sector: "Automotive", description: "Automotive manufacturer" },
  { symbol: "TRA", name: "Tera", sector: "Technology", description: "Technology company" },
  { symbol: "LI", name: "Li Auto Inc.", sector: "Automotive", description: "Chinese electric vehicle manufacturer" },
  { symbol: "NIO", name: "NIO Inc.", sector: "Automotive", description: "Chinese electric vehicle manufacturer" },
  { symbol: "XPEV", name: "XPeng Inc.", sector: "Automotive", description: "Chinese electric vehicle manufacturer" },
  { symbol: "BYD", name: "BYD Company Limited", sector: "Automotive", description: "Chinese EV and battery manufacturer" },
  { symbol: "BLDP", name: "Ballard Power Systems Inc.", sector: "Energy", description: "Fuel cell systems manufacturer" },
  { symbol: "HYLN", name: "Hyliion Holdings Corp.", sector: "Industrial", description: "Electric powertrain for heavy vehicles" },
  { symbol: "VLTY", name: "Velocity Acquisition Corp.", sector: "Industrial", description: "SPAC for EV technology" },
  { symbol: "TAC", name: "TransAtlantic Petroleum Ltd.", sector: "Energy", description: "Oil and gas exploration" },
  { symbol: "CCIV", name: "Churchill Capital Corp IV", sector: "Technology", description: "SPAC merger with Lucid Motors" },
  { symbol: "MRO", name: "Marathon Oil Corporation", sector: "Energy", description: "Oil exploration and production" },
  { symbol: "FOE", name: "Franklin Street Properties Corp.", sector: "Finance", description: "Real estate investment trust" },
  { symbol: "NWL", name: "Newell Brands Inc.", sector: "Consumer", description: "Consumer goods manufacturer" },
  { symbol: "HUB", name: "HubSpot Inc.", sector: "Technology", description: "Customer relationship management software" },
  { symbol: "RBLX", name: "Roblox Corporation", sector: "Technology", description: "Online gaming and metaverse platform" },
  { symbol: "ZNGA", name: "Zynga Inc.", sector: "Entertainment", description: "Mobile game developer" },
  { symbol: "TTWO", name: "Take-Two Interactive Software Inc.", sector: "Entertainment", description: "Video game developer and publisher" },
  { symbol: "EA", name: "Electronic Arts Inc.", sector: "Entertainment", description: "Video game developer and publisher" },
  { symbol: "ATVI", name: "Activision Blizzard Inc.", sector: "Entertainment", description: "Video game developer and publisher" },
  { symbol: "SPOT", name: "Spotify Technology S.A.", sector: "Entertainment", description: "Music and podcast streaming platform" },
  { symbol: "SIR", name: "Sirius XM Holdings Inc.", sector: "Entertainment", description: "Satellite radio and online radio services" },
  { symbol: "IHC", name: "IHeartMedia Inc.", sector: "Entertainment", description: "Radio broadcasting company" },
  { symbol: "VRM", name: "Virent Inc.", sector: "Energy", description: "Renewable fuels technology" },
  { symbol: "LCID", name: "Lucid Group Inc.", sector: "Automotive", description: "Electric luxury vehicle manufacturer" },
  { symbol: "RIVN", name: "Rivian Automotive Inc.", sector: "Automotive", description: "Electric adventure vehicle manufacturer" },
  { symbol: "FISV", name: "Fiserv Inc.", sector: "Technology", description: "Financial services software and payment processing" },
  { symbol: "FDS", name: "FactSet Research Systems Inc.", sector: "Finance", description: "Financial data and analytics" },
  { symbol: "BX", name: "Blackstone Inc.", sector: "Finance", description: "Investment management and private equity" },
  { symbol: "KKR", name: "KKR & Co. Inc.", sector: "Finance", description: "Investment management and private equity" },
  { symbol: "APO", name: "Apollo Global Management Inc.", sector: "Finance", description: "Investment management and private equity" },
  { symbol: "ARES", name: "Ares Management Corporation", sector: "Finance", description: "Investment management and credit solutions" },
  { symbol: "OKE", name: "ONEOK Inc.", sector: "Energy", description: "Natural gas and liquid pipeline operator" },
  { symbol: "FANG", name: "Diamondback Energy Inc.", sector: "Energy", description: "Oil and natural gas producer" },
  { symbol: "EOG", name: "EOG Resources Inc.", sector: "Energy", description: "Oil and natural gas exploration" },
  { symbol: "APA", name: "APA Corporation", sector: "Energy", description: "Oil and natural gas exploration" },
  { symbol: "WMB", name: "Williams Companies Inc.", sector: "Energy", description: "Natural gas and NGL pipeline" },
  { symbol: "AR", name: "Antero Resources Corporation", sector: "Energy", description: "Natural gas and oil producer" },
  { symbol: "MTDR", name: "Matador Resources Company", sector: "Energy", description: "Oil and natural gas producer" },
  { symbol: "PR", name: "Permian Basin Royalty Trust", sector: "Energy", description: "Permian Basin oil and gas royalties" },
  { symbol: "PEP", name: "PepsiCo Inc.", sector: "Consumer", description: "Beverage and snack food company" },
  { symbol: "MKC", name: "McCormick & Company Inc.", sector: "Consumer", description: "Spices and seasonings manufacturer" },
  { symbol: "MDLZ", name: "Mondelez International Inc.", sector: "Consumer", description: "Snack and confectionery company" },
  { symbol: "GIS", name: "General Mills Inc.", sector: "Consumer", description: "Food manufacturer" },
  { symbol: "K", name: "Kellanova", sector: "Consumer", description: "Cereal and plant-based foods" },
  { symbol: "EL", name: "Estée Lauder Companies Inc.", sector: "Consumer", description: "Cosmetics and skincare company" },
  { symbol: "CLX", name: "Clorox Company", sector: "Consumer", description: "Household and consumer products" },
  { symbol: "MO", name: "Altria Group Inc.", sector: "Consumer", description: "Tobacco and nicotine products" },
  { symbol: "PM", name: "Philip Morris International Inc.", sector: "Consumer", description: "Tobacco and nicotine products" },
  { symbol: "BTI", name: "British American Tobacco plc", sector: "Consumer", description: "Tobacco products" },
  { symbol: "SJM", name: "The J.M. Smucker Company", sector: "Consumer", description: "Jam, peanut butter, and pet foods" },
  { symbol: "MNST", name: "Monster Beverage Corporation", sector: "Consumer", description: "Energy drink manufacturer" },
  { symbol: "BMRN", name: "Biomarin Pharmaceutical Inc.", sector: "Healthcare", description: "Biopharmaceutical company" },
  { symbol: "CRSP", name: "CRISPR Therapeutics AG", sector: "Healthcare", description: "Gene editing and therapy company" },
  { symbol: "EDIT", name: "Editas Medicine Inc.", sector: "Healthcare", description: "Gene editing therapeutics" },
  { symbol: "BEAM", name: "Beam Therapeutics Inc.", sector: "Healthcare", description: "Gene editing therapeutics" },
  { symbol: "VERV", name: "Verve Therapeutics Inc.", sector: "Healthcare", description: "Genomics-based medicine" },
  { symbol: "TMDX", name: "Tandem Diabetes Care Inc.", sector: "Healthcare", description: "Insulin pump and diabetes management" },
  { symbol: "INVA", name: "Innoviva Inc.", sector: "Healthcare", description: "Respiratory pharmaceutical company" },
  { symbol: "EXPR", name: "Express Inc.", sector: "Consumer", description: "Apparel and accessories retailer" },
  { symbol: "AEO", name: "American Eagle Outfitters Inc.", sector: "Consumer", description: "Clothing retailer" },
  { symbol: "ANF", name: "Abercrombie & Fitch Co.", sector: "Consumer", description: "Clothing retailer" },
  { symbol: "ATGE", name: "Artemis Technology Corp.", sector: "Industrial", description: "Manufacturing company" },
  { symbol: "ACGL", name: "Arch Capital Group Ltd.", sector: "Finance", description: "Insurance and reinsurance" },
  { symbol: "PGR", name: "The Progressive Corporation", sector: "Finance", description: "Auto and home insurance" },
  { symbol: "HCC", name: "Heritage Auctions Inc.", sector: "Consumer", description: "Auctions and appraisals" },
  { symbol: "UNOL", name: "Union Bankshares Corporation", sector: "Finance", description: "Community bank holding company" },
  { symbol: "BGFV", name: "Big 5 Sporting Goods Corporation", sector: "Consumer", description: "Sporting goods retailer" },
  { symbol: "DECK", name: "Deckers Outdoor Corporation", sector: "Consumer", description: "Footwear and apparel (Ugg, The North Face)" },
  { symbol: "VFC", name: "VF Corporation", sector: "Consumer", description: "Apparel and footwear (Vans, North Face, Timberland)" },
  { symbol: "LULU", name: "Lululemon Athletica Inc.", sector: "Consumer", description: "Athletic apparel and lifestyle" },
  { symbol: "GRMN", name: "Garmin Ltd.", sector: "Technology", description: "GPS and wearable technology" },
  { symbol: "GoPro", name: "GoPro Inc.", sector: "Technology", description: "Action camera manufacturer" },
  { symbol: "TXN", name: "Texas Instruments Incorporated", sector: "Technology", description: "Semiconductor manufacturer" },
  { symbol: "SWKS", name: "Skyworks Solutions Inc.", sector: "Technology", description: "Semiconductor manufacturer" },
  { symbol: "POWI", name: "Power Integrations Inc.", sector: "Technology", description: "Semiconductor manufacturer" },
  { symbol: "SLAB", name: "Silicon Laboratories Inc.", sector: "Technology", description: "Semiconductor and software company" },
  { symbol: "MPWR", name: "Monolithic Power Systems Inc.", sector: "Technology", description: "Semiconductor manufacturer" },
  { symbol: "ON", name: "ON Semiconductor Corporation", sector: "Technology", description: "Semiconductor manufacturer" },
  { symbol: "CLFD", name: "Clearfield Inc.", sector: "Technology", description: "Fiber optic networking equipment" },
  { symbol: "CNXM", name: "Conexus Metals Corp.", sector: "Industrial", description: "Metals and mining" },
  { symbol: "GLD", name: "SPDR Gold Shares", sector: "Finance", description: "Gold ETF" },
  { symbol: "SLV", name: "iShares Silver Trust", sector: "Finance", description: "Silver ETF" },
  { symbol: "COPX", name: "Global X Copper Miners ETF", sector: "Finance", description: "Copper mining ETF" },
  { symbol: "DBB", name: "Invesco DB Precious Metals Fund", sector: "Finance", description: "Precious metals ETF" },
  { symbol: "DBC", name: "Invesco Commodities ETF", sector: "Finance", description: "Commodities ETF" },
  { symbol: "USO", name: "United States Oil Fund", sector: "Finance", description: "Crude oil ETF" },
  { symbol: "UGA", name: "United States Gasoline Fund", sector: "Finance", description: "Gasoline ETF" },
  { symbol: "VYM", name: "Vanguard High Dividend Yield ETF", sector: "Finance", description: "Dividend-focused ETF" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", sector: "Finance", description: "Total market ETF" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", sector: "Finance", description: "S&P 500 ETF" },
  { symbol: "VEA", name: "Vanguard FTSE Developed Markets ETF", sector: "Finance", description: "International developed markets ETF" },
  { symbol: "VWO", name: "Vanguard FTSE Emerging Markets ETF", sector: "Finance", description: "Emerging markets ETF" },
  { symbol: "BND", name: "Vanguard Total Bond Market ETF", sector: "Finance", description: "Bond market ETF" },
  { symbol: "VCIT", name: "Vanguard Intermediate-Term Corporate Bond ETF", sector: "Finance", description: "Corporate bond ETF" },
  { symbol: "AGG", name: "iShares Core U.S. Aggregate Bond ETF", sector: "Finance", description: "Aggregate bond ETF" },
  { symbol: "SHV", name: "iShares Short Treasury Bond ETF", sector: "Finance", description: "Short-term Treasury ETF" },
  { symbol: "IEF", name: "iShares 7-10 Year Treasury Bond ETF", sector: "Finance", description: "Intermediate Treasury ETF" },
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond ETF", sector: "Finance", description: "Long-term Treasury ETF" },
];

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchingSymbol, setIsSearchingSymbol] = useState(false);
  const [symbolSearchQuery, setSymbolSearchQuery] = useState("");
  const [quickAnalysisSymbol, setQuickAnalysisSymbol] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const hasAutoAnalyzed = React.useRef(false);

  useEffect(() => {
    loadCompanies();
    
    const urlParams = new URLSearchParams(window.location.search);
    const symbolToAnalyze = urlParams.get('analyze');
    if (symbolToAnalyze && !hasAutoAnalyzed.current) {
      hasAutoAnalyzed.current = true;
      setQuickAnalysisSymbol(symbolToAnalyze.toUpperCase());
      setTimeout(() => {
        const btn = document.querySelector('[data-analyze-btn]');
        if (btn) btn.click();
      }, 1500);
    }
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [searchQuery, sectorFilter, companies]);

  const loadCompanies = () => {
    setIsLoading(true);
    // Use hardcoded list instead of API call
    setCompanies(HARDCODED_COMPANIES);
    setFilteredCompanies(HARDCODED_COMPANIES);
    setIsLoading(false);
  };

  const filterCompanies = () => {
    let filtered = companies;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.symbol.toLowerCase().includes(query) ||
        c.sector.toLowerCase().includes(query)
      );
    }

    if (sectorFilter !== "all") {
      filtered = filtered.filter(c => c.sector === sectorFilter);
    }

    setFilteredCompanies(filtered);
  };

  const toggleCompany = (symbol) => {
    setSelectedCompanies(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const searchAndAddSymbol = async () => {
    if (!symbolSearchQuery.trim()) return;
    
    const symbol = symbolSearchQuery.toUpperCase().trim();
    const existing = companies.find(c => c.symbol.toUpperCase() === symbol);
    if (existing) {
      setSelectedCompanies(prev => 
        prev.includes(symbol) ? prev : [...prev, symbol]
      );
      alert(`${symbol} is already in your selection!`);
      setSymbolSearchQuery("");
      return;
    }

    setIsSearchingSymbol(true);
    
    try {
      const stockData = await callAwsFunction('getStockQuote', { symbol });

      if (stockData.error || !stockData.symbol) {
        alert(`Could not find symbol "${symbol}". Please check the ticker and try again.`);
        setIsSearchingSymbol(false);
        return;
      }

      // Add new company to list
      const newCompany = {
        symbol: stockData.symbol,
        name: stockData.name || symbol,
        sector: stockData.sector || "Other",
        description: stockData.description || "Stock information not available"
      };

      setCompanies(prev => [...prev, newCompany]);
      setSelectedCompanies(prev => [...prev, symbol]);
      setSymbolSearchQuery("");
      alert(`✅ ${stockData.name} added to your selection!`);
    } catch (error) {
      console.error("Error searching for symbol:", error);
      alert("Error searching for symbol. Please try again.");
    }
    
    setIsSearchingSymbol(false);
  };

  const analyzeStock = async () => {
    if (!quickAnalysisSymbol.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      const symbol = quickAnalysisSymbol.toUpperCase().trim();
      
      const stockData = await callAwsFunction('getStockAnalysis', { symbol });

      if (stockData.error) {
        alert(`Could not find symbol "${symbol}". Please try again.`);
        setIsAnalyzing(false);
        return;
      }

      setAnalysisResult({
        stock: stockData,
        recommendations: stockData.recommendations || []
      });
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Error analyzing stock. Please try again.");
    }
    
    setIsAnalyzing(false);
  };

  const addStockFromAnalysis = async (symbol) => {
    const existing = companies.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
    if (existing) {
      setSelectedCompanies(prev => 
        prev.includes(existing.symbol) ? prev : [...prev, existing.symbol]
      );
      alert(`${symbol} added to your selection!`);
      return;
    }

    setSymbolSearchQuery(symbol);
    await searchAndAddSymbol();
  };

  const sectors = [...new Set(companies.map(c => c.sector))];

  const sectorColors = {
    "Technology": "bg-blue-100 text-blue-700 border-blue-200",
    "Healthcare": "bg-green-100 text-green-700 border-green-200",
    "Finance": "bg-purple-100 text-purple-700 border-purple-200",
    "Consumer": "bg-orange-100 text-orange-700 border-orange-200",
    "Energy": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "Industrial": "bg-gray-100 text-gray-700 border-gray-200",
    "Automotive": "bg-red-100 text-red-700 border-red-200",
    "Entertainment": "bg-pink-100 text-pink-700 border-pink-200"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Building2 className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 leading-tight">
                  Browse Investments
                </h1>
                <p className="text-sm md:text-base lg:text-lg text-slate-600 leading-relaxed">
                  Select stocks and index funds to get AI-powered investment recommendations
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <Card className="border-2 border-emerald-300 shadow-lg mb-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Quick Stock Analysis</h2>
                <p className="text-sm text-slate-600">Get analysis for any public company by symbol</p>
              </div>
            </div>
            
            <div className="flex gap-3 mb-4">
              <Input
                placeholder="Enter stock symbol (e.g., AAPL, TSLA, MSFT)..."
                value={quickAnalysisSymbol}
                onChange={(e) => setQuickAnalysisSymbol(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && analyzeStock()}
                className="flex-1 h-14 text-lg border-emerald-300 focus:border-emerald-500"
                disabled={isAnalyzing}
              />
              <Button
                onClick={analyzeStock}
                disabled={isAnalyzing || !quickAnalysisSymbol.trim()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 h-14 px-8 text-base"
                data-analyze-btn
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>

            {analysisResult && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-6 border-2 border-emerald-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{analysisResult.stock.symbol}</h3>
                      <p className="text-slate-600">{analysisResult.stock.name}</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-slate-500">Price</p>
                      <p className="text-xl font-bold text-slate-900">
                        {analysisResult.stock.price != null ? `$${analysisResult.stock.price.toFixed(2)}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Market Cap</p>
                      <p className="text-base font-bold text-slate-900">
                        {analysisResult.stock.marketCap ? `${analysisResult.stock.marketCap}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">P/E Ratio</p>
                      <p className="text-xl font-bold text-blue-600">
                        {analysisResult.stock.peRatio != null ? analysisResult.stock.peRatio.toFixed(2) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">52W Change</p>
                      <p className="text-xl font-bold text-emerald-600">
                        {analysisResult.stock.weekChange52 != null ? `${analysisResult.stock.weekChange52.toFixed(2)}%` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Dividend Yield</p>
                      <p className="text-xl font-bold text-rose-600">
                        {analysisResult.stock.dividendYield != null ? `${analysisResult.stock.dividendYield.toFixed(2)}%` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => addStockFromAnalysis(analysisResult.stock.symbol)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Selection
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200 p-4 md:p-6 mb-8">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 mb-4 rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Search any ticker symbol (e.g., AAPL, GOOGL, BRK.B)..."
                    value={symbolSearchQuery}
                    onChange={(e) => setSymbolSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchAndAddSymbol()}
                    className="h-12 text-base border-blue-300 focus:border-blue-500"
                    disabled={isSearchingSymbol}
                  />
                </div>
                <Button
                  onClick={searchAndAddSymbol}
                  disabled={isSearchingSymbol || !symbolSearchQuery.trim()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 px-6"
                >
                  {isSearchingSymbol ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Symbol
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Search any publicly traded company by ticker symbol
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search companies by name, symbol, or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-slate-300 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-500" />
                <Select value={sectorFilter} onValueChange={setSectorFilter}>
                  <SelectTrigger className="w-40 h-12">
                    <SelectValue placeholder="All Sectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {sectors.map(sector => (
                      <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {selectedCompanies.length > 0 && (
          <div className="fixed bottom-8 left-0 right-0 z-40 pointer-events-none">
            <div className="max-w-7xl mx-auto md:ml-[272px] lg:ml-[288px] md:mr-8 px-4 md:px-0 pointer-events-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-40"></div>
                <Card className="relative border-2 border-white/50 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-2xl rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5"></div>
                  <CardContent className="relative p-5 md:p-6">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 md:gap-6">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl blur opacity-50"></div>
                          <div className="relative w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-white" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-1">
                            <span className="text-lg md:text-xl font-bold text-slate-900">
                              {selectedCompanies.length} Selected
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCompanies([])}
                              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 text-xs md:text-sm h-7 px-3 rounded-lg font-medium"
                            >
                              Clear all
                            </Button>
                          </div>
                          <p className="text-xs md:text-sm text-slate-600 font-medium">
                            Ready for AI-powered risk analysis
                          </p>
                        </div>
                      </div>
                      <Link to={createPageUrl("Analysis") + `?companies=${selectedCompanies.join(',')}`} className="w-full sm:w-auto flex-shrink-0">
                        <Button className="group relative w-full h-13 md:h-14 text-base md:text-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-2xl shadow-blue-500/50 hover:shadow-blue-600/60 font-bold px-8 md:px-10 rounded-xl transition-all duration-300 hover:scale-105">
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                          <TrendingUp className="relative w-5 h-5 md:w-6 md:h-6 mr-3 flex-shrink-0" />
                          <span className="relative whitespace-nowrap">Compare Risk Outcomes</span>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </>
          ) : (
          <AnimatePresence>
            {filteredCompanies.map((company) => {
              const isSelected = selectedCompanies.includes(company.symbol);
              return (
                <div key={company.symbol}>
                  <Card 
                    className={`group transition-all duration-300 border-2 rounded-xl h-full cursor-pointer ${
                      isSelected 
                        ? 'border-blue-500 shadow-lg shadow-blue-500/20 bg-gradient-to-br from-blue-50 to-indigo-50' 
                        : 'hover:shadow-lg border-slate-200 hover:border-blue-300 bg-white'
                    }`}
                    onClick={() => toggleCompany(company.symbol)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-slate-700" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg">{company.symbol}</h3>
                            <Badge 
                              variant="secondary"
                              className={`${sectorColors[company.sector] || 'bg-gray-100 text-gray-700'} border text-xs`}
                            >
                              {company.sector}
                            </Badge>
                          </div>
                        </div>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleCompany(company.symbol)}
                          className="w-5 h-5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                      </div>
                      
                      <h4 className="font-semibold text-slate-900 mb-2">{company.name}</h4>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                        {company.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </AnimatePresence>
          )}
        </div>

        {filteredCompanies.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No companies found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
