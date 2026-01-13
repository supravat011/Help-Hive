import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import {
  Menu, X, MapPin, AlertCircle, Clock, CheckCircle,
  ChevronRight, Heart, Shield, Truck, Stethoscope,
  Activity, User as UserIcon, Phone, ArrowRightCircle
} from 'lucide-react';
import { HelpRequest, User, UrgencyLevel, HelpType, RequestStatus } from './types';
import { analyzeEmergencyInput } from './services/geminiService';
import landingHeroBg from './landing_hero_bg.png';
import impactCommunity from './impact_community.png';
import appShowcase from './app_showcase.png';

// --- Context & State ---

interface AppContextType {
  user: any | null;
  setUser: (user: any) => void;
  login: (role: 'user' | 'volunteer') => void;
  logout: () => void;
  requests: HelpRequest[];
  addRequest: (req: HelpRequest) => void;
  acceptRequest: (id: string) => void;
  completeRequest: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};

// --- Mock Data ---

const MOCK_REQUESTS: HelpRequest[] = [
  {
    id: '1',
    userId: 'u2',
    userName: 'Sarah Jenkins',
    title: 'DIABETIC EMERGENCY - INSULIN NEEDED',
    description: 'Ran out of insulin, pharmacy closed due to storm. Need short acting insulin ASAP.',
    type: HelpType.MEDICAL,
    urgency: UrgencyLevel.HIGH,
    locationName: '123 Pine St (2.1 km away)',
    coordinates: { lat: 0, lng: 0 },
    distance: 2.1,
    createdAt: Date.now() - 1000 * 60 * 30, // 30 mins ago
    expiresAt: Date.now() + 1000 * 60 * 60 * 2,
    status: RequestStatus.OPEN
  },
  {
    id: '2',
    userId: 'u3',
    userName: 'Mike Ross',
    title: 'VEHICLE STUCK IN FLOOD',
    description: 'My sedan is stuck in rising water near the bridge. I am safe but need transport to shelter.',
    type: HelpType.TRANSPORT,
    urgency: UrgencyLevel.MEDIUM,
    locationName: 'Main St Bridge (0.5 km away)',
    coordinates: { lat: 0, lng: 0 },
    distance: 0.5,
    createdAt: Date.now() - 1000 * 60 * 10,
    expiresAt: Date.now() + 1000 * 60 * 60,
    status: RequestStatus.OPEN
  },
  {
    id: '3',
    userId: 'u4',
    userName: 'Elena D.',
    title: 'INFANT FORMULA SHORTAGE',
    description: 'Trapped at home due to road closure. Running low on formula for 6 month old.',
    type: HelpType.SUPPLIES,
    urgency: UrgencyLevel.LOW,
    locationName: 'Oak Apartments (5 km away)',
    coordinates: { lat: 0, lng: 0 },
    distance: 5.0,
    createdAt: Date.now() - 1000 * 60 * 120,
    expiresAt: Date.now() + 1000 * 60 * 60 * 5,
    status: RequestStatus.ACCEPTED,
    volunteerId: 'u1' // Current user if volunteer
  }
];

// --- Components ---

const Button: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'accent';
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}> = ({ children, variant = 'primary', onClick, className = '', type = 'button', disabled }) => {
  const baseStyle = "inline-flex items-center justify-center px-6 py-3 font-heading font-bold uppercase tracking-wider transition-all transform focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed clip-button";

  // "TowGo" style: squared off, high contrast
  const variants = {
    primary: "bg-brand-red text-white hover:bg-red-700 hover:-translate-y-1 shadow-md",
    secondary: "bg-brand-dark text-white hover:bg-slate-800 border border-slate-700",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30",
    accent: "bg-brand-accent text-brand-dark hover:bg-amber-400 hover:-translate-y-1 shadow-md",
    outline: "border-2 border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-400",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/10",
  };

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={{ clipPath: variant !== 'ghost' ? 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' : 'none' }}
    >
      {children}
    </button>
  );
};

const SectionTitle: React.FC<{ subtitle: string; title: string; align?: 'left' | 'center' | 'right', dark?: boolean }> = ({ subtitle, title, align = 'center', dark = false }) => (
  <div className={`mb-12 ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}>
    <span className={`block text-sm font-bold uppercase tracking-[0.2em] mb-2 ${dark ? 'text-brand-accent' : 'text-brand-red'}`}>
      {subtitle}
    </span>
    <h2 className={`text-4xl md:text-5xl font-heading font-bold uppercase leading-tight ${dark ? 'text-white' : 'text-brand-dark'}`}>
      {title}
    </h2>
    <div className={`h-1 w-24 bg-brand-red mt-4 ${align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : 'mr-auto'}`}></div>
  </div>
);

const Badge: React.FC<{ type: 'urgency' | 'status'; value: string }> = ({ type, value }) => {
  let colorClass = "bg-gray-100 text-gray-800";

  if (type === 'urgency') {
    if (value === UrgencyLevel.HIGH) colorClass = "bg-red-600 text-white animate-pulse";
    if (value === UrgencyLevel.MEDIUM) colorClass = "bg-amber-500 text-black";
    if (value === UrgencyLevel.LOW) colorClass = "bg-green-600 text-white";
  } else if (type === 'status') {
    if (value === RequestStatus.OPEN) colorClass = "bg-blue-600 text-white";
    if (value === RequestStatus.ACCEPTED) colorClass = "bg-purple-600 text-white";
    if (value === RequestStatus.COMPLETED) colorClass = "bg-slate-500 text-white";
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-wider ${colorClass} shadow-sm clip-badge`}
      style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%, 0 100%)' }}>
      {value}
    </span>
  );
};

const Header = () => {
  const { user, logout } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="bg-brand-dark border-b border-slate-800 sticky top-0 z-50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center cursor-pointer group" onClick={() => navigate('/')}>
            <div className="flex-shrink-0 flex items-center gap-3">
              <div className="bg-brand-red p-2 transform -skew-x-12 group-hover:bg-red-500 transition-colors">
                <Activity className="h-6 w-6 text-white transform skew-x-12" />
              </div>
              <span className="font-heading font-bold text-2xl tracking-tighter text-white uppercase italic">
                Help<span className="text-brand-red">Hive</span>
              </span>
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-1">
            {user ? (
              <>
                <Link to="/dashboard" className="text-slate-300 hover:text-white px-4 py-2 font-heading font-medium uppercase tracking-wide hover:bg-slate-800 skew-x-0">Dashboard</Link>
                {user.isVolunteer && (
                  <Link to="/volunteer-history" className="text-slate-300 hover:text-white px-4 py-2 font-heading font-medium uppercase tracking-wide hover:bg-slate-800">My Tasks</Link>
                )}
                <div className="h-8 w-px bg-slate-700 mx-4"></div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="block text-xs text-brand-accent font-bold uppercase">Welcome</span>
                    <span className="block text-sm text-white font-bold">{user.name}</span>
                  </div>
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white !py-2 !px-4" onClick={() => { logout(); navigate('/'); }}>Sign Out</Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-300 hover:text-white px-6 py-2 font-heading font-medium uppercase tracking-wide">Log In</Link>
                <Button variant="primary" onClick={() => navigate('/login')} className="!py-2">Get Started</Button>
              </>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-300 hover:text-white p-2">
              {isOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-brand-dark border-t border-slate-800">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-3 text-lg font-heading text-slate-300 hover:text-white hover:bg-slate-800 border-l-4 border-transparent hover:border-brand-red pl-4">Dashboard</Link>
                {user.isVolunteer && (
                  <Link to="/volunteer-history" onClick={() => setIsOpen(false)} className="block px-3 py-3 text-lg font-heading text-slate-300 hover:text-white hover:bg-slate-800 border-l-4 border-transparent hover:border-brand-red pl-4">My Tasks</Link>
                )}
                <button onClick={() => { logout(); setIsOpen(false); navigate('/'); }} className="w-full text-left block px-3 py-3 text-lg font-heading text-slate-300 hover:text-white hover:bg-slate-800 border-l-4 border-transparent hover:border-brand-red pl-4">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)} className="block px-3 py-3 text-lg font-heading text-slate-300 hover:text-white hover:bg-slate-800 border-l-4 border-transparent hover:border-brand-red pl-4">Log In</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

// --- Pages ---

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white overflow-hidden">
      {/* Hero */}
      <div className="relative bg-cover bg-center bg-no-repeat min-h-[90vh] flex items-center" style={{ backgroundImage: `url(${landingHeroBg})` }}>
        {/* Overlay with diagonal cut */}
        <div className="absolute inset-0 bg-brand-dark/70"></div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-white" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }}></div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 pt-20 pb-32">
          <div className="max-w-3xl">
            <div className="inline-block bg-brand-red px-4 py-1 mb-6 transform -skew-x-12 shadow-lg">
              <span className="block transform skew-x-12 font-bold text-white uppercase tracking-widest text-sm">Community Powered Response</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-white uppercase leading-tight mb-6 drop-shadow-xl">
              Immediate <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-accent">Emergency Assistance</span>
            </h1>
            <p className="mt-6 text-xl leading-8 text-slate-100 max-w-2xl font-light border-l-4 border-brand-accent pl-6 bg-brand-dark/40 pr-4 py-2 backdrop-blur-sm">
              HelpHive connects people in critical situations with nearby volunteers.
              When every second counts, rely on the power of community.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-6">
              <Button variant="primary" className="text-lg px-10 py-5" onClick={() => navigate('/login?mode=request')}>
                Request Emergency Help
              </Button>
              <Button variant="outline" className="text-lg px-10 py-5 border-white text-white hover:bg-white hover:text-brand-dark" onClick={() => navigate('/login?mode=volunteer')}>
                Offer Help as Volunteer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-24 bg-white relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionTitle subtitle="What We Do" title="Emergency Services" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Medical Aid', icon: Stethoscope, desc: 'Immediate first aid & essential medical supplies.', color: 'border-red-500' },
              { name: 'Rapid Transport', icon: Truck, desc: 'Evacuation from floods, fires, or dangerous areas.', color: 'border-blue-500' },
              { name: 'Safety & Shelter', icon: Shield, desc: 'Temporary housing during power outages or storms.', color: 'border-amber-500' },
              { name: 'Essential Supplies', icon: Heart, desc: 'Food, water, formula, and hygiene kits delivered.', color: 'border-green-500' },
            ].map((feature, idx) => (
              <div key={feature.name} className="group relative bg-slate-50 p-8 pt-12 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-t-4 border-b-2 border-slate-200 hover:border-b-brand-red">
                <div className={`absolute top-0 left-8 transform -translate-y-1/2 bg-brand-dark p-4 shadow-lg ${feature.color} border-t-4`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-heading font-bold text-brand-dark uppercase mb-3">{feature.name}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Section */}
      <div className="py-24 bg-slate-100 overflow-hidden relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-brand-accent/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-40 h-40 bg-brand-red/20 rounded-full blur-3xl"></div>
              <img
                src={impactCommunity}
                alt="Volunteers helping in a flooded street"
                className="rounded-lg shadow-2xl relative z-10 transform -rotate-2 hover:rotate-0 transition-transform duration-500 border-4 border-white"
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-6 shadow-xl border-l-4 border-brand-red hidden md:block">
                <p className="font-heading font-bold text-4xl text-brand-dark mb-1">15,000+</p>
                <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">Lives Impacted</p>
              </div>
            </div>
            <div>
              <SectionTitle subtitle="Our Impact" title="Real Heroes, Real Stories" align="left" />
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Since our launch, HelpHive has coordinated thousands of rescue missions during natural disasters.
                From hurricane relief in the southeast to blizzard support in the north, our network of verified volunteers
                is always ready to deploy.
              </p>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                We believe that in times of crisis, the strongest resource we have is each other. Join the movement that is redefining emergency response.
              </p>
              <div className="grid grid-cols-3 gap-8 border-t border-slate-300 pt-8">
                <div>
                  <p className="text-3xl font-heading font-bold text-brand-red">500+</p>
                  <p className="text-xs uppercase font-bold text-slate-500 mt-1">Active Cities</p>
                </div>
                <div>
                  <p className="text-3xl font-heading font-bold text-brand-red">12m</p>
                  <p className="text-xs uppercase font-bold text-slate-500 mt-1">Response Time</p>
                </div>
                <div>
                  <p className="text-3xl font-heading font-bold text-brand-red">4.9/5</p>
                  <p className="text-xs uppercase font-bold text-slate-500 mt-1">Trust Score</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile App Section */}
      <div className="py-24 bg-brand-dark relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <SectionTitle subtitle="Always Ready" title="Help in your Pocket" align="left" dark />
              <p className="text-xl text-slate-300 mb-8 font-light">
                The HelpHive mobile app gives you instant access to our emergency network.
                Track real-time alerts, manage volunteer missions, and communicate securely—all from your phone.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  "Real-time GPS tracking of requests",
                  "Instant push notifications for nearby alerts",
                  "Secure in-app messaging",
                  "Offline mode for low-connectivity areas"
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-300">
                    <CheckCircle className="w-5 h-5 text-brand-accent mr-3 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-4">
                <Button variant="accent" className="font-bold">
                  Download for iOS
                </Button>
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white hover:border-white">
                  Android Build
                </Button>
              </div>
            </div>
            <div className="order-1 lg:order-2 flex justify-center perspective-1000">
              <img
                src={appShowcase}
                alt="Mobile App Interface"
                className="max-w-md w-full drop-shadow-[0_20px_50px_rgba(220,38,38,0.3)] transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Process / How It Works */}
      <div className="py-24 bg-slate-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionTitle subtitle="Workflow" title="How It Works" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Request", desc: "Post your emergency details and location instantly.", icon: AlertCircle },
              { title: "Connect", desc: "Nearby volunteers receive real-time high-priority alerts.", icon: Activity },
              { title: "Resolve", desc: "Help arrives. Confirm safety and close the request.", icon: CheckCircle }
            ].map((step, idx) => (
              <div key={idx} className="relative p-8 bg-white shadow-xl border-l-4 border-brand-red">
                <div className="absolute -top-6 right-8 text-8xl font-heading font-bold text-slate-100 -z-10">{idx + 1}</div>
                <step.icon className="w-12 h-12 text-brand-red mb-6" />
                <h3 className="text-2xl font-heading font-bold text-brand-dark uppercase mb-3">{step.title}</h3>
                <p className="text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action Strip - Slanted */}
      <div className="relative py-24 bg-brand-red overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-12 text-center lg:text-left">
          <div className="text-white lg:max-w-2xl">
            <h2 className="text-4xl font-heading font-bold uppercase mb-4">Ready to Make a Difference?</h2>
            <p className="text-xl text-red-100">Join our network of verified volunteers. Your skills could save a life in your neighborhood today.</p>
          </div>
          <div>
            <Button variant="secondary" className="bg-brand-dark text-white hover:bg-slate-900 border-none text-xl px-12 py-4 shadow-2xl" onClick={() => navigate('/login?mode=volunteer')}>
              Join The Hive
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-brand-dark text-slate-400 py-16 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Activity className="h-6 w-6 text-brand-red" />
                <span className="font-heading font-bold text-2xl text-white uppercase italic">Help<span className="text-brand-red">Hive</span></span>
              </div>
              <p className="text-sm leading-relaxed">
                A crowd-supported emergency assistance platform designed for rapid response and community resilience.
              </p>
            </div>
            <div>
              <h4 className="text-white font-heading font-bold uppercase tracking-wider mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-brand-red transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-brand-red transition-colors">Safety Guidelines</a></li>
                <li><a href="#" className="hover:text-brand-red transition-colors">Volunteer Rules</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-heading font-bold uppercase tracking-wider mb-6">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-brand-red" /> 1-800-HELP-NOW</li>
                <li className="flex items-center gap-3"><MapPin className="w-4 h-4 text-brand-red" /> 123 Emergency Lane, Safety City</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between text-xs uppercase tracking-wider">
            <p>&copy; 2024 HelpHive Platform. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const Dashboard = () => {
  const { requests, user } = useAppContext();
  const navigate = useNavigate();

  const isVolunteer = user?.role === 'volunteer';
  const displayRequests = isVolunteer
    ? requests.filter(r => r.status === 'open' || r.status === RequestStatus.OPEN).sort((a, b) => {
      const urgencyA = a.urgency_level || a.urgency;
      const urgencyB = b.urgency_level || b.urgency;
      return (urgencyA === 'high' || urgencyA === UrgencyLevel.HIGH) ? -1 : 1;
    })
    : requests.filter(r => r.user_id === user?.id || r.userId === user?.id);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-brand-dark py-12 pb-24 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="text-brand-red font-bold uppercase tracking-widest text-sm">Control Center</span>
              <h1 className="text-4xl font-heading font-bold text-white uppercase mt-1">
                {isVolunteer ? "Nearby Alerts" : "My Requests"}
              </h1>
            </div>
            {!isVolunteer && (
              <Button variant="danger" onClick={() => navigate('/create-request')}>
                <AlertCircle className="w-5 h-5 mr-2" />
                New Request
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        <div className="space-y-4">
          {displayRequests.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-none shadow-xl border-t-4 border-slate-300">
              <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-heading font-bold text-slate-700 uppercase">No Active Requests</h3>
              <p className="text-slate-500 mt-2">All is quiet in your area.</p>
            </div>
          ) : (
            displayRequests.map(req => {
              // Normalize properties to handle both API formats
              const urgency = req.urgency_level || req.urgency || 'low';
              const type = req.help_type || req.type || 'other';
              const status = req.status || 'open';
              const locationName = req.location_name || req.locationName || 'Unknown';
              const distance = req.distance != null ? req.distance : 0;
              const createdAt = req.created_at || req.createdAt || Date.now();

              return (
                <div key={req.id} onClick={() => navigate(`/request/${req.id}`)} className="group bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-lg border-l-8 border-brand-dark hover:shadow-2xl relative overflow-hidden">
                  {/* Urgency Color Strip */}
                  <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-12 -translate-y-12 rotate-45 ${urgency === 'high' || urgency === UrgencyLevel.HIGH ? 'bg-red-600' : urgency === 'medium' || urgency === UrgencyLevel.MEDIUM ? 'bg-amber-500' : 'bg-green-600'
                    }`}></div>

                  <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0 flex flex-col items-center justify-center bg-slate-100 p-4 w-full md:w-32 border border-slate-200">
                      <span className="text-3xl font-heading font-bold text-slate-700">{distance.toFixed(1)}</span>
                      <span className="text-xs font-bold uppercase text-slate-500">KM Away</span>
                    </div>
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <Badge type="urgency" value={urgency} />
                        <Badge type="status" value={status} />
                        <span className="text-xs font-bold text-brand-dark bg-slate-200 px-2 py-1 uppercase">{type}</span>
                      </div>
                      <h3 className="text-2xl font-heading font-bold text-brand-dark uppercase group-hover:text-brand-red transition-colors mb-2">{req.title}</h3>
                      <p className="text-slate-600 line-clamp-2 border-l-2 border-slate-300 pl-3 mb-4">{req.description}</p>

                      <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-brand-accent" />
                          {Math.floor((Date.now() - createdAt) / 60000)}m ago
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-brand-accent" />
                          {locationName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center border-l border-slate-100 pl-6">
                      <ChevronRight className="w-8 h-8 text-slate-300 group-hover:text-brand-red group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const CreateRequest = () => {
  const { addRequest, user } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Form State
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');

  // Auto-filled by Gemini or defaults
  const [title, setTitle] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>(UrgencyLevel.MEDIUM);
  const [type, setType] = useState<HelpType>(HelpType.OTHER);

  // Gemini Handler
  const handleAnalyze = async () => {
    if (description.length < 5) return;
    setAnalyzing(true);
    try {
      const result = await analyzeEmergencyInput(description);
      setTitle(result.title);
      setUrgency(result.urgency);
      setType(result.suggestedType);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newRequest: HelpRequest = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user?.id || 'guest',
      userName: user?.full_name || 'Guest User',
      title: title || 'Emergency Request',
      description,
      type,
      urgency,
      locationName: locationName || 'Unknown Location',
      coordinates: { lat: 0, lng: 0 },
      distance: 0.2,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 4,
      status: RequestStatus.OPEN
    };

    try {
      await addRequest(newRequest);
      navigate('/dashboard');
    } catch (error: any) {
      alert('Failed to create request: ' + (error.error || error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (description.length > 10 && !title) {
        handleAnalyze();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [description]);

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-2xl border-t-8 border-brand-red">
        <div className="bg-brand-dark px-8 py-6 flex items-center gap-4">
          <div className="p-3 bg-red-600 rounded-sm">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-white uppercase tracking-wider">New Emergency Request</h1>
            <p className="text-slate-400 text-sm">Fill details accurately for faster response.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div>
            <label className="block text-sm font-bold uppercase text-slate-700 tracking-wider mb-2">
              Situation Description
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-slate-50 border-2 border-slate-200 p-4 focus:border-brand-red focus:ring-0 transition-colors font-sans text-lg"
              placeholder="Describe the emergency..."
            />
            {analyzing && <p className="text-xs text-brand-red mt-2 font-bold uppercase flex items-center gap-2 animate-pulse"><Activity className="w-4 h-4" /> AI Analyzing Severity...</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold uppercase text-slate-700 tracking-wider mb-2">Urgency Level</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                className="w-full bg-slate-50 border-2 border-slate-200 p-3 focus:border-brand-red focus:ring-0 font-bold uppercase"
              >
                {Object.values(UrgencyLevel).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase text-slate-700 tracking-wider mb-2">Type of Help</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as HelpType)}
                className="w-full bg-slate-50 border-2 border-slate-200 p-3 focus:border-brand-red focus:ring-0 font-bold uppercase"
              >
                {Object.values(HelpType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-slate-700 tracking-wider mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 p-3 focus:border-brand-red focus:ring-0 font-bold"
              placeholder="Auto-generated title..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-slate-700 tracking-wider mb-2">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
              <input
                required
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-200 p-3 pl-10 focus:border-brand-red focus:ring-0"
                placeholder="Address or landmark"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <Button type="submit" variant="danger" disabled={loading || !title} className="w-full text-xl py-4">
              {loading ? 'Transmitting...' : 'BROADCAST ALERT'}
            </Button>
            <p className="text-center text-xs text-slate-400 mt-4 uppercase tracking-widest">
              Alert will be sent to volunteers within 5km radius
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

const RequestDetails = () => {
  const { id } = useParams();
  const { requests, acceptRequest, user } = useAppContext();
  const navigate = useNavigate();

  const request = requests.find(r => r.id === id);

  if (!request) return <div className="p-12 text-center text-xl font-heading font-bold uppercase">Request not found</div>;

  const handleOfferHelp = () => {
    acceptRequest(request.id);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 text-sm font-bold uppercase tracking-wider text-slate-500 hover:text-brand-dark flex items-center">
          &larr; Return to Dashboard
        </button>

        <div className="bg-white shadow-2xl">
          <div className="bg-brand-dark p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>

            <div className="relative z-10">
              <div className="flex gap-3 mb-4">
                <Badge type="urgency" value={request.urgency} />
                <Badge type="status" value={request.status} />
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase leading-tight mb-2">{request.title}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-slate-400 text-sm font-medium">
                <span className="flex items-center gap-2"><UserIcon className="w-4 h-4" /> {request.userName}</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {new Date(request.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Main Content */}
            <div className="md:col-span-2 p-8 border-r border-slate-100">
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-4">Situation Report</h3>
              <p className="text-xl text-brand-dark leading-relaxed font-medium mb-8">
                {request.description}
              </p>

              <div className="bg-slate-50 border-l-4 border-brand-accent p-6">
                <h4 className="font-heading font-bold text-brand-dark uppercase mb-2">Required Assistance</h4>
                <div className="flex items-center gap-2 text-brand-red font-bold">
                  <Activity className="w-5 h-5" />
                  {request.type}
                </div>
              </div>
            </div>

            {/* Sidebar Action */}
            <div className="p-8 bg-slate-50 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-4">Location Data</h3>
                <div className="mb-8">
                  <div className="w-full h-40 bg-slate-200 flex items-center justify-center mb-3 border-2 border-white shadow-inner">
                    <MapPin className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="font-bold text-brand-dark">{request.locationName}</p>
                  <p className="text-sm text-slate-500">{request.distance} km from your location</p>
                </div>
              </div>

              {user?.isVolunteer && request.status === RequestStatus.OPEN ? (
                <Button onClick={handleOfferHelp} variant="primary" className="w-full py-4 text-lg shadow-xl">
                  Accept Task
                </Button>
              ) : request.status === RequestStatus.ACCEPTED ? (
                <div className="bg-purple-100 border border-purple-200 text-purple-800 p-4 text-center font-bold uppercase">
                  Response In Progress
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VolunteerHistory = () => {
  const { requests, user, completeRequest } = useAppContext();
  const myTasks = requests.filter(r => r.volunteerId === user?.id);

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-brand-dark p-3">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-brand-dark uppercase">Mission Log</h1>
        </div>

        <div className="space-y-6">
          {myTasks.length === 0 ? (
            <div className="bg-white p-8 border-l-4 border-slate-300 shadow-md">
              <p className="text-slate-500 font-medium">No missions accepted yet. Check the dashboard for active alerts.</p>
            </div>
          ) : (
            myTasks.map(task => (
              <div key={task.id} className="bg-white p-6 shadow-md border-l-4 border-brand-accent flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-heading font-bold text-xl text-brand-dark uppercase">{task.title}</h3>
                    <Badge type="status" value={task.status} />
                  </div>
                  <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {task.locationName}
                  </p>
                </div>

                {task.status === RequestStatus.ACCEPTED && (
                  <Button variant="outline" onClick={() => completeRequest(task.id)} className="border-green-600 text-green-700 hover:bg-green-50 w-full md:w-auto">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Complete Mission
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ... imports
import Login from './Login';
import Register from './Register';

// ... (rest of imports and components)

// Keep other components (Button, SectionTitle, Badge, Header, LandingPage, Dashboard, CreateRequest, RequestDetails, VolunteerHistory) as they are...



const AppContent = () => {
  // Only show Header if not on login/register pages
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      {!isAuthPage && <Header />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-request" element={<CreateRequest />} />
          <Route path="/request/:id" element={<RequestDetails />} />
          <Route path="/volunteer-history" element={<VolunteerHistory />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};


const App = () => {
  const [user, setUser] = useState<any | null>(null);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem('user_data');
      const token = localStorage.getItem('auth_token');

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('user_data');
          localStorage.removeItem('auth_token');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Fetch requests when user is logged in
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) {
        setRequests([]);
        return;
      }

      try {
        const { requestApi } = await import('./src/api/requestApi');
        const data = await requestApi.getAll();
        setRequests(data);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      }
    };

    fetchRequests();

    // Refresh requests every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const login = (role: 'user' | 'volunteer') => {
    // This is now handled by Login.tsx directly
    // Kept for backward compatibility
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setRequests([]);
  };

  const addRequest = async (req: HelpRequest) => {
    try {
      const { requestApi } = await import('./src/api/requestApi');
      const newRequest = await requestApi.create({
        title: req.title,
        description: req.description,
        help_type: req.type.toLowerCase() as any,
        urgency_level: req.urgency.toLowerCase() as any,
        location_name: req.locationName,
        latitude: req.coordinates.lat,
        longitude: req.coordinates.lng,
        expires_in_hours: 24
      });
      setRequests(prev => [newRequest, ...prev]);
    } catch (error) {
      console.error('Failed to create request:', error);
      throw error;
    }
  };

  const acceptRequest = async (id: string) => {
    if (!user || user.role !== 'volunteer') return;

    try {
      const { requestApi } = await import('./src/api/requestApi');
      await requestApi.accept(id);

      // Refresh requests
      const data = await requestApi.getAll();
      setRequests(data);
    } catch (error) {
      console.error('Failed to accept request:', error);
      throw error;
    }
  };

  const completeRequest = async (id: string) => {
    try {
      const { requestApi } = await import('./src/api/requestApi');
      await requestApi.complete(id);

      // Refresh requests
      const data = await requestApi.getAll();
      setRequests(data);
    } catch (error) {
      console.error('Failed to complete request:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Activity className="w-12 h-12 text-brand-red animate-pulse mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading HelpHive...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ user, setUser, login, logout, requests, addRequest, acceptRequest, completeRequest }}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;