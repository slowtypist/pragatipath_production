/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HeartPulse, 
  Droplets, 
  Zap, 
  BookOpen, 
  ClipboardList, 
  Users,
  UserCheck,
  X,
  CheckCircle2,
  Baby,
  Stethoscope,
  Apple,
  ChevronDown,
  Map as MapIcon,
  Navigation,
  Phone,
  Mic,
  Plus,
  Search,
  MapPin,
  Ambulance,
  Truck,
  Pill,
  ShoppingCart,
  Upload,
  Filter,
  Trash2,
  Store,
  ChevronRight,
  ChevronLeft,
  Info,
  Clock,
  Tag,
  Calendar,
  Droplet,
  Cloud,
  Activity,
  ArrowRight,
  Minus,
  AlertCircle,
  Building2,
  Utensils,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  History,
  Heart,
  Brain,
  MessageSquare,
  ShieldCheck,
  HelpCircle,
  GraduationCap,
  School,
  UserPlus,
  Languages,
  Users2,
  FileText,
  BadgeCheck,
  Timer,
  Globe,
  Mail,
  MicOff,
  TrendingUp,
  Send,
  ClipboardCheck,
  Navigation2,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import io from "socket.io-client";
import { QRCodeCanvas } from 'qrcode.react';
import { useOfflineSync } from './useOfflineSync';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { auth, db } from './firebase';

// --- Components ---

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      className={`w-48 h-auto ${className}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Thick Medical Cross with Rounded Corners */}
      <motion.path
        d="M75 25 H125 Q135 25 135 35 V75 H175 Q185 75 185 85 V115 Q185 125 175 125 H135 V165 Q135 175 125 175 H75 Q65 175 65 165 V125 H25 Q15 125 15 115 V85 Q15 75 25 75 H65 V35 Q65 25 75 25 Z"
        stroke="#6B46C1"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, ease: "easeInOut" }}
      />
      
      {/* Stylized Man Icon inside the cross */}
      <motion.circle
        cx="100"
        cy="85"
        r="14"
        stroke="#6B46C1"
        strokeWidth="8"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, ease: "easeInOut", delay: 1 }}
      />
      <motion.path
        d="M75 140 Q100 110 125 140"
        stroke="#6B46C1"
        strokeWidth="8"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, ease: "easeInOut", delay: 1.5 }}
      />
    </svg>
  );
};

interface MenuCardProps {
  title: string;
  icon: React.ElementType;
  color: 'green' | 'blue' | 'purple';
  delay: number;
  onClick?: () => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ 
  title, 
  icon: Icon, 
  color, 
  delay,
  onClick
}) => {
  const bgColor = color === 'green' ? 'bg-[#E8F5E9]' : color === 'blue' ? 'bg-[#E1F5FE]' : 'bg-[#F3E5F5]';
  const iconColor = color === 'green' ? 'text-[#2E7D32]' : color === 'blue' ? 'text-[#0288D1]' : 'text-[#6B46C1]';
  const shadowColor = color === 'green' ? 'shadow-green-100' : color === 'blue' ? 'shadow-blue-100' : 'shadow-purple-100';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: 'spring', stiffness: 100 }}
      whileHover={{ scale: 1.05, translateY: -5 }}
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-8 rounded-3xl shadow-xl ${bgColor} ${shadowColor} cursor-pointer transition-all duration-300 border border-white/50`}
    >
      <div className={`p-4 rounded-2xl bg-white shadow-sm mb-4 ${iconColor}`}>
        <Icon size={40} strokeWidth={1.5} />
      </div>
      <h3 className="text-2xl font-semibold text-gray-700 font-sans tracking-wide">
        {title}
      </h3>
    </motion.div>
  );
};

// --- Main App Component ---

export default function App() {
  // ── Offline-first mesh sync ────────────────────────────────────
  const [offlineState, offlineActions] = useOfflineSync();

  const [isAnimating, setIsAnimating] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [activePopup, setActivePopup] = useState<null | 'swasthya' | 'choice' | 'matriSeva' | 'generalHealth' | 'ambulance' | 'medicalShop' | 'profile' | 'phoneLogin' | 'ashaWorker'>(null);
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any>(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/history/')) {
      const uid = path.split('/')[2];
      if (uid) {
        setViewingHistory(uid);
        fetchMedicalHistory(uid);
      }
    }
  }, []);

  const fetchMedicalHistory = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const vaccDoc = await getDoc(doc(db, 'users', uid, 'data', 'vaccinations'));
      const matriDoc = await getDoc(doc(db, 'users', uid, 'data', 'maternalCare'));
      
      if (userDoc.exists()) {
        setHistoryData({
          profile: userDoc.data(),
          vaccinations: vaccDoc.exists() ? vaccDoc.data() : null,
          maternal: matriDoc.exists() ? matriDoc.data() : null
        });
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };
  
  // Firebase Auth & Profile State
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Medical Shop State
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResults, setOcrResults] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [detectedText, setDetectedText] = useState<string>("");
  const [detectedMedicines, setDetectedMedicines] = useState<{en: string, hi: string}[]>([]);

  const medicineCategories = [
    'All', 'Fever', 'Pain Relief', 'Antibiotics', 'Diabetes', 'BP', 'Women\'s Health', 'Child Medicines', 'General Wellness'
  ];

  const medicines = [
    { id: 1, name: 'Paracetamol', nameHi: 'पैरासिटामोल', price: 25, category: 'Fever', available: true, prescription: false, shop: 'Village Pharmacy', desc: 'Used for fever and mild pain.' },
    { id: 2, name: 'Ibuprofen', nameHi: 'इबुप्रोफेन', price: 40, category: 'Pain Relief', available: true, prescription: false, shop: 'City Medicos', desc: 'Relieves pain and inflammation.' },
    { id: 3, name: 'Amoxicillin', nameHi: 'एमोक्सिसिलिन', price: 120, category: 'Antibiotics', available: true, prescription: true, shop: 'Village Pharmacy', desc: 'Treats bacterial infections.' },
    { id: 4, name: 'Metformin', nameHi: 'मेटफॉर्मिन', price: 85, category: 'Diabetes', available: true, prescription: true, shop: 'Health First', desc: 'Manages blood sugar levels.' },
    { id: 5, name: 'Amlodipine', nameHi: 'एम्लोडिपाइन', price: 65, category: 'BP', available: true, prescription: true, shop: 'City Medicos', desc: 'Treats high blood pressure.' },
    { id: 6, name: 'Iron Tablets', nameHi: 'आयरन की गोलियां', price: 50, category: 'Women\'s Health', available: true, prescription: false, shop: 'Village Pharmacy', desc: 'Supplements iron deficiency.' },
    { id: 7, name: 'ORS Powder', nameHi: 'ओआरएस पाउडर', price: 15, category: 'Child Medicines', available: true, prescription: false, shop: 'Health First', desc: 'Rehydration salts for children.' },
    { id: 8, name: 'Multivitamin', nameHi: 'मल्टीविटामिन', price: 150, category: 'General Wellness', available: true, prescription: false, shop: 'City Medicos', desc: 'Daily health supplement.' },
    { id: 9, name: 'Azithromycin', nameHi: 'एजिथ्रोमाइसिन', price: 180, category: 'Antibiotics', available: false, prescription: true, shop: 'Village Pharmacy', desc: 'Strong antibiotic for infections.' },
  ];

  const medicalShopPharmacies = [
    { name: 'Village Pharmacy', nameHi: 'ग्राम फार्मेसी', distance: '0.8 km', discount: 10, delivery: true, contact: '9876543210' },
    { name: 'City Medicos', nameHi: 'सिटी मेडिकोज', distance: '2.5 km', discount: 15, delivery: true, contact: '8765432109' },
    { name: 'Health First', nameHi: 'हेल्थ फर्स्ट', distance: '1.2 km', discount: 5, delivery: false, contact: '7654321098' },
  ];

  const ambulanceSuppliers = [
    { name: 'Government Emergency', nameHi: 'सरकारी आपातकालीन', phone: '108', type: 'Free / निशुल्क' },
    { name: 'Red Cross Ambulance', nameHi: 'रेड क्रॉस एम्बुलेंस', phone: '+91 98765 43210', type: 'Private / निजी' },
    { name: 'Lifeline Services', nameHi: 'लाइफलाइन सेवाएं', phone: '+91 87654 32109', type: 'Private / निजी' },
    { name: 'Village Health Van', nameHi: 'ग्राम स्वास्थ्य वैन', phone: '+91 76543 21098', type: 'Community / सामुदायिक' }
  ];

  const ashaWorkers = [
    { name: 'Sunita Devi', nameHi: 'सुनीता देवी', phone: '+91 98765 43210', area: 'Village North', areaHi: 'ग्राम उत्तर' },
    { name: 'Meena Kumari', nameHi: 'मीना कुमारी', phone: '+91 87654 32109', area: 'Village South', areaHi: 'ग्राम दक्षिण' },
    { name: 'Rajni Sharma', nameHi: 'रजनी शर्मा', phone: '+91 76543 21098', area: 'Village East', areaHi: 'ग्राम पूर्व' }
  ];

  // Patient → ASHA request state
  const [showAshaRequestForm, setShowAshaRequestForm] = useState(false);
  const [ashaRequestSource, setAshaRequestSource] = useState<'General Health' | 'MatriSeva'>('General Health');
  const [ashaRequestIssue, setAshaRequestIssue] = useState('');
  const [ashaRequestUrgent, setAshaRequestUrgent] = useState(false);
  const [ashaRequestSent, setAshaRequestSent] = useState(false);
  const [ashaRequestSending, setAshaRequestSending] = useState(false);
  const [availableAshaWorkers, setAvailableAshaWorkers] = useState<any[]>([]);
  const [selectedAshaWorkerUid, setSelectedAshaWorkerUid] = useState<string>('');
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: '',
    dob: '',
    mobile: '',
    otp: '',
    village: '',
    district: '',
    bloodGroup: '',
    isPregnant: '',
    isNewbornMother: '',
    pregnancyStage: '',
    babyAge: '',
    immunization: false
  });

  // Shiksha (Education) State
  const [shikshaView, setShikshaView] = useState<'search' | 'list'>('search');
  const [shikshaRadius, setShikshaRadius] = useState(5000);
  const [shikshaManualLocation, setShikshaManualLocation] = useState('');
  const [shikshaLocationError, setShikshaLocationError] = useState<string | null>(null);
  const [isLocatingShiksha, setIsLocatingShiksha] = useState(false);
  const [isFetchingShiksha, setIsFetchingShiksha] = useState(false);
  const [nearbySchoolsRaw, setNearbySchoolsRaw] = useState<any[]>([]);
  const [nearbyHigherEdRaw, setNearbyHigherEdRaw] = useState<any[]>([]);
  const [nearbyEarlyChildhoodRaw, setNearbyEarlyChildhoodRaw] = useState<any[]>([]);
  const [nearbyCoachingRaw, setNearbyCoachingRaw] = useState<any[]>([]);
  const [nearbyTutorsRaw, setNearbyTutorsRaw] = useState<any[]>([]);

  // ASHA Worker State
  const [ashaView, setAshaView] = useState<'role_select' | 'signup' | 'login' | 'dashboard'>('role_select');
  const [ashaUser, setAshaUser] = useState<any>(null);
  const [ashaEmail, setAshaEmail] = useState('');
  const [ashaPhone, setAshaPhone] = useState('');
  const [ashaPassword, setAshaPassword] = useState('');
  const [ashaName, setAshaName] = useState('');
  const [ashaDistrict, setAshaDistrict] = useState('');
  const [ashaAuthMode, setAshaAuthMode] = useState<'google' | 'phone' | null>(null);
  const [ashaAuthError, setAshaAuthError] = useState<string | null>(null);
  const [ashaLoading, setAshaLoading] = useState(false);
  const [ashaDashboardTab, setAshaDashboardTab] = useState<'requests' | 'voice' | 'medicine' | 'performance' | 'escalate'>('requests');
  // All real-time from Firestore
  const [patientRequests, setPatientRequests] = useState<any[]>([]);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceNotes, setVoiceNotes] = useState<any[]>([]);
  const [selectedPatientForVoice, setSelectedPatientForVoice] = useState<string>('');
  const [medicineRequests, setMedicineRequests] = useState<any[]>([]);
  const [escalationMessage, setEscalationMessage] = useState('');
  const [escalationSent, setEscalationSent] = useState(false);
  const [ashaDataLoading, setAshaDataLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState({
    visitsCompleted: 0, referralsMade: 0, outcomesTracked: 0, pendingRequests: 0,
    month: new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })
  });

  // ── Pharmacy Owner State ───────────────────────────────────────────
  const [pharmacyAuthView, setPharmacyAuthView] = useState<'landing' | 'register' | 'login' | 'dashboard'>('landing');
  const [pharmacyUser, setPharmacyUser] = useState<any>(null);
  const [pharmacyProfile, setPharmacyProfile] = useState<any>(null);
  const [pharmacyTab, setPharmacyTab] = useState<'orders' | 'stock' | 'history' | 'ratings' | 'alerts'>('orders');
  const [pharmacyOrders, setPharmacyOrders] = useState<any[]>([]);
  const [pharmacyStock, setPharmacyStock] = useState<any[]>([]);
  const [pharmacyRatings, setPharmacyRatings] = useState<any[]>([]);
  const [pharmacyAlerts, setPharmacyAlerts] = useState<any[]>([]);
  const [pharmacyLoading, setPharmacyLoading] = useState(false);
  const [pharmacyAuthError, setPharmacyAuthError] = useState<string | null>(null);
  const [pharmacySaving, setPharmacySaving] = useState(false);
  // Register form
  const [pharmReg, setPharmReg] = useState({ shopName: '', ownerName: '', email: '', phone: '', address: '', district: '', state: '', gstin: '', licenseNo: '', password: '' });
  // Login form
  const [pharmLogin, setPharmLogin] = useState({ email: '', password: '' });
  const [deliveryPool] = useState(['Raju Kumar', 'Suresh Yadav', 'Pradeep Singh']);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState<string | null>(null);
  // Add medicine form
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [newMedicine, setNewMedicine] = useState({ name: '', nameHi: '', qty: '', unit: 'strips', threshold: '', price: '' });

  // ── Delivery Partner State ─────────────────────────────────────────
  const [deliveryAuthView, setDeliveryAuthView] = useState<'landing' | 'register' | 'login' | 'dashboard'>('landing');
  const [deliveryUser, setDeliveryUser] = useState<any>(null);
  const [deliveryProfile, setDeliveryProfile] = useState<any>(null);
  const [deliveryTab, setDeliveryTab] = useState<'orders' | 'earnings' | 'history'>('orders');
  const [deliveryOnline, setDeliveryOnline] = useState(false);
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [deliveryEarningsData, setDeliveryEarningsData] = useState<any>({ today: 0, weekly: 0, perDelivery: 40, paid: [] });
  const [deliveryProofOtp, setDeliveryProofOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState<string | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryAuthError, setDeliveryAuthError] = useState<string | null>(null);
  const [delivReg, setDelivReg] = useState({ name: '', email: '', phone: '', vehicle: 'Bicycle', area: '', password: '' });
  const [delivLogin, setDelivLogin] = useState({ email: '', password: '' });

  // ── Admin State ────────────────────────────────────────────────────
  const [adminAuthView, setAdminAuthView] = useState<'login' | 'dashboard'>('login');
  const [adminUser, setAdminUser] = useState<any>(null);
  const [adminTab, setAdminTab] = useState<'overview' | 'users' | 'facilities' | 'analytics' | 'supply' | 'payments' | 'broadcast' | 'reports'>('overview');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [adminLogin, setAdminLogin] = useState({ email: '', password: '' });
  // Live data
  const [adminAllUsers, setAdminAllUsers] = useState<any[]>([]);
  const [adminAshaWorkers, setAdminAshaWorkers] = useState<any[]>([]);
  const [adminPharmacies, setAdminPharmacies] = useState<any[]>([]);
  const [adminDeliveryPartners, setAdminDeliveryPartners] = useState<any[]>([]);
  const [adminEscalations, setAdminEscalations] = useState<any[]>([]);
  const [adminBroadcastMsg, setAdminBroadcastMsg] = useState('');
  const [adminBroadcastTarget, setAdminBroadcastTarget] = useState<'all' | 'asha' | 'patients'>('all');
  const [adminBroadcastSent, setAdminBroadcastSent] = useState(false);
  const [adminFacilities, setAdminFacilities] = useState<any[]>([
    { id: 'F001', name: 'Rampur PHC', type: 'PHC', beds: 20, bedsAvail: 14, doctors: 3, doctorsAvail: 2, stock: 'Good', district: 'Jaipur', lat: 22.5726, lng: 88.3639 },
    { id: 'F002', name: 'Village Health Centre', type: 'CHC', beds: 10, bedsAvail: 6, doctors: 2, doctorsAvail: 1, stock: 'Low', district: 'Jodhpur', lat: 22.5800, lng: 88.3700 },
    { id: 'F003', name: 'District Hospital', type: 'DH', beds: 80, bedsAvail: 52, doctors: 12, doctorsAvail: 9, stock: 'Good', district: 'Jaipur', lat: 22.5650, lng: 88.3580 },
  ]);
  const [editingFacility, setEditingFacility] = useState<any>(null);
  const [adminDataLoaded, setAdminDataLoaded] = useState(false);
  const ADMIN_EMAIL = 'mili.biswas26112003@gmail.com';

  // Samuday (Community) State
  const [samudayView, setSamudayView] = useState<'search' | 'list'>('search');
  const [samudayRadius, setSamudayRadius] = useState(5000);
  const [samudayManualLocation, setSamudayManualLocation] = useState('');
  const [samudayLocationError, setSamudayLocationError] = useState<string | null>(null);
  const [isLocatingSamuday, setIsLocatingSamuday] = useState(false);
  const [isFetchingSamuday, setIsFetchingSamuday] = useState(false);
  const [nearbyCentresRaw, setNearbyCentresRaw] = useState<any[]>([]);
  const [organisations, setOrganisations] = useState<any[]>([]);

  useEffect(() => {
    // Check server health
    fetch('/api/health')
      .then(res => res.json())
      .then(data => console.log('Server health:', data))
      .catch(err => console.error('Server health check failed:', err));
  }, []);

  const handlePrescriptionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPrescription(file);
      setUploadMessage("");
    }
  };

  const handleScanPrescription = async () => {
    if (!selectedPrescription) return;

    setOcrLoading(true);
    setUploadMessage("Scanning prescription...");
    setDetectedText("");
    setDetectedMedicines([]);
    setOcrResults([]);
    
    try {
      // 1. Convert image to base64 for Gemini
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedPrescription);
      const base64Data = await base64Promise;

      // 2. Call Gemini directly from frontend for OCR + Analysis
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              mimeType: selectedPrescription.type,
              data: base64Data
            }
          },
          {
            text: `Analyze this medical prescription image. 
            1. Transcribe all readable text from the image.
            2. Identify and extract all medicine names. 
            3. For each medicine found, provide its name in English and its common Hindi translation or transliteration.
            
            Return the result in JSON format.`
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rawText: { type: Type.STRING, description: "The full transcribed text from the prescription" },
              medicines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    en: { type: Type.STRING, description: "Medicine name in English" },
                    hi: { type: Type.STRING, description: "Medicine name in Hindi" }
                  },
                  required: ["en", "hi"]
                }
              }
            },
            required: ["rawText", "medicines"]
          }
        }
      });

      const result = JSON.parse(response.text || '{"rawText": "", "medicines": []}');
      
      setDetectedText(result.rawText);
      setDetectedMedicines(result.medicines);
      setUploadMessage("Prescription scanned and analyzed successfully.");

      // Update ocrResults to highlight in the medicine grid
      if (result.medicines && result.medicines.length > 0) {
        const names = result.medicines.map((m: any) => m.en.toLowerCase());
        setOcrResults(names);
      }
      
    } catch (error: any) {
      console.error("Scan Error:", error);
      setUploadMessage(`Failed to scan prescription: ${error.message || "Unknown error"}`);
    } finally {
      setOcrLoading(false);
    }
  };

  const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { text: "Extract only the names of medicines from this prescription. Return them as a simple comma-separated list." },
                { inlineData: { data: base64Data, mimeType: file.type } }
              ]
            }
          ]
        });

        const text = response.text || "";
        const extractedMedicines = text.split(',').map(m => m.trim().toLowerCase());
        setOcrResults(extractedMedicines);
        setOcrLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("OCR Error:", error);
      setOcrLoading(false);
    }
  };

  const addToCart = (medicine: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === medicine.id);
      if (existing) {
        return prev.map(item => item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...medicine, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const addToBabyCart = (product: any) => {
    setBabyCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromBabyCart = (id: number) => {
    setBabyCart(prev => prev.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = subtotal * 0.1; // 10% flat discount for demo
    return {
      subtotal,
      discount,
      total: subtotal - discount
    };
  };

  const counselors = [
    { id: 1, name: 'Dr. Anjali Verma', nameHi: 'डॉ. अंजली वर्मा', specialty: 'Maternal Mental Health', specialtyHi: 'मातृ मानसिक स्वास्थ्य', contact: 'Chat/Call', availability: 'Available' },
    { id: 2, name: 'Dr. Rajesh Kumar', nameHi: 'डॉ. राजेश कुमार', specialty: 'General Counseling', specialtyHi: 'सामान्य परामर्श', contact: 'Appointment', availability: 'Busy' },
    { id: 3, name: 'Smt. Sunita Devi', nameHi: 'श्रीमती सुनीता देवी', specialty: 'Community Health Worker', specialtyHi: 'सामुदायिक स्वास्थ्य कार्यकर्ता', contact: 'Call', availability: 'Available' }
  ];

  const pregnancyKitSteps = [
    { step: 1, title: 'When to take?', titleHi: 'कब लें?', desc: 'Take the test 1 week after your missed period for most accurate results.', descHi: 'सटीक परिणामों के लिए अपने छूटे हुए मासिक धर्म के 1 सप्ताह बाद परीक्षण करें।' },
    { step: 2, title: 'How to use?', titleHi: 'कैसे उपयोग करें?', desc: 'Collect urine in a clean container or hold the stick in the urine stream.', descHi: 'एक साफ कंटेनर में मूत्र इकट्ठा करें या छड़ी को मूत्र की धारा में रखें।' },
    { step: 3, title: 'Wait for results', titleHi: 'परिणामों की प्रतीक्षा करें', desc: 'Wait for 3-5 minutes as per the kit instructions.', descHi: 'किट के निर्देशों के अनुसार 3-5 मिनट प्रतीक्षा करें।' },
    { step: 4, title: 'Read results', titleHi: 'परिणाम पढ़ें', desc: 'Two lines mean Positive, one line means Negative.', descHi: 'दो लाइनों का मतलब पॉजिटिव, एक लाइन का मतलब नेगेटिव है।' }
  ];

  const sexualHealthInfo = [
    { title: 'Safe Sex', titleHi: 'सुरक्षित यौन संबंध', desc: 'Using protection like condoms prevents STIs and unplanned pregnancies.', descHi: 'कंडोम जैसे सुरक्षा का उपयोग एसटीआई और अनियोजित गर्भधारण को रोकता है।' },
    { title: 'Contraception', titleHi: 'गर्भनिरोधक', desc: 'Various options like pills, injections, or IUDs are available at local health centers.', descHi: 'स्थानीय स्वास्थ्य केंद्रों पर गोलियां, इंजेक्शन या आईयूडी जैसे विभिन्न विकल्प उपलब्ध हैं।' },
    { title: 'STI Awareness', titleHi: 'एसटीआई जागरूकता', desc: 'Regular checkups are important if you notice any unusual symptoms.', descHi: 'यदि आप कोई असामान्य लक्षण देखते हैं तो नियमित जांच महत्वपूर्ण है।' }
  ];

  const postpartumDepressionInfo = {
    title: 'Postpartum Depression (PPD)',
    titleHi: 'प्रसवोत्तर अवसाद (पीपीडी)',
    desc: 'PPD is a complex mix of physical, emotional, and behavioral changes that happen in some women after giving birth.',
    descHi: 'पीपीडी शारीरिक, भावनात्मक और व्यवहारिक परिवर्तनों का एक जटिल मिश्रण है जो कुछ महिलाओं में बच्चे को जन्म देने के बाद होता है।',
    causes: ['Hormonal changes', 'Stress', 'Lack of sleep', 'Physical exhaustion'],
    causesHi: ['हार्मोनल परिवर्तन', 'तनाव', 'नींद की कमी', 'शारीरिक थकावट'],
    symptoms: ['Severe mood swings', 'Excessive crying', 'Difficulty bonding with baby', 'Withdrawal from family'],
    symptomsHi: ['गंभीर मूड स्विंग्स', 'अत्यधिक रोना', 'बच्चे के साथ जुड़ने में कठिनाई', 'परिवार से दूरी'],
    management: ['Family support', 'Proper nutrition', 'Professional counseling', 'Medical care'],
    managementHi: ['पारिवारिक सहायता', 'उचित पोषण', 'पेशेवर परामर्श', 'चिकित्सा देखभाल']
  };

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // --- Firebase & New Features Logic ---

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Check if this user is a non-patient role — skip patient profile setup
        const isAdminEmail = user.email === 'mili.biswas26112003@gmail.com';
        const [ashaSnap, pharmSnap, delivSnap, adminSnap] = await Promise.all([
          getDoc(doc(db, 'asha_workers', user.uid)),
          getDoc(doc(db, 'pharmacy_owners', user.uid)),
          getDoc(doc(db, 'delivery_partners', user.uid)),
          getDoc(doc(db, 'admin_users', user.uid)),
        ]);
        const isNonPatient = isAdminEmail || ashaSnap.exists() || pharmSnap.exists() || delivSnap.exists() || adminSnap.exists();

        if (isNonPatient) {
          // Don't load/show patient profile form for non-patient roles
          setProfile(null);
          setShowProfileForm(false);
          setLoading(false);
          return;
        }

        // Fetch patient profile
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setProfile(profileData);
          setFormData(prev => ({ ...prev, ...profileData }));
          setShowProfileForm(false);
          setActivePopup(null);
        } else {
          // New patient user — show profile form
          setProfile(null);
          setShowProfileForm(true);
        }
        
        // Setup real-time listeners for data persistence
        // 1. Chat History
        const chatRef = doc(db, `users/${user.uid}/data/chatHistory`);
        onSnapshot(chatRef, (doc) => {
          if (doc.exists()) {
            // If we had a global chat state, we'd sync it here
          }
        });

        // 2. Vaccinations
        const vaccRef = doc(db, `users/${user.uid}/data/vaccinations`);
        onSnapshot(vaccRef, (doc) => {
          if (doc.exists()) {
            setCompletedVaccines(doc.data().completedVaccines || []);
          }
        });

        // 3. Maternal Care
        const matriRef = doc(db, `users/${user.uid}/data/maternalCare`);
        onSnapshot(matriRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            if (data.pregnancyData) {
              setLastPeriodDate(data.pregnancyData.lastPeriodDate || '');
              setPregnancyStage(data.pregnancyData.stage || '');
            }
            if (data.babyData) {
              setChildDob(data.babyData.dob || '');
            }
          }
        });
      } else {
        setProfile(null);
        setCompletedVaccines([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Show profile form only after animation is finished — only for patient role
  useEffect(() => {
    if (!isAnimating && user && !profile && !loading && selectedRole === 'patient') {
      setShowProfileForm(true);
    }
  }, [isAnimating, user, profile, loading, selectedRole]);

  // ── ASHA Auth & Firestore real-time data ─────────────────────────
  const loadAshaData = async (uid: string) => {
    setAshaDataLoading(true);
    // Live patient requests
    onSnapshot(
      query(collection(db, 'asha_workers', uid, 'patient_requests'), orderBy('createdAt', 'desc')),
      snap => {
        const reqs = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
        setPatientRequests(reqs);
        const visited = reqs.filter((r: any) => r.status === 'Visited').length;
        const pending = reqs.filter((r: any) => r.status === 'Pending').length;
        setPerformanceData(p => ({ ...p, visitsCompleted: visited, pendingRequests: pending }));
      }
    );
    // Live voice notes
    onSnapshot(
      query(collection(db, 'asha_workers', uid, 'voice_notes'), orderBy('createdAt', 'desc')),
      snap => setVoiceNotes(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })))
    );
    // Live medicine requests
    onSnapshot(
      query(collection(db, 'asha_workers', uid, 'medicine_requests'), orderBy('createdAt', 'desc')),
      snap => setMedicineRequests(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })))
    );
    // Performance summary
    const perfSnap = await getDoc(doc(db, 'asha_workers', uid, 'data', 'performance'));
    if (perfSnap.exists()) setPerformanceData(p => ({ ...p, ...perfSnap.data() }));
    setAshaDataLoading(false);
  };

  const handleAshaGoogleSignup = async () => {
    setAshaLoading(true); setAshaAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      const ashaRef = doc(db, 'asha_workers', u.uid);
      const existing = await getDoc(ashaRef);
      if (!existing.exists()) {
        setAshaView('signup'); setAshaAuthMode('google');
        setAshaEmail(u.email || ''); setAshaName(u.displayName || '');
        setAshaUser({ uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL });
      } else {
        setAshaUser({ uid: u.uid, ...existing.data() });
        await loadAshaData(u.uid);
        setAshaView('dashboard');
      }
    } catch (err: any) { setAshaAuthError(err.message || 'Google login failed'); }
    setAshaLoading(false);
  };

  const handleAshaEmailSignup = async () => {
    if (!ashaEmail || !ashaPassword || !ashaName) { setAshaAuthError('Please fill all fields'); return; }
    setAshaLoading(true); setAshaAuthError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, ashaEmail, ashaPassword);
      const u = result.user;
      const ashaData = { name: ashaName, email: ashaEmail, phone: ashaPhone, district: ashaDistrict, role: 'asha_worker', password_set: true, createdAt: new Date().toISOString() };
      await setDoc(doc(db, 'asha_workers', u.uid), ashaData);
      setAshaUser({ uid: u.uid, ...ashaData });
      await loadAshaData(u.uid);
      setAshaView('dashboard');
    } catch (err: any) { setAshaAuthError(err.message || 'Signup failed'); }
    setAshaLoading(false);
  };

  const handleAshaEmailLogin = async () => {
    if (!ashaEmail || !ashaPassword) { setAshaAuthError('Enter email and password'); return; }
    setAshaLoading(true); setAshaAuthError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, ashaEmail, ashaPassword);
      const u = result.user;
      const snap = await getDoc(doc(db, 'asha_workers', u.uid));
      if (snap.exists()) {
        setAshaUser({ uid: u.uid, ...snap.data() });
        await loadAshaData(u.uid);
        setAshaView('dashboard');
      } else { setAshaAuthError('No ASHA Worker account found. Please sign up.'); }
    } catch (err: any) { setAshaAuthError(err.message || 'Login failed'); }
    setAshaLoading(false);
  };

  const handleAshaGoogleLoginDirect = async () => {
    setAshaLoading(true); setAshaAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      const snap = await getDoc(doc(db, 'asha_workers', u.uid));
      if (snap.exists()) {
        setAshaUser({ uid: u.uid, ...snap.data() });
        await loadAshaData(u.uid);
        setAshaView('dashboard');
      } else { setAshaAuthError('No ASHA Worker account found. Please sign up first.'); }
    } catch (err: any) { setAshaAuthError(err.message || 'Login failed'); }
    setAshaLoading(false);
  };

  const saveAshaProfileAndGo = async () => {
    if (!ashaUser || !ashaName || !ashaPassword) { setAshaAuthError('Please fill name and set a password'); return; }
    setAshaLoading(true);
    try {
      const ashaData = { name: ashaName, email: ashaEmail, phone: ashaPhone, district: ashaDistrict, role: 'asha_worker', password_set: true, createdAt: new Date().toISOString() };
      await setDoc(doc(db, 'asha_workers', ashaUser.uid), ashaData);
      setAshaUser({ uid: ashaUser.uid, ...ashaData });
      await loadAshaData(ashaUser.uid);
      setAshaView('dashboard');
    } catch (err: any) { setAshaAuthError(err.message || 'Failed to save profile'); }
    setAshaLoading(false);
  };

  const markRequestVisited = async (firestoreId: string) => {
    if (!ashaUser) return;
    const updateData = { status: 'Visited', visitedAt: new Date().toISOString() };
    // Write locally first (offline-first)
    await offlineActions.writeRecord(ashaUser.uid, 'patient_requests_updates', {
      firestoreId, ...updateData
    });
    // Also write to Firestore if online
    try {
      await updateDoc(doc(db, 'asha_workers', ashaUser.uid, 'patient_requests', firestoreId), updateData);
    } catch (_) {} // will sync later via outbox
    const visited = patientRequests.filter(r => r.status === 'Visited').length + 1;
    await setDoc(doc(db, 'asha_workers', ashaUser.uid, 'data', 'performance'),
      { visitsCompleted: visited, updatedAt: new Date().toISOString() }, { merge: true });
  };

  const startVoiceRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported in this browser'); return; }
    const recognition = new SR();
    recognition.lang = 'hi-IN'; recognition.continuous = true; recognition.interimResults = true;
    recognition.onresult = (e: any) => {
      setVoiceTranscript(Array.from(e.results).map((r: any) => r[0].transcript).join(''));
    };
    recognition.start();
    (window as any)._ashaRecognition = recognition;
    setVoiceRecording(true);
  };

  const stopVoiceRecording = async () => {
    if ((window as any)._ashaRecognition) (window as any)._ashaRecognition.stop();
    setVoiceRecording(false);
    if (voiceTranscript && selectedPatientForVoice && ashaUser) {
      const patient = patientRequests.find(p => p.firestoreId === selectedPatientForVoice);
      const noteData = { patientId: selectedPatientForVoice, patientName: patient?.name || 'Unknown', transcript: voiceTranscript, createdAt: new Date().toISOString(), timestamp: new Date().toLocaleString('en-IN') };
      // Write locally first — works offline
      await offlineActions.writeRecord(ashaUser.uid, 'voice_notes', noteData);
      // Try Firestore if online
      try { await addDoc(collection(db, 'asha_workers', ashaUser.uid, 'voice_notes'), noteData); } catch (_) {}
      // Try backend if online
      try {
        await fetch('/api/asha/voice-note', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asha_uid: ashaUser.uid, patient_id: selectedPatientForVoice, patient_name: noteData.patientName, transcript: voiceTranscript }) });
      } catch (_) {}
      setVoiceTranscript('');
    }
  };

  const requestMedicineDelivery = async (patientId: string, patientName: string) => {
    if (!ashaUser) return;
    const medicines = ['Paracetamol', 'ORS Powder', 'Iron Tablets'];
    const reqData = { patientId, patientName, medicines, status: 'Requested', createdAt: new Date().toISOString(), time: new Date().toLocaleTimeString('en-IN') };
    // Write locally first — works offline
    await offlineActions.writeRecord(ashaUser.uid, 'medicine_requests', reqData);
    // Try Firestore if online
    try { await addDoc(collection(db, 'asha_workers', ashaUser.uid, 'medicine_requests'), reqData); } catch (_) {}
    try {
      await fetch('/api/asha/medicine-request', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asha_uid: ashaUser.uid, patient_id: patientId, patient_name: patientName, medicines }) });
    } catch (_) {}
    alert(`Medicine delivery requested for ${patientName}! ${offlineState.online ? '' : '(Saved offline — will sync when connected)'}`);
  };

  const sendEscalation = async (target: string = 'admin') => {
    if (!escalationMessage) return;
    const escData = { message: escalationMessage, target, sentAt: new Date().toISOString(), ashaName: ashaUser?.name };
    // Write locally first
    if (ashaUser) await offlineActions.writeRecord(ashaUser.uid, 'escalations', escData);
    // Try Firestore
    if (ashaUser) { try { await addDoc(collection(db, 'asha_workers', ashaUser.uid, 'escalations'), escData); } catch (_) {} }
    // Try backend
    try {
      await fetch('/api/asha/escalate', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asha_uid: ashaUser?.uid || 'unknown', asha_name: ashaUser?.name, message: escalationMessage, target }) });
    } catch (_) {}
    setEscalationSent(true);
    setTimeout(() => setEscalationSent(false), 3000);
    setEscalationMessage('');
  };

  // ── Pharmacy Auth & Data functions ────────────────────────────────
  const handlePharmacyGoogleAuth = async () => {
    setPharmacyLoading(true);
    setPharmacyAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      const ref = doc(db, 'pharmacy_owners', u.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setPharmacyUser({ uid: u.uid, email: u.email });
        setPharmacyProfile(snap.data());
        await loadPharmacyData(u.uid);
        setPharmacyAuthView('dashboard');
      } else {
        setPharmacyUser({ uid: u.uid, email: u.email });
        setPharmReg(p => ({ ...p, email: u.email || '', ownerName: u.displayName || '' }));
        setPharmacyAuthView('register');
      }
    } catch (e: any) { setPharmacyAuthError(e.message); }
    setPharmacyLoading(false);
  };

  const handlePharmacyEmailRegister = async () => {
    if (!pharmReg.shopName || !pharmReg.email || !pharmReg.password || !pharmReg.ownerName || !pharmReg.phone) {
      setPharmacyAuthError('Please fill all required fields'); return;
    }
    setPharmacyLoading(true);
    setPharmacyAuthError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, pharmReg.email, pharmReg.password);
      const u = result.user;
      const profileData = { shopName: pharmReg.shopName, ownerName: pharmReg.ownerName, email: pharmReg.email, phone: pharmReg.phone, address: pharmReg.address, district: pharmReg.district, state: pharmReg.state, gstin: pharmReg.gstin, licenseNo: pharmReg.licenseNo, registeredAt: new Date().toISOString(), verified: false };
      await setDoc(doc(db, 'pharmacy_owners', u.uid), profileData);
      // Seed initial stock
      const stockRef = collection(db, 'pharmacy_owners', u.uid, 'stock');
      const seedStock = [
        { name: 'Paracetamol', nameHi: 'पैरासिटामोल', qty: 50, unit: 'strips', threshold: 20, price: 25 },
        { name: 'ORS Powder', nameHi: 'ओआरएस पाउडर', qty: 30, unit: 'packets', threshold: 10, price: 15 },
        { name: 'Iron Tablets', nameHi: 'आयरन टैबलेट', qty: 40, unit: 'strips', threshold: 15, price: 50 },
      ];
      for (const s of seedStock) await addDoc(stockRef, s);
      setPharmacyUser({ uid: u.uid, email: u.email });
      setPharmacyProfile(profileData);
      await loadPharmacyData(u.uid);
      setPharmacyAuthView('dashboard');
    } catch (e: any) { setPharmacyAuthError(e.message); }
    setPharmacyLoading(false);
  };

  const handlePharmacyEmailLogin = async () => {
    if (!pharmLogin.email || !pharmLogin.password) { setPharmacyAuthError('Enter email and password'); return; }
    setPharmacyLoading(true);
    setPharmacyAuthError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, pharmLogin.email, pharmLogin.password);
      const u = result.user;
      const ref = doc(db, 'pharmacy_owners', u.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) { setPharmacyAuthError('No pharmacy account found. Please register.'); setPharmacyLoading(false); return; }
      setPharmacyUser({ uid: u.uid, email: u.email });
      setPharmacyProfile(snap.data());
      await loadPharmacyData(u.uid);
      setPharmacyAuthView('dashboard');
    } catch (e: any) { setPharmacyAuthError(e.message); }
    setPharmacyLoading(false);
  };

  const loadPharmacyData = async (uid: string) => {
    // Load stock
    const stockSnap = await getDocs(collection(db, 'pharmacy_owners', uid, 'stock'));
    setPharmacyStock(stockSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
    // Load orders
    const ordersSnap = await getDocs(query(collection(db, 'pharmacy_owners', uid, 'orders'), orderBy('createdAt', 'desc')));
    setPharmacyOrders(ordersSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
    // Load ratings
    const ratingsSnap = await getDocs(query(collection(db, 'pharmacy_owners', uid, 'ratings'), orderBy('createdAt', 'desc')));
    setPharmacyRatings(ratingsSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
    // Load alerts (ASHA requests)
    const alertsSnap = await getDocs(query(collection(db, 'pharmacy_owners', uid, 'alerts'), orderBy('createdAt', 'desc')));
    setPharmacyAlerts(alertsSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
    // Subscribe to live order updates
    onSnapshot(collection(db, 'pharmacy_owners', uid, 'orders'), snap => {
      setPharmacyOrders(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })).sort((a:any,b:any) => b.createdAt?.localeCompare?.(a.createdAt) || 0));
    });
    onSnapshot(collection(db, 'pharmacy_owners', uid, 'alerts'), snap => {
      setPharmacyAlerts(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
    });
  };

  // Pharmacy helpers
  const acceptOrder = async (orderId: string) => {
    if (!pharmacyUser) return;
    await updateDoc(doc(db, 'pharmacy_owners', pharmacyUser.uid, 'orders', orderId), { status: 'Accepted', updatedAt: new Date().toISOString() });
    setPharmacyOrders(prev => prev.map(o => o.firestoreId === orderId ? { ...o, status: 'Accepted' } : o));
  };
  const rejectOrder = async (orderId: string, reason: string) => {
    if (!pharmacyUser) return;
    await updateDoc(doc(db, 'pharmacy_owners', pharmacyUser.uid, 'orders', orderId), { status: 'Rejected', reason, updatedAt: new Date().toISOString() });
    setPharmacyOrders(prev => prev.map(o => o.firestoreId === orderId ? { ...o, status: 'Rejected', reason } : o));
    setShowRejectModal(null); setRejectReason('');
  };
  const assignDelivery = async (orderId: string, boy: string) => {
    if (!pharmacyUser) return;
    await updateDoc(doc(db, 'pharmacy_owners', pharmacyUser.uid, 'orders', orderId), { deliveryBoy: boy, status: 'Out for Delivery', updatedAt: new Date().toISOString() });
    setPharmacyOrders(prev => prev.map(o => o.firestoreId === orderId ? { ...o, deliveryBoy: boy, status: 'Out for Delivery' } : o));
    setShowAssignModal(null);
  };
  const updateStock = async (firestoreId: string, delta: number, currentQty: number) => {
    if (!pharmacyUser) return;
    const newQty = Math.max(0, currentQty + delta);
    await updateDoc(doc(db, 'pharmacy_owners', pharmacyUser.uid, 'stock', firestoreId), { qty: newQty });
    setPharmacyStock(prev => prev.map(s => s.firestoreId === firestoreId ? { ...s, qty: newQty } : s));
  };
  const addMedicineToStock = async () => {
    if (!pharmacyUser || !newMedicine.name || !newMedicine.qty || !newMedicine.price) return;
    setPharmacySaving(true);
    const data = { name: newMedicine.name, nameHi: newMedicine.nameHi || newMedicine.name, qty: parseInt(newMedicine.qty), unit: newMedicine.unit, threshold: parseInt(newMedicine.threshold) || 10, price: parseInt(newMedicine.price) };
    const ref = await addDoc(collection(db, 'pharmacy_owners', pharmacyUser.uid, 'stock'), data);
    setPharmacyStock(prev => [...prev, { firestoreId: ref.id, ...data }]);
    setNewMedicine({ name: '', nameHi: '', qty: '', unit: 'strips', threshold: '', price: '' });
    setShowAddMedicine(false);
    setPharmacySaving(false);
  };
  const deleteMedicine = async (firestoreId: string) => {
    if (!pharmacyUser) return;
    await deleteDoc(doc(db, 'pharmacy_owners', pharmacyUser.uid, 'stock', firestoreId));
    setPharmacyStock(prev => prev.filter(s => s.firestoreId !== firestoreId));
  };
  const recordPayment = async (orderId: string, mode: string) => {
    if (!pharmacyUser) return;
    await updateDoc(doc(db, 'pharmacy_owners', pharmacyUser.uid, 'orders', orderId), { paid: true, paymentMode: mode, paidAt: new Date().toISOString() });
    setPharmacyOrders(prev => prev.map(o => o.firestoreId === orderId ? { ...o, paid: true } : o));
    alert(`Payment recorded as ${mode}!`);
  };
  const generateInvoice = (firestoreId: string) => setShowInvoice(firestoreId);
  const markAlertRead = async (firestoreId: string) => {
    if (!pharmacyUser) return;
    await updateDoc(doc(db, 'pharmacy_owners', pharmacyUser.uid, 'alerts', firestoreId), { read: true });
    setPharmacyAlerts(prev => prev.map(a => a.firestoreId === firestoreId ? { ...a, read: true } : a));
  };

  // ── Delivery Auth & Data functions ───────────────────────────────
  const handleDeliveryGoogleAuth = async () => {
    setDeliveryLoading(true); setDeliveryAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      const ref = doc(db, 'delivery_partners', u.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setDeliveryUser({ uid: u.uid, email: u.email });
        setDeliveryProfile(snap.data());
        await loadDeliveryData(u.uid);
        setDeliveryAuthView('dashboard');
      } else {
        setDeliveryUser({ uid: u.uid, email: u.email });
        setDelivReg(p => ({ ...p, email: u.email || '', name: u.displayName || '' }));
        setDeliveryAuthView('register');
      }
    } catch (e: any) { setDeliveryAuthError(e.message); }
    setDeliveryLoading(false);
  };

  const handleDeliveryEmailRegister = async () => {
    if (!delivReg.name || !delivReg.email || !delivReg.password || !delivReg.phone) {
      setDeliveryAuthError('Please fill all required fields'); return;
    }
    setDeliveryLoading(true); setDeliveryAuthError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, delivReg.email, delivReg.password);
      const u = result.user;
      const profileData = { name: delivReg.name, email: delivReg.email, phone: delivReg.phone, vehicle: delivReg.vehicle, area: delivReg.area, online: false, registeredAt: new Date().toISOString(), totalEarnings: 0, totalDeliveries: 0 };
      await setDoc(doc(db, 'delivery_partners', u.uid), profileData);
      setDeliveryUser({ uid: u.uid, email: u.email });
      setDeliveryProfile(profileData);
      await loadDeliveryData(u.uid);
      setDeliveryAuthView('dashboard');
    } catch (e: any) { setDeliveryAuthError(e.message); }
    setDeliveryLoading(false);
  };

  const handleDeliveryEmailLogin = async () => {
    if (!delivLogin.email || !delivLogin.password) { setDeliveryAuthError('Enter email and password'); return; }
    setDeliveryLoading(true); setDeliveryAuthError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, delivLogin.email, delivLogin.password);
      const u = result.user;
      const ref = doc(db, 'delivery_partners', u.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) { setDeliveryAuthError('No delivery partner account found. Please register.'); setDeliveryLoading(false); return; }
      setDeliveryUser({ uid: u.uid, email: u.email });
      setDeliveryProfile(snap.data());
      await loadDeliveryData(u.uid);
      setDeliveryAuthView('dashboard');
    } catch (e: any) { setDeliveryAuthError(e.message); }
    setDeliveryLoading(false);
  };

  const loadDeliveryData = async (uid: string) => {
    // Load orders assigned to this delivery partner
    const ordersSnap = await getDocs(query(collection(db, 'delivery_partners', uid, 'orders'), orderBy('createdAt', 'desc')));
    setDeliveryOrders(ordersSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
    // Compute earnings from completed orders
    const completed = ordersSnap.docs.filter(d => d.data().status === 'Delivered');
    const today = new Date().toDateString();
    const todayEarnings = completed.filter(d => new Date(d.data().deliveredAt || '').toDateString() === today).reduce((s, d) => s + (d.data().earning || 40), 0);
    const weeklyEarnings = completed.reduce((s, d) => s + (d.data().earning || 40), 0);
    // Group by date for chart
    const byDate: Record<string, { amount: number; orders: number }> = {};
    completed.forEach(d => {
      const dateStr = new Date(d.data().deliveredAt || d.data().createdAt || '').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (!byDate[dateStr]) byDate[dateStr] = { amount: 0, orders: 0 };
      byDate[dateStr].amount += d.data().earning || 40;
      byDate[dateStr].orders += 1;
    });
    const paid = Object.entries(byDate).slice(-7).map(([date, v]) => ({ date, ...v }));
    setDeliveryEarningsData({ today: todayEarnings, weekly: weeklyEarnings, perDelivery: 40, paid });
    // Live updates
    onSnapshot(collection(db, 'delivery_partners', uid, 'orders'), snap => {
      setDeliveryOrders(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })).sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || '')));
    });
  };

  const toggleDeliveryOnline = async (val: boolean) => {
    setDeliveryOnline(val);
    if (deliveryUser) {
      await updateDoc(doc(db, 'delivery_partners', deliveryUser.uid), { online: val, lastSeen: new Date().toISOString() });
    }
  };

  // Delivery helpers
  const updateDeliveryStatus = async (firestoreId: string, status: string) => {
    if (!deliveryUser) return;
    const extra: any = { status, updatedAt: new Date().toISOString() };
    if (status === 'Picked Up') extra.pickedAt = new Date().toISOString();
    if (status === 'On the Way') extra.onWayAt = new Date().toISOString();
    await updateDoc(doc(db, 'delivery_partners', deliveryUser.uid, 'orders', firestoreId), extra);
    setDeliveryOrders(prev => prev.map(o => o.firestoreId === firestoreId ? { ...o, ...extra } : o));
  };

  const verifyDeliveryOtp = async (firestoreId: string, correctOtp: string) => {
    if (deliveryProofOtp === correctOtp) {
      await updateDeliveryStatus(firestoreId, 'Delivered');
      await updateDoc(doc(db, 'delivery_partners', deliveryUser.uid, 'orders', firestoreId), { deliveredAt: new Date().toISOString(), earning: 40 });
      // Update partner total stats
      const prof = deliveryProfile || {};
      await updateDoc(doc(db, 'delivery_partners', deliveryUser.uid), { totalDeliveries: (prof.totalDeliveries || 0) + 1, totalEarnings: (prof.totalEarnings || 0) + 40 });
      setDeliveryProfile((p: any) => ({ ...p, totalDeliveries: (p?.totalDeliveries || 0) + 1, totalEarnings: (p?.totalEarnings || 0) + 40 }));
      setVerifyingOtp(null); setDeliveryProofOtp('');
      alert('✅ Delivery confirmed! ₹40 earned.');
    } else { alert('❌ Wrong OTP, try again'); }
  };

  // ── Admin Auth & Data functions ────────────────────────────────────
  const checkAdminAuthorized = async (uid: string, email: string | null): Promise<boolean> => {
    // Check 1: hardcoded owner email
    if (email === 'mili.biswas26112003@gmail.com') return true;
    // Check 2: admin_users Firestore collection
    try {
      const adminSnap = await getDoc(doc(db, 'admin_users', uid));
      if (adminSnap.exists() && adminSnap.data().role === 'admin') return true;
      // Check 3: users collection role field
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists() && userSnap.data().role === 'admin') return true;
    } catch (_) {}
    return false;
  };

  const handleAdminGoogleLogin = async () => {
    setAdminLoading(true); setAdminAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      const authorized = await checkAdminAuthorized(u.uid, u.email);
      if (!authorized) {
        await signOut(auth);
        setAdminAuthError('Access denied. This Google account is not registered as an admin.');
        setAdminLoading(false); return;
      }
      setAdminUser({ uid: u.uid, email: u.email, name: u.displayName });
      await loadAdminData();
      setAdminAuthView('dashboard');
    } catch (e: any) { setAdminAuthError(e.message); }
    setAdminLoading(false);
  };

  const handleAdminEmailLogin = async () => {
    if (!adminLogin.email || !adminLogin.password) { setAdminAuthError('Enter email and password'); return; }
    setAdminLoading(true); setAdminAuthError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, adminLogin.email, adminLogin.password);
      const u = result.user;
      const authorized = await checkAdminAuthorized(u.uid, u.email);
      if (!authorized) {
        await signOut(auth);
        setAdminAuthError('Access denied. This account is not registered as an admin.');
        setAdminLoading(false); return;
      }
      setAdminUser({ uid: u.uid, email: u.email, name: u.displayName || 'Admin' });
      await loadAdminData();
      setAdminAuthView('dashboard');
    } catch (e: any) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setAdminAuthError('Wrong email or password. Please check and try again.');
      } else if (e.code === 'auth/too-many-requests') {
        setAdminAuthError('Too many failed attempts. Wait a few minutes or reset your password in Firebase Console.');
      } else if (e.code === 'auth/invalid-email') {
        setAdminAuthError('Invalid email format.');
      } else if (e.code === 'auth/network-request-failed') {
        setAdminAuthError('Network error. Check your internet connection.');
      } else {
        setAdminAuthError(e.message || 'Login failed. Please try again.');
      }
    }
    setAdminLoading(false);
  };

  const loadAdminData = async () => {
    setAdminDataLoaded(false);
    try {
      // ASHA workers
      const ashaSnap = await getDocs(collection(db, 'asha_workers'));
      setAdminAshaWorkers(ashaSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
      // Pharmacies
      const pharmSnap = await getDocs(collection(db, 'pharmacy_owners'));
      setAdminPharmacies(pharmSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
      // Delivery partners
      const delivSnap = await getDocs(collection(db, 'delivery_partners'));
      setAdminDeliveryPartners(delivSnap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
      // Escalations from server API
      try {
        const esc = await fetch('/api/asha/escalations');
        if (esc.ok) { const data = await esc.json(); setAdminEscalations(data); }
      } catch (_) {}
    } catch (e) { console.error('Admin load error:', e); }
    setAdminDataLoaded(true);
  };

  const sendAdminBroadcast = async () => {
    if (!adminBroadcastMsg.trim()) return;
    try {
      await addDoc(collection(db, 'broadcasts'), {
        message: adminBroadcastMsg, target: adminBroadcastTarget,
        sentBy: adminUser?.email, sentAt: new Date().toISOString()
      });
      setAdminBroadcastSent(true);
      setTimeout(() => setAdminBroadcastSent(false), 3000);
      setAdminBroadcastMsg('');
    } catch (e) { console.error(e); }
  };

  const updateFacility = async (id: string, updates: any) => {
    setAdminFacilities(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    setEditingFacility(null);
    // Persist to Firestore
    try { await setDoc(doc(db, 'facilities', id), updates, { merge: true }); } catch (_) {}
  };

  const approveDeliveryPayout = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'delivery_partners', uid), { payoutApproved: true, payoutDate: new Date().toISOString() });
      setAdminDeliveryPartners(prev => prev.map(d => d.firestoreId === uid ? { ...d, payoutApproved: true } : d));
      alert('Payout approved!');
    } catch (e) { console.error(e); }
  };

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) { alert('No data to export'); return; }
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Patient → ASHA Request ────────────────────────────────────────
  const fetchAvailableAshaWorkers = async () => {
    try {
      const snap = await getDocs(collection(db, 'asha_workers'));
      const workers = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      setAvailableAshaWorkers(workers);
      if (workers.length > 0) setSelectedAshaWorkerUid(workers[0].uid);
    } catch (e) { console.error('Fetch ASHA workers error:', e); }
  };

  const sendAshaRequest = async () => {
    if (!ashaRequestIssue.trim()) return;
    setAshaRequestSending(true);
    try {
      const patientName = profile?.fullName || user?.displayName || 'Patient';
      const patientAddr = profile?.village ? `${profile.village}, ${profile.district || ''}` : 'Location not specified';
      const requestData = {
        name: patientName,
        nameHi: patientName,
        issue: ashaRequestIssue,
        issueHi: ashaRequestIssue,
        source: ashaRequestSource,
        address: patientAddr,
        location: { lat: 0, lng: 0 },
        status: 'Pending',
        urgent: ashaRequestUrgent,
        patientUid: user?.uid || 'anonymous',
        patientPhone: profile?.mobile || '',
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };

      // If a specific ASHA worker is selected, write to their collection
      if (selectedAshaWorkerUid) {
        await addDoc(
          collection(db, 'asha_workers', selectedAshaWorkerUid, 'patient_requests'),
          requestData
        );
      } else {
        // Broadcast to all registered ASHA workers
        const snap = await getDocs(collection(db, 'asha_workers'));
        for (const d of snap.docs) {
          await addDoc(collection(db, 'asha_workers', d.id, 'patient_requests'), requestData);
        }
      }

      setAshaRequestSent(true);
      setAshaRequestIssue('');
      setAshaRequestUrgent(false);
      setTimeout(() => { setAshaRequestSent(false); setShowAshaRequestForm(false); }, 3000);
    } catch (e) {
      console.error('Send ASHA request error:', e);
      alert('Failed to send request. Please try again.');
    }
    setAshaRequestSending(false);
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Login Error:", error);
    }
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved
        }
      });
    }
  };

  const handlePhoneLogin = async () => {
    if (!phoneNumber) return;
    setIsLoggingIn(true);
    setLoginError(null);
    setupRecaptcha();
    const appVerifier = (window as any).recaptchaVerifier;
    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setShowOtpInput(true);
    } catch (error: any) {
      console.error("Phone Login Error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        setLoginError("Phone authentication is not enabled in the Firebase Console. Please enable it in Authentication > Sign-in method.");
      } else {
        setLoginError(error.message || "An error occurred during login.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || !confirmationResult) return;
    setIsLoggingIn(true);
    try {
      await confirmationResult.confirm(otp);
      setShowOtpInput(false);
      setActivePopup(null);
    } catch (error) {
      console.error("OTP Verification Error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActivePopup(null);
    setSelectedRole(null);
  };

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const saveProfile = async (data: any) => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const profileData = {
        ...data,
        uid: user.uid,
        updatedAt: serverTimestamp(),
        createdAt: profile?.createdAt || serverTimestamp()
      };
      await setDoc(doc(db, 'users', user.uid), profileData, { merge: true });
      setProfile(profileData);
      setShowProfileForm(false);
      setActivePopup(null);
    } catch (error) {
      console.error("Save Profile Error:", error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Voice Input Logic
  const [isListening, setIsListening] = useState(false);
  const startVoiceInput = (onResult: (text: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Voice recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Default to Hindi for rural users
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please enable it in your browser settings. / माइक्रोफ़ोन की अनुमति नहीं है। कृपया इसे अपने ब्राउज़र सेटिंग्स में सक्षम करें।");
      } else if (event.error === 'network') {
        alert("Network error. Please check your internet connection. / नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।");
      }
      setIsListening(false);
    };
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };
    recognition.start();
  };

  // Notification Logic
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log("Notification permission granted.");
      }
    }
  };

  const scheduleNotification = (title: string, body: string, delayMs: number) => {
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/logo.png' });
      }
    }, delayMs);
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Matri Seva State
  const [matriTab, setMatriTab] = useState<'dashboard' | 'vaccination' | 'diet' | 'shop' | 'period' | 'postpartum' | 'mentalHealth' | 'sexualHealth' | 'pregnancyKit'>('dashboard');
  const [childDob, setChildDob] = useState('');
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [postpartumSymptoms, setPostpartumSymptoms] = useState<string[]>([]);
  const [postpartumNote, setPostpartumNote] = useState('');
  const [selectedTrimester, setSelectedTrimester] = useState(1);
  const [doneVaccines, setDoneVaccines] = useState<string[]>([]);
  const [babyCart, setBabyCart] = useState<any[]>([]);
  const [matriExpandedVaccine, setMatriExpandedVaccine] = useState<string | null>(null);
  const [completedTests, setCompletedTests] = useState<string[]>([]);
  const [testDates, setTestDates] = useState<Record<string, string>>({});
  const [postpartumPrediction, setPostpartumPrediction] = useState<string | null>(null);
  const [isAnalyzingPostpartum, setIsAnalyzingPostpartum] = useState(false);

  const [pregnancyStage, setPregnancyStage] = useState('');

  useEffect(() => {
    if (user && (lastPeriodDate || childDob || pregnancyStage)) {
      const saveMaternalData = async () => {
        try {
          const matriRef = doc(db, 'users', user.uid, 'data', 'maternalCare');
          await setDoc(matriRef, {
            pregnancyData: {
              lastPeriodDate,
              stage: pregnancyStage,
              updatedAt: serverTimestamp()
            },
            babyData: {
              dob: childDob,
              updatedAt: serverTimestamp()
            },
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          console.error("Error saving maternal data:", error);
        }
      };
      
      const timeoutId = setTimeout(saveMaternalData, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, lastPeriodDate, childDob, pregnancyStage]);

  const vaccineList = [
    { id: 'bcg', name: 'BCG', months: 0, descEn: 'Prevents Tuberculosis', descHi: 'तपेदिक (टीबी) से बचाता है' },
    { id: 'opv0', name: 'OPV 0', months: 0, descEn: 'Oral Polio Vaccine', descHi: 'ओरल पोलियो वैक्सीन' },
    { id: 'hepb0', name: 'Hep B 0', months: 0, descEn: 'Hepatitis B Vaccine', descHi: 'हेपेटाइटिस बी वैक्सीन' },
    { id: 'opv1', name: 'OPV 1', months: 1.5, descEn: 'Oral Polio Vaccine 1', descHi: 'ओरल पोलियो वैक्सीन 1' },
    { id: 'penta1', name: 'Pentavalent 1', months: 1.5, descEn: '5-in-1 vaccine', descHi: '5-इन-1 वैक्सीन' },
    { id: 'rv1', name: 'Rotavirus 1', months: 1.5, descEn: 'Prevents Diarrhea', descHi: 'दस्त से बचाता है' },
    { id: 'ipv1', name: 'IPV 1', months: 1.5, descEn: 'Inactivated Polio', descHi: 'निष्क्रिय पोलियो' },
    { id: 'pcv1', name: 'PCV 1', months: 1.5, descEn: 'Pneumococcal Vaccine', descHi: 'न्यूमोकोकल वैक्सीन' },
    { id: 'opv2', name: 'OPV 2', months: 2.5, descEn: 'Oral Polio Vaccine 2', descHi: 'ओरल पोलियो वैक्सीन 2' },
    { id: 'penta2', name: 'Pentavalent 2', months: 2.5, descEn: '5-in-1 vaccine', descHi: '5-इन-1 वैक्सीन' },
    { id: 'rv2', name: 'Rotavirus 2', months: 2.5, descEn: 'Prevents Diarrhea', descHi: 'दस्त से बचाता है' },
    { id: 'opv3', name: 'OPV 3', months: 3.5, descEn: 'Oral Polio Vaccine 3', descHi: 'ओरल पोलियो वैक्सीन 3' },
    { id: 'penta3', name: 'Pentavalent 3', months: 3.5, descEn: '5-in-1 vaccine', descHi: '5-इन-1 वैक्सीन' },
    { id: 'rv3', name: 'Rotavirus 3', months: 3.5, descEn: 'Prevents Diarrhea', descHi: 'दस्त से बचाता है' },
    { id: 'ipv2', name: 'IPV 2', months: 3.5, descEn: 'Inactivated Polio', descHi: 'निष्क्रिय पोलियो' },
    { id: 'pcv2', name: 'PCV 2', months: 3.5, descEn: 'Pneumococcal Vaccine', descHi: 'न्यूमोकोकल वैक्सीन' },
    { id: 'mr1', name: 'MR 1', months: 9, descEn: 'Measles & Rubella', descHi: 'खसरा और रूबेला' },
    { id: 'vitA1', name: 'Vit A 1', months: 9, descEn: 'Vitamin A Supplement', descHi: 'विटामिन ए सप्लीमेंट' },
    { id: 'pcvB', name: 'PCV Booster', months: 9, descEn: 'Pneumococcal Booster', descHi: 'न्यूमोकोकल बूस्टर' },
    { id: 'mr2', name: 'MR 2', months: 16, descEn: 'Measles & Rubella 2', descHi: 'खसरा और रूबेला 2' },
    { id: 'dptB1', name: 'DPT Booster 1', months: 16, descEn: 'Diphtheria, Pertussis, Tetanus', descHi: 'डिप्थीरिया, काली खांसी, टिटनेस' },
    { id: 'opvB', name: 'OPV Booster', months: 16, descEn: 'Oral Polio Booster', descHi: 'ओरल पोलियो बूस्टर' },
  ];

  const babyProducts = [
    { id: 101, name: 'Premium Diapers', nameHi: 'प्रीमियम डायपर', price: 450, category: 'Hygiene', available: true, discount: 5, desc: 'Soft and absorbent diapers for babies.' },
    { id: 102, name: 'Baby Formula (400g)', nameHi: 'शिशु आहार (400 ग्राम)', price: 380, category: 'Nutrition', available: true, discount: 0, desc: 'Nutritional milk substitute for infants.' },
    { id: 103, name: 'Feeding Bottle', nameHi: 'दूध पिलाने की बोतल', price: 120, category: 'Accessories', available: true, discount: 10, desc: 'BPA-free feeding bottle.' },
    { id: 104, name: 'Baby Clothes Set', nameHi: 'शिशु के कपड़ों का सेट', price: 550, category: 'Clothing', available: true, discount: 15, desc: 'Pure cotton clothes for newborns.' },
    { id: 105, name: 'Baby Wipes', nameHi: 'बेबी वाइप्स', price: 95, category: 'Hygiene', available: true, discount: 0, desc: 'Gentle cleaning wipes.' },
    { id: 106, name: 'Digital Thermometer', nameHi: 'डिजिटल थर्मामीटर', price: 250, category: 'Health', available: true, discount: 5, desc: 'Accurate temperature reading.' },
    { id: 107, name: 'Mother Care Lotion', nameHi: 'मदर केयर लोशन', price: 320, category: 'Mother Care', available: true, discount: 10, desc: 'Skin care for new mothers.' },
  ];

  const trimesterPlans = [
    {
      trimester: 1,
      name: 'First Trimester (0–12 Weeks)',
      nameHi: 'पहली तिमाही (0-12 सप्ताह)',
      diet: [
        { en: 'Folic Acid Rich Foods', hi: 'फोलिक एसिड युक्त भोजन' },
        { en: 'Spinach & Greens', hi: 'पालक और हरी सब्जियां' },
        { en: 'Citrus Fruits', hi: 'खट्टे फल' },
        { en: 'Whole Grains', hi: 'साबुत अनाज' }
      ],
      tests: [
        { id: 't1_bg', name: 'Blood Group & Rh Factor', nameHi: 'रक्त समूह और आरएच कारक', desc: 'Determines your blood type and Rh compatibility.', descHi: 'आपके रक्त के प्रकार और आरएच अनुकूलता को निर्धारित करता है।' },
        { id: 't1_cbc', name: 'Complete Blood Count (CBC)', nameHi: 'पूर्ण रक्त गणना (सीबीसी)', desc: 'Checks for anemia and infections.', descHi: 'एनीमिया और संक्रमण की जांच करता है।' },
        { id: 't1_sugar', name: 'Blood Sugar Test', nameHi: 'ब्लड शुगर टेस्ट', desc: 'Screens for gestational diabetes.', descHi: 'गर्भकालीन मधुमेह की जांच करता है।' },
        { id: 't1_tsh', name: 'Thyroid (TSH)', nameHi: 'थायराइड (टीएसएच)', desc: 'Checks thyroid function.', descHi: 'थायराइड के कार्य की जांच करता है।' },
        { id: 't1_hiv', name: 'HIV, Hepatitis B, VDRL', nameHi: 'एचआईवी, हेपेटाइटिस बी, वीडीआरएल', desc: 'Screens for infectious diseases.', descHi: 'संक्रामक रोगों की जांच करता है।' },
        { id: 't1_urine', name: 'Urine Test', nameHi: 'मूत्र परीक्षण', desc: 'Checks for UTI and protein.', descHi: 'यूटीआई और प्रोटीन की जांच करता है।' },
        { id: 't1_usg', name: 'Early Ultrasound Scan', nameHi: 'प्रारंभिक अल्ट्रासाउंड स्कैन', desc: 'Confirms pregnancy and checks heartbeat.', descHi: 'गर्भावस्था की पुष्टि करता है और दिल की धड़कन की जांच करता है।' }
      ],
      symptoms: [
        { en: 'Nausea & vomiting (Morning sickness)', hi: 'जी मिचलाना और उल्टी (मॉर्निंग सिकनेस)' },
        { en: 'Fatigue', hi: 'थकान' },
        { en: 'Breast tenderness', hi: 'स्तनों में कोमलता' },
        { en: 'Frequent urination', hi: 'बार-बार पेशाब आना' },
        { en: 'Mild cramping', hi: 'हल्की ऐंठन' }
      ],
      adviceEn: 'Focus on folic acid and stay hydrated. Small frequent meals help with nausea.',
      adviceHi: 'फोलिक एसिड पर ध्यान दें और हाइड्रेटेड रहें। छोटे-छोटे अंतराल पर भोजन करने से मतली में मदद मिलती है।'
    },
    {
      trimester: 2,
      name: 'Second Trimester (13–27 Weeks)',
      nameHi: 'दूसरी तिमाही (13-27 सप्ताह)',
      diet: [
        { en: 'Iron & Calcium Rich', hi: 'आयरन और कैल्शियम युक्त' },
        { en: 'Milk & Dairy', hi: 'दूध और डेयरी उत्पाद' },
        { en: 'Lean Proteins', hi: 'लीन प्रोटीन' },
        { en: 'Fruits & Veggies', hi: 'फल और सब्जियां' }
      ],
      tests: [
        { id: 't2_anomaly', name: 'Anomaly Scan (18–22 weeks)', nameHi: 'विसंगति स्कैन (18-22 सप्ताह)', desc: 'Detailed scan of baby\'s organs.', descHi: 'बच्चे के अंगों का विस्तृत स्कैन।' },
        { id: 't2_gtt', name: 'Glucose Tolerance Test (GTT)', nameHi: 'ग्लूकोज टॉलरेंस टेस्ट (जीटीटी)', desc: 'Confirms gestational diabetes.', descHi: 'गर्भकालीन मधुमेह की पुष्टि करता है।' },
        { id: 't2_hb', name: 'Hemoglobin Recheck', nameHi: 'हीमोग्लोबिन दोबारा जांच', desc: 'Ensures iron levels are sufficient.', descHi: 'सुनिश्चित करता है कि आयरन का स्तर पर्याप्त है।' },
        { id: 't2_bp', name: 'Blood Pressure Monitoring', nameHi: 'रक्तचाप की निगरानी', desc: 'Checks for preeclampsia.', descHi: 'प्री-एक्लेम्पसिया की जांच करता है।' }
      ],
      symptoms: [
        { en: 'Reduced nausea', hi: 'जी मिचलाना कम होना' },
        { en: 'Increased appetite', hi: 'भूख में वृद्धि' },
        { en: 'Back pain', hi: 'पीठ दर्द' },
        { en: 'Leg cramps', hi: 'पैरों में ऐंठन' },
        { en: 'Visible baby movement', hi: 'बच्चे की हलचल महसूस होना' }
      ],
      adviceEn: 'Increase calorie intake slightly. Focus on iron for baby growth.',
      adviceHi: 'कैलोरी की मात्रा थोड़ी बढ़ाएं। बच्चे के विकास के लिए आयरन पर ध्यान दें।'
    },
    {
      trimester: 3,
      name: 'Third Trimester (28–40 Weeks)',
      nameHi: 'तीसरी तिमाही (28-40 सप्ताह)',
      diet: [
        { en: 'High Fiber Foods', hi: 'उच्च फाइबर वाला भोजन' },
        { en: 'Small Frequent Meals', hi: 'थोड़ा-थोड़ा बार-बार भोजन' },
        { en: 'Hydration (Water/Juice)', hi: 'हाइड्रेशन (पानी/जूस)' },
        { en: 'Omega-3 (Walnuts/Seeds)', hi: 'ओमेगा-3 (अखरोट/बीज)' }
      ],
      tests: [
        { id: 't3_growth', name: 'Growth Scan', nameHi: 'ग्रोथ स्कैन', desc: 'Checks baby\'s growth and position.', descHi: 'बच्चे की वृद्धि और स्थिति की जांच करता है।' },
        { id: 't3_nst', name: 'Non-Stress Test (NST)', nameHi: 'नॉन-स्ट्रेस टेस्ट (एनएसटी)', desc: 'Monitors baby\'s heart rate.', descHi: 'बच्चे के हृदय गति की निगरानी करता है।' },
        { id: 't3_hb_bp', name: 'Hemoglobin & BP Monitoring', nameHi: 'हीमोग्लोबिन और बीपी निगरानी', desc: 'Regular checks before delivery.', descHi: 'प्रसव से पहले नियमित जांच।' },
        { id: 't3_gbs', name: 'Group B Streptococcus', nameHi: 'ग्रुप बी स्ट्रेप्टोकोकस', desc: 'Checks for bacterial infection.', descHi: 'बैक्टीरिया के संक्रमण की जांच करता है।' }
      ],
      symptoms: [
        { en: 'Swelling in feet', hi: 'पैरों में सूजन' },
        { en: 'Shortness of breath', hi: 'सांस की तकलीफ' },
        { en: 'Braxton Hicks contractions', hi: 'ब्रेक्सटन हिक्स संकुचन' },
        { en: 'Pelvic pressure', hi: 'पेल्विक दबाव' },
        { en: 'Sleep disturbance', hi: 'नींद में खलल' }
      ],
      adviceEn: 'Monitor baby movements closely. Prepare for birth and stay relaxed.',
      adviceHi: 'बच्चे की हलचल पर बारीकी से नज़र रखें। जन्म की तैयारी करें और तनावमुक्त रहें।'
    }
  ];

  const getPregnancyInfo = (lmp: string) => {
    if (!lmp) return null;
    const lmpDate = new Date(lmp);
    const today = new Date();
    const diffTime = today.getTime() - lmpDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    
    let trimester = 1;
    if (weeks >= 13 && weeks <= 27) trimester = 2;
    else if (weeks >= 28) trimester = 3;
    
    const edd = new Date(lmpDate);
    edd.setDate(edd.getDate() + 280); // 40 weeks
    
    return { weeks, trimester, edd };
  };

  const getNextVisitSchedule = (weeks: number) => {
    if (weeks < 28) return { en: 'Monthly (Every 4 weeks)', hi: 'मासिक (हर 4 सप्ताह)' };
    if (weeks < 36) return { en: 'Bi-weekly (Every 2 weeks)', hi: 'द्वि-साप्ताहिक (हर 2 सप्ताह)' };
    return { en: 'Weekly (Every week)', hi: 'साप्ताहिक (हर सप्ताह)' };
  };

  const postpartumSymptomChips = [
    { en: 'Fatigue', hi: 'थकान' },
    { en: 'Fever', hi: 'बुखार' },
    { en: 'Severe Pain', hi: 'तेज़ दर्द' },
    { en: 'Mood Swings', hi: 'मूड में बदलाव' },
    { en: 'Excessive Bleeding', hi: 'अत्यधिक रक्तस्राव' },
    { en: 'Breast Pain', hi: 'स्तन में दर्द' },
    { en: 'Dizziness', hi: 'चक्कर आना' }
  ];

  const calculateVaccineDate = (dob: string, months: number) => {
    if (!dob) return null;
    const date = new Date(dob);
    date.setMonth(date.getMonth() + months);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getMatriVaccineStatus = (id: string, dob: string, months: number) => {
    if (doneVaccines.includes(id)) return 'Done';
    if (!dob) return 'Upcoming';
    const dueDate = new Date(dob);
    dueDate.setMonth(dueDate.getMonth() + months);
    const today = new Date();
    return today >= dueDate ? 'Due' : 'Upcoming';
  };

  const predictNextPeriod = (lastDate: string) => {
    if (!lastDate) return null;
    const date = new Date(lastDate);
    date.setDate(date.getDate() + 28); // Standard 28 day cycle
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Fetch initial organisations
    fetch('/api/organisations')
      .then(res => res.json())
      .then(data => setOrganisations(data))
      .catch(err => console.error("Failed to fetch organisations:", err));

    // Socket listener for real-time updates
    const socket = io();
    socket.on("organisation_added", (newOrg) => {
      setOrganisations(prev => [newOrg, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const sendOtp = () => {
    if (formData.mobile.length === 10) {
      setOtpSent(true);
      // Simulate OTP
      console.log("OTP Sent to", formData.mobile);
    }
  };

  const verifyDemoOtp = () => {
    if (formData.otp === '1234') {
      setOtpVerified(true);
    } else {
      alert("Invalid OTP. Use 1234 for demo.");
    }
  };

  const handleSwasthyaContinue = () => {
    if (!formData.fullName || !formData.age || !formData.gender || !formData.mobile) {
      alert("Please fill all required fields / कृपया सभी आवश्यक फ़ील्ड भरें।");
      return;
    }
    
    if (formData.gender === 'Female') {
      setActivePopup('choice');
    } else {
      setActivePopup('generalHealth');
    }
  };

  const handleCheckout = () => {
    if (babyCart.length === 0) return;
    alert(`Order Placed Successfully! Total: ₹${babyCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)} / ऑर्डर सफलतापूर्वक दिया गया!`);
    setBabyCart([]);
  };

  const analyzePostpartumSymptoms = async () => {
    if (postpartumSymptoms.length === 0 && !postpartumNote) return;
    setIsAnalyzingPostpartum(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `
        User is a mother who delivered on ${childDob || 'Unknown date'}.
        Current Date: ${new Date().toLocaleDateString()}
        Symptoms Selected: ${postpartumSymptoms.join(', ')}
        Additional Notes: ${postpartumNote}
        
        Analyze what might be happening to the mother based on the time since delivery and her symptoms.
        Provide a supportive explanation and advice on how to mend it (recovery tips).
        Provide the response in both English and Hindi.
        Always include a suggestion to consult a doctor if symptoms persist.
        Format: English text / Hindi text
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const predictionText = response.text || "Unable to analyze at the moment. Please consult a doctor. / इस समय विश्लेषण करने में असमर्थ। कृपया डॉक्टर से परामर्श लें।";
      setPostpartumPrediction(predictionText);

      // Save to Firestore
      if (user) {
        const chatRef = doc(db, `users/${user.uid}/data/chatHistory`);
        const chatSnap = await getDoc(chatRef);
        const existingMessages = chatSnap.exists() ? chatSnap.data().messages || [] : [];
        
        await setDoc(chatRef, {
          uid: user.uid,
          messages: [
            ...existingMessages,
            { role: 'user', text: postpartumNote || postpartumSymptoms.join(', '), timestamp: new Date().toISOString() },
            { role: 'model', text: predictionText, timestamp: new Date().toISOString() }
          ],
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Also update maternal care data
        const matriRef = doc(db, `users/${user.uid}/data/maternalCare`);
        await setDoc(matriRef, {
          uid: user.uid,
          babyData: { dob: childDob },
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error("Postpartum AI Analysis Error:", error);
      setPostpartumPrediction("Error in analysis. Please consult a doctor. / विश्लेषण में त्रुटि। कृपया डॉक्टर से परामर्श लें।");
    } finally {
      setIsAnalyzingPostpartum(false);
    }
  };

  const [symptoms, setSymptoms] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [completedVaccines, setCompletedVaccines] = useState<string[]>([]);
  const [expandedVaccine, setExpandedVaccine] = useState<string | null>(null);

  const symptomChips = [
    { en: 'Fever', hi: 'बुखार' },
    { en: 'Cough', hi: 'खांसी' },
    { en: 'Headache', hi: 'सिरदर्द' },
    { en: 'Body Pain', hi: 'बदन दर्द' },
    { en: 'Stomach Pain', hi: 'पेट दर्द' }
  ];

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);
  const [nearbyPharmacies, setNearbyPharmacies] = useState<any[]>([]);
  const [nearbyClinics, setNearbyClinics] = useState<any[]>([]);
  const [hospitalsLimit, setHospitalsLimit] = useState(5);
  const [pharmaciesLimit, setPharmaciesLimit] = useState(5);
  const [clinicsLimit, setClinicsLimit] = useState(5);
  const [isFetchingNearby, setIsFetchingNearby] = useState(false);
  const [searchRadius, setSearchRadius] = useState(3000);
  const [isLocating, setIsLocating] = useState(false);

  const hospitals = [
    { 
      name: 'District General Hospital', 
      nameHi: 'जिला सामान्य अस्पताल',
      dist: '2.4 km', 
      doc: 'Available', 
      docCount: 15,
      beds: 45, 
      ambulance: '24/7 Available',
      specializations: [
        {
          titleEn: 'Pediatrician (Child Specialist)',
          titleHi: 'बाल रोग विशेषज्ञ',
          doctors: [
            { name: 'Dr. Sharma', nameHi: 'डॉ. शर्मा', status: 'Available' },
            { name: 'Dr. Verma', nameHi: 'डॉ. वर्मा', status: 'On Call' }
          ]
        },
        {
          titleEn: 'Gynecologist',
          titleHi: 'स्त्री रोग विशेषज्ञ',
          doctors: [
            { name: 'Dr. Kaur', nameHi: 'डॉ. कौर', status: 'Available' },
            { name: 'Dr. Mehta', nameHi: 'डॉ. मेहता', status: 'Available' }
          ]
        },
        {
          titleEn: 'General Physician',
          titleHi: 'सामान्य चिकित्सक',
          doctors: [
            { name: 'Dr. Singh', nameHi: 'डॉ. सिंह', status: 'Available' },
            { name: 'Dr. Das', nameHi: 'डॉ. दास', status: 'Busy' }
          ]
        },
        {
          titleEn: 'Orthopedic (Bone Specialist)',
          titleHi: 'हड्डी रोग विशेषज्ञ',
          doctors: [
            { name: 'Dr. Reddy', nameHi: 'डॉ. रेड्डी', status: 'Available' }
          ]
        },
        {
          titleEn: 'Sexual Health Specialist',
          titleHi: 'यौन स्वास्थ्य विशेषज्ञ',
          doctors: [
            { name: 'Dr. Khan', nameHi: 'डॉ. खान', status: 'Available' }
          ]
        }
      ]
    },
    { 
      name: 'Rural Health Centre', 
      nameHi: 'ग्रामीण स्वास्थ्य केंद्र',
      dist: '5.1 km', 
      doc: 'Limited', 
      docCount: 5,
      beds: 10, 
      ambulance: 'On Call',
      specializations: [
        {
          titleEn: 'General Physician',
          titleHi: 'सामान्य चिकित्सक',
          doctors: [
            { name: 'Dr. Gupta', nameHi: 'डॉ. गुप्ता', status: 'Available' }
          ]
        },
        {
          titleEn: 'Pediatrician',
          titleHi: 'बाल रोग विशेषज्ञ',
          doctors: [
            { name: 'Dr. Mishra', nameHi: 'डॉ. मिश्रा', status: 'Available' }
          ]
        }
      ]
    }
  ];

  const PatientDashboard = () => {
    const roles = [
      { id: 'admin', title: 'Admin', icon: ShieldCheck, color: 'bg-red-100', iconColor: 'text-red-600' },
      { id: 'asha_worker', title: 'ASHA Worker', icon: Stethoscope, color: 'bg-green-100', iconColor: 'text-green-600' },
      { id: 'delivery', title: 'Delivery Partner', icon: Truck, color: 'bg-blue-100', iconColor: 'text-blue-600' },
      { id: 'patient', title: 'Patient / User', icon: HeartPulse, color: 'bg-purple-100', iconColor: 'text-purple-600' },
      { id: 'pharmacy', title: 'Pharmacy Owner', icon: Store, color: 'bg-orange-100', iconColor: 'text-orange-600' },
    ];

    // ── ASHA Worker full flow ──────────────────────────────────────────
    if (selectedRole === 'asha_worker') {
      // Dashboard
      if (ashaView === 'dashboard' && ashaUser) {
        const isOffline = !offlineState.online;
        const hasPending = offlineState.pendingCount > 0;
        return (
          <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 p-4 md:p-8">

            {/* Offline / Sync status banner */}
            <AnimatePresence>
              {(isOffline || offlineState.status !== 'idle' || hasPending) && (
                <motion.div
                  initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  className={`rounded-2xl p-3 mb-4 flex items-center justify-between gap-3 ${isOffline ? 'bg-orange-100 border border-orange-300' : offlineState.status === 'error' ? 'bg-red-50 border border-red-200' : offlineState.status === 'done' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOffline ? 'bg-orange-500' : offlineState.status === 'error' ? 'bg-red-500' : offlineState.status === 'done' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}/>
                    <p className={`text-xs font-black truncate ${isOffline ? 'text-orange-700' : offlineState.status === 'error' ? 'text-red-700' : offlineState.status === 'done' ? 'text-green-700' : 'text-blue-700'}`}>
                      {isOffline ? `📵 Offline — ${hasPending ? `${offlineState.pendingCount} records queued` : 'All data saved locally'}` : offlineState.statusMessage || (hasPending ? `${offlineState.pendingCount} records pending upload` : '')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasPending && offlineState.online && (
                      <button onClick={offlineActions.flushToServer} className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-xl font-black hover:bg-blue-600 transition-all">Upload Now</button>
                    )}
                    <button onClick={offlineActions.startBluetoothScan}
                      className={`text-xs px-3 py-1.5 rounded-xl font-black transition-all ${offlineState.status === 'scanning' ? 'bg-yellow-400 text-yellow-900 animate-pulse' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}>
                      {offlineState.status === 'scanning' ? '🔵 Scanning...' : '🔵 Mesh Sync'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mesh peers panel */}
            {offlineState.peers.length > 0 && (
              <div className="bg-white rounded-2xl p-4 mb-4 border border-yellow-100 shadow-sm">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block"/>
                  {offlineState.peers.length} Nearby Device{offlineState.peers.length > 1 ? 's' : ''} in Mesh Network
                </p>
                <div className="flex flex-wrap gap-2">
                  {offlineState.peers.map(peer => (
                    <div key={peer.deviceId} className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <div className="w-2 h-2 bg-green-500 rounded-full"/><span className="text-xs font-bold text-gray-700">{peer.name || 'ASHA Worker'}</span><span className="text-xs text-gray-400">{peer.deviceId.slice(0, 6)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Device info strip */}
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-400 font-bold flex-wrap">
              <span>Device: {offlineState.deviceId ? offlineState.deviceId.slice(0, 12) + '...' : '...'}</span>
              {offlineState.lastSyncAt && <span>• Synced: {new Date(offlineState.lastSyncAt).toLocaleTimeString('en-IN')}</span>}
              <span className={`ml-auto px-2 py-0.5 rounded-full font-black ${offlineState.online ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {offlineState.online ? '🟢 Online' : '🟠 Offline'}
              </span>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg">
                  <Stethoscope size={28} className="text-yellow-900" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-yellow-900">ASHA Worker Dashboard</h1>
                  <p className="text-yellow-700 font-bold text-sm">Namaste, {ashaUser.name || 'Worker'} 🙏</p>
                </div>
              </div>
              <button onClick={() => { setSelectedRole(null); setAshaView('role_select'); setAshaUser(null); }} className="p-3 bg-yellow-100 text-yellow-800 rounded-2xl hover:bg-yellow-200 transition-all font-black text-sm flex items-center gap-2">
                <LogOut size={18} /> Logout
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {[
                { id: 'requests', label: 'Requests', icon: ClipboardCheck },
                { id: 'voice', label: 'Voice Notes', icon: Mic },
                { id: 'medicine', label: 'Medicine', icon: Package },
                { id: 'performance', label: 'Performance', icon: TrendingUp },
                { id: 'escalate', label: 'Escalate', icon: AlertTriangle },
              ].map(tab => (
                <button key={tab.id} onClick={() => setAshaDashboardTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-all ${ashaDashboardTab === tab.id ? 'bg-yellow-400 text-yellow-900 shadow-lg' : 'bg-white text-yellow-700 hover:bg-yellow-50 border border-yellow-100'}`}>
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>

            {ashaDashboardTab === 'requests' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-yellow-900 flex items-center gap-2"><ClipboardCheck size={20}/> Patient Requests</h2>
                {patientRequests.length === 0 && !ashaDataLoading && (
                  <div className="bg-white rounded-2xl p-8 text-center border border-yellow-100">
                    <p className="font-black text-gray-400">No patient requests yet.</p>
                    <p className="text-xs text-gray-300 mt-1">Requests from General Health & MatriSeva sections will appear here in real-time.</p>
                  </div>
                )}
                {ashaDataLoading && <div className="text-center py-6 font-black text-yellow-600">Loading requests...</div>}
                {patientRequests.map(req => (
                  <div key={req.firestoreId||req.id} className={`bg-white rounded-3xl p-6 shadow-md border-l-4 ${req.urgent ? 'border-red-400' : req.status === 'Visited' ? 'border-green-400' : 'border-yellow-400'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-gray-800">{req.name}</h3>
                          <span className="text-xs text-gray-400 font-bold">({req.nameHi})</span>
                          {req.urgent && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-black">🚨 URGENT</span>}
                        </div>
                        <p className="text-sm text-gray-500 font-bold">ID: {req.id} • {req.source} • {req.time}</p>
                        <p className="text-sm font-bold text-yellow-700 mt-1">{req.issue}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><MapPin size={12}/>{req.address}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-black ${req.status === 'Visited' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{req.status}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${req.location.lat},${req.location.lng}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-xl font-black text-sm hover:bg-yellow-500 transition-all">
                        <Navigation2 size={14}/> Directions
                      </a>
                      <button onClick={() => { setSelectedPatientForVoice(req.firestoreId||req.id); setAshaDashboardTab('voice'); }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-black text-sm hover:bg-purple-200 transition-all">
                        <Mic size={14}/> Voice Note
                      </button>
                      <button onClick={() => requestMedicineDelivery(req.firestoreId||req.id, req.name)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl font-black text-sm hover:bg-green-200 transition-all">
                        <Package size={14}/> Send Medicine
                      </button>
                      {req.status !== 'Visited' && (
                        <button onClick={() => markRequestVisited(req.firestoreId)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-black text-sm hover:bg-blue-200 transition-all">
                          <CheckCircle2 size={14}/> Mark Visited
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {ashaDashboardTab === 'voice' && (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-yellow-900 flex items-center gap-2"><Mic size={20}/> Voice Complaint Recording</h2>
                <div className="bg-white rounded-3xl p-6 shadow-md space-y-4">
                  <div>
                    <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Select Patient</label>
                    <select value={selectedPatientForVoice} onChange={e => setSelectedPatientForVoice(e.target.value)}
                      className="w-full p-3 rounded-2xl border-2 border-yellow-200 font-bold focus:ring-4 focus:ring-yellow-200 outline-none">
                      <option value="">-- Select Patient --</option>
                      {patientRequests.map(p => <option key={p.firestoreId||p.id} value={p.firestoreId||p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    {!voiceRecording ? (
                      <button onClick={startVoiceRecording} disabled={!selectedPatientForVoice}
                        className="flex items-center gap-3 px-8 py-4 bg-yellow-400 text-yellow-900 rounded-2xl font-black text-lg hover:bg-yellow-500 transition-all disabled:opacity-40 shadow-lg">
                        <Mic size={24}/> Start Recording
                      </button>
                    ) : (
                      <button onClick={stopVoiceRecording}
                        className="flex items-center gap-3 px-8 py-4 bg-red-400 text-white rounded-2xl font-black text-lg hover:bg-red-500 transition-all animate-pulse shadow-lg">
                        <MicOff size={24}/> Stop & Save
                      </button>
                    )}
                  </div>
                  {voiceTranscript && (
                    <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                      <p className="text-sm font-black text-yellow-700 uppercase tracking-widest mb-1">Live Transcript:</p>
                      <p className="text-gray-700 font-medium">{voiceTranscript}</p>
                    </div>
                  )}
                </div>
                {voiceNotes.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-black text-yellow-900">Saved Voice Notes</h3>
                    {voiceNotes.map((note, i) => (
                      <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-yellow-100">
                        <div className="flex justify-between mb-2">
                          <span className="font-black text-gray-700">{note.patientName} <span className="text-xs text-gray-400">({note.patientId})</span></span>
                          <span className="text-xs text-gray-400">{note.timestamp}</span>
                        </div>
                        <p className="text-gray-600 text-sm">{note.transcript}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {ashaDashboardTab === 'medicine' && (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-yellow-900 flex items-center gap-2"><Package size={20}/> Medicine Delivery Requests</h2>
                <div className="bg-white rounded-3xl p-6 shadow-md space-y-4">
                  <p className="text-gray-500 font-bold text-sm">Request medicine delivery for a patient:</p>
                  {patientRequests.filter(p => p.status !== 'Visited').length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">No pending patients.</p>
                  )}
                  <div className="grid gap-3">
                    {patientRequests.filter(p => p.status !== 'Visited').map(req => (
                      <div key={req.firestoreId||req.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                        <div>
                          <p className="font-black text-gray-800">{req.name}</p>
                          <p className="text-xs text-yellow-700 font-bold">{req.address}</p>
                        </div>
                        <button onClick={() => requestMedicineDelivery(req.firestoreId||req.id, req.name)}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-xl font-black text-sm hover:bg-yellow-500 transition-all">
                          <Package size={14}/> Request
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {medicineRequests.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-black text-yellow-900">Active Delivery Requests</h3>
                    {medicineRequests.map(req => (
                      <div key={req.firestoreId||req.id} className="bg-white rounded-2xl p-5 shadow-sm border border-green-100 flex justify-between items-center">
                        <div>
                          <p className="font-black text-gray-700">{req.patientName}</p>
                          <p className="text-xs text-gray-400">{req.medicines.join(', ')}</p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-black">{req.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {ashaDashboardTab === 'performance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-yellow-900 flex items-center gap-2"><TrendingUp size={20}/> Monthly Performance — {performanceData.month}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Visits Completed', value: performanceData.visitsCompleted, icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
                    { label: 'Referrals Made', value: performanceData.referralsMade, icon: ArrowRight, color: 'bg-blue-100 text-blue-700' },
                    { label: 'Outcomes Tracked', value: performanceData.outcomesTracked, icon: Activity, color: 'bg-purple-100 text-purple-700' },
                    { label: 'Pending Requests', value: performanceData.pendingRequests, icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 shadow-md text-center">
                      <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                        <stat.icon size={24} />
                      </div>
                      <p className="text-4xl font-black text-gray-800">{stat.value}</p>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-md">
                  <h3 className="font-black text-gray-700 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {patientRequests.length === 0 && <p className="text-gray-400 text-sm text-center">No activity yet.</p>}
                    {patientRequests.map(req => (
                      <div key={req.firestoreId||req.id} className="flex items-center gap-3 text-sm">
                        <div className={`w-2 h-2 rounded-full ${req.status === 'Visited' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                        <span className="font-bold text-gray-600">{req.name}</span>
                        <span className="text-gray-400">— {req.issue}</span>
                        <span className={`ml-auto text-xs font-black ${req.status === 'Visited' ? 'text-green-600' : 'text-yellow-600'}`}>{req.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {ashaDashboardTab === 'escalate' && (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-yellow-900 flex items-center gap-2"><AlertTriangle size={20}/> Escalate Emergency</h2>
                <div className="bg-white rounded-3xl p-6 shadow-md space-y-4">
                  <p className="text-sm font-bold text-gray-500">Send an urgent alert to the Admin or District Health Officer.</p>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Escalation Message</label>
                    <textarea value={escalationMessage} onChange={e => setEscalationMessage(e.target.value)} rows={4}
                      className="w-full p-4 rounded-2xl border-2 border-yellow-200 focus:ring-4 focus:ring-yellow-200 outline-none font-medium resize-none"
                      placeholder="Describe the emergency situation, patient details, location..."/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => sendEscalation('admin')}
                      className="flex items-center justify-center gap-2 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 transition-all shadow-lg">
                      <Send size={18}/> Alert Admin
                    </button>
                    <button onClick={() => sendEscalation('dho')}
                      className="flex items-center justify-center gap-2 py-4 bg-yellow-400 text-yellow-900 rounded-2xl font-black hover:bg-yellow-500 transition-all shadow-lg">
                      <Send size={18}/> Alert DHO
                    </button>
                  </div>
                  {escalationSent && (
                    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="p-4 bg-green-50 border border-green-200 rounded-2xl text-center">
                      <p className="font-black text-green-700">✅ Alert sent successfully!</p>
                    </motion.div>
                  )}
                </div>
                <div className="bg-yellow-50 rounded-3xl p-6 border border-yellow-200">
                  <p className="font-black text-yellow-800 mb-3">Emergency Contacts</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="font-bold text-gray-600">District Health Officer</span><a href="tel:108" className="font-black text-yellow-700">108</a></div>
                    <div className="flex justify-between"><span className="font-bold text-gray-600">Admin Helpline</span><a href="tel:1800111565" className="font-black text-yellow-700">1800-111-565</a></div>
                    <div className="flex justify-between"><span className="font-bold text-gray-600">Emergency Ambulance</span><a href="tel:102" className="font-black text-yellow-700">102</a></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      // ASHA Signup
      if (ashaView === 'signup') {
        return (
          <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-yellow-400 p-8 text-yellow-900">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-300 rounded-2xl flex items-center justify-center"><Stethoscope size={24}/></div>
                  <div><h2 className="text-2xl font-black">ASHA Worker Sign Up</h2><p className="font-bold text-yellow-800 text-sm">Create your account</p></div>
                </div>
              </div>
              <div className="p-8 space-y-4">
                {ashaAuthError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-bold">{ashaAuthError}</div>}
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Name *</label>
                  <input value={ashaName} onChange={e=>setAshaName(e.target.value)} placeholder="Sunita Devi" className="w-full p-3 rounded-2xl border-2 border-yellow-100 focus:ring-4 focus:ring-yellow-200 outline-none font-bold"/>
                </div>
                {!ashaAuthMode && (
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email *</label>
                    <input value={ashaEmail} onChange={e=>setAshaEmail(e.target.value)} placeholder="worker@example.com" type="email" className="w-full p-3 rounded-2xl border-2 border-yellow-100 focus:ring-4 focus:ring-yellow-200 outline-none font-bold"/>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input value={ashaPhone} onChange={e=>setAshaPhone(e.target.value)} placeholder="+91 9876543210" className="w-full p-3 rounded-2xl border-2 border-yellow-100 focus:ring-4 focus:ring-yellow-200 outline-none font-bold"/>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">District</label>
                  <input value={ashaDistrict} onChange={e=>setAshaDistrict(e.target.value)} placeholder="e.g. Jaipur" className="w-full p-3 rounded-2xl border-2 border-yellow-100 focus:ring-4 focus:ring-yellow-200 outline-none font-bold"/>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Create Password *</label>
                  <input value={ashaPassword} onChange={e=>setAshaPassword(e.target.value)} placeholder="Min. 6 characters" type="password" className="w-full p-3 rounded-2xl border-2 border-yellow-100 focus:ring-4 focus:ring-yellow-200 outline-none font-bold"/>
                </div>
                <button onClick={ashaAuthMode === 'google' ? saveAshaProfileAndGo : handleAshaEmailSignup} disabled={ashaLoading}
                  className="w-full py-4 bg-yellow-400 text-yellow-900 rounded-2xl font-black text-lg hover:bg-yellow-500 transition-all disabled:opacity-50 shadow-lg">
                  {ashaLoading ? 'Creating account...' : 'Create Account & Go to Dashboard'}
                </button>
                <button onClick={() => { setAshaView('login'); setAshaAuthError(null); }} className="w-full text-center text-yellow-700 font-black text-sm hover:underline">Already have an account? Login</button>
                <button onClick={() => { setSelectedRole(null); setAshaView('role_select'); setAshaAuthError(null); }} className="w-full text-center text-gray-400 font-bold text-sm hover:underline">← Back to roles</button>
              </div>
            </motion.div>
          </div>
        );
      }

      // ASHA Login
      if (ashaView === 'login') {
        return (
          <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-yellow-400 p-8 text-yellow-900">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-300 rounded-2xl flex items-center justify-center"><Stethoscope size={24}/></div>
                  <div><h2 className="text-2xl font-black">ASHA Worker Login</h2><p className="font-bold text-yellow-800 text-sm">Welcome back!</p></div>
                </div>
              </div>
              <div className="p-8 space-y-4">
                {ashaAuthError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-bold">{ashaAuthError}</div>}
                <button onClick={handleAshaGoogleLoginDirect} disabled={ashaLoading}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-yellow-200 text-yellow-900 rounded-2xl font-black hover:bg-yellow-50 transition-all shadow-md">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google"/> Login with Google
                </button>
                <div className="flex items-center gap-3"><div className="flex-1 h-px bg-gray-100"/><span className="text-sm font-bold text-gray-400">OR</span><div className="flex-1 h-px bg-gray-100"/></div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email</label>
                  <input value={ashaEmail} onChange={e=>setAshaEmail(e.target.value)} placeholder="worker@example.com" type="email" className="w-full p-3 rounded-2xl border-2 border-yellow-100 focus:ring-4 focus:ring-yellow-200 outline-none font-bold"/>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
                  <input value={ashaPassword} onChange={e=>setAshaPassword(e.target.value)} placeholder="Your password" type="password" className="w-full p-3 rounded-2xl border-2 border-yellow-100 focus:ring-4 focus:ring-yellow-200 outline-none font-bold"/>
                </div>
                <button onClick={handleAshaEmailLogin} disabled={ashaLoading}
                  className="w-full py-4 bg-yellow-400 text-yellow-900 rounded-2xl font-black text-lg hover:bg-yellow-500 transition-all disabled:opacity-50 shadow-lg">
                  {ashaLoading ? 'Logging in...' : 'Login to Dashboard'}
                </button>
                <button onClick={() => { setAshaView('signup'); setAshaAuthError(null); }} className="w-full text-center text-yellow-700 font-black text-sm hover:underline">New here? Create Account</button>
                <button onClick={() => { setSelectedRole(null); setAshaView('role_select'); setAshaAuthError(null); }} className="w-full text-center text-gray-400 font-bold text-sm hover:underline">← Back to roles</button>
              </div>
            </motion.div>
          </div>
        );
      }

      // ASHA entry — signup/login choice
      return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 flex items-center justify-center p-4">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-yellow-400 p-10 text-yellow-900 text-center">
              <div className="w-20 h-20 bg-yellow-300 rounded-3xl flex items-center justify-center mx-auto mb-4"><Stethoscope size={40}/></div>
              <h2 className="text-3xl font-black">ASHA Worker</h2>
              <p className="font-bold text-yellow-800 mt-2">Accredited Social Health Activist</p>
            </div>
            <div className="p-8 space-y-4">
              {ashaAuthError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-bold">{ashaAuthError}</div>}
              <button onClick={handleAshaGoogleSignup} disabled={ashaLoading}
                className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-yellow-200 text-yellow-900 rounded-2xl font-black hover:bg-yellow-50 transition-all shadow-md">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google"/> Continue with Google
              </button>
              <button onClick={() => { setAshaView('signup'); setAshaAuthError(null); }}
                className="w-full py-4 bg-yellow-400 text-yellow-900 rounded-2xl font-black text-lg hover:bg-yellow-500 transition-all shadow-lg flex items-center justify-center gap-3">
                <UserPlus size={22}/> Sign Up with Email
              </button>
              <button onClick={() => { setAshaView('login'); setAshaAuthError(null); }}
                className="w-full py-4 bg-amber-100 text-amber-800 rounded-2xl font-black text-lg hover:bg-amber-200 transition-all">
                Already Registered? Login
              </button>
              <button onClick={() => { setSelectedRole(null); setAshaView('role_select'); }} className="w-full text-center text-gray-400 font-bold text-sm hover:underline">← Back to roles</button>
            </div>
          </motion.div>
        </div>
      );
    }
    // ── End ASHA Worker flow ───────────────────────────────────────────

    // ── Pharmacy Owner Dashboard ───────────────────────────────────────
    if (selectedRole === 'pharmacy') {
      // ── Landing ──
      if (pharmacyAuthView === 'landing') {
        return (
          <div className="min-h-screen bg-gradient-to-br from-[#FFF0EE] to-[#FFF8F7] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-2xl">
              {/* Hero */}
              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl mb-6" style={{background:'linear-gradient(135deg,#FB9280,#e17065)'}}>
                <div className="p-10 text-white text-center">
                  <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                    <Store size={48} className="text-white"/>
                  </div>
                  <h1 className="text-4xl font-black tracking-tight mb-2">PragatiPath Medical</h1>
                  <p className="text-white/80 font-bold text-lg">Partner Portal</p>
                  <p className="text-white/60 text-sm mt-2 font-medium">Register your pharmacy & grow with us — like Swiggy for medicines</p>
                </div>
                <div className="grid grid-cols-3 divide-x divide-white/20 bg-white/10">
                  {[['500+','Patients Served'],['98%','On-Time Delivery'],['Free','Listing & Setup']].map(([v,l],i)=>(
                    <div key={i} className="p-4 text-center">
                      <p className="text-white font-black text-xl">{v}</p>
                      <p className="text-white/70 text-xs font-bold">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Benefits */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  {icon:ShoppingBag, title:'Get Orders Online', desc:'Receive patient orders directly on your dashboard'},
                  {icon:Package, title:'Stock Management', desc:'Track inventory, get low-stock alerts automatically'},
                  {icon:Truck, title:'Delivery Network', desc:'Assign orders to delivery partners in your area'},
                  {icon:TrendingUp, title:'Sales Analytics', desc:'View revenue, history and performance reports'},
                ].map((b,i)=>(
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-orange-50 flex gap-3">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{backgroundColor:'#FFF0EE'}}>
                      <b.icon size={18} style={{color:'#FB9280'}}/>
                    </div>
                    <div>
                      <p className="font-black text-gray-800 text-sm">{b.title}</p>
                      <p className="text-xs text-gray-400 font-medium">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handlePharmacyGoogleAuth} disabled={pharmacyLoading}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 rounded-2xl font-black hover:bg-orange-50 transition-all shadow-md text-gray-700" style={{borderColor:'#FB9280'}}>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6"/>
                  Continue with Google
                </button>
                <button onClick={()=>{setPharmacyAuthView('register');setPharmacyAuthError(null);}} className="w-full py-4 rounded-2xl font-black text-white text-lg shadow-lg transition-all" style={{backgroundColor:'#FB9280'}}>
                  Register Your Pharmacy
                </button>
                <button onClick={()=>{setPharmacyAuthView('login');setPharmacyAuthError(null);}} className="w-full py-3 rounded-2xl font-black bg-white border border-orange-100 text-gray-600 hover:bg-orange-50 transition-all">
                  Already Registered? Login
                </button>
                <button onClick={()=>setSelectedRole(null)} className="text-center text-gray-400 font-bold text-sm hover:underline">← Back to roles</button>
              </div>
              {pharmacyAuthError && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-bold">{pharmacyAuthError}</div>}
            </motion.div>
          </div>
        );
      }

      // ── Register ──
      if (pharmacyAuthView === 'register') {
        return (
          <div className="min-h-screen bg-gradient-to-br from-[#FFF0EE] to-[#FFF8F7] p-4 overflow-y-auto">
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-lg mx-auto py-8">
              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-white">
                <div className="p-8 text-white" style={{background:'linear-gradient(135deg,#FB9280,#e17065)'}}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Store size={24}/></div>
                    <div>
                      <h2 className="text-2xl font-black">Register Your Pharmacy</h2>
                      <p className="text-white/80 text-sm font-bold">Join PragatiPath Partner Network</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-4">
                  {pharmacyAuthError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-bold">{pharmacyAuthError}</div>}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Shop / Pharmacy Name *</label>
                      <input value={pharmReg.shopName} onChange={e=>setPharmReg(p=>({...p,shopName:e.target.value}))} placeholder="e.g. Rampur Village Pharmacy" className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Owner Name *</label>
                        <input value={pharmReg.ownerName} onChange={e=>setPharmReg(p=>({...p,ownerName:e.target.value}))} placeholder="Full name" className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Phone *</label>
                        <input value={pharmReg.phone} onChange={e=>setPharmReg(p=>({...p,phone:e.target.value}))} placeholder="+91 98765..." className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Email *</label>
                      <input value={pharmReg.email} onChange={e=>setPharmReg(p=>({...p,email:e.target.value}))} type="email" placeholder="pharmacy@example.com" className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Shop Address *</label>
                      <input value={pharmReg.address} onChange={e=>setPharmReg(p=>({...p,address:e.target.value}))} placeholder="Full address with landmark" className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">District</label>
                        <input value={pharmReg.district} onChange={e=>setPharmReg(p=>({...p,district:e.target.value}))} placeholder="e.g. Jaipur" className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">State</label>
                        <input value={pharmReg.state} onChange={e=>setPharmReg(p=>({...p,state:e.target.value}))} placeholder="e.g. Rajasthan" className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Drug License No.</label>
                        <input value={pharmReg.licenseNo} onChange={e=>setPharmReg(p=>({...p,licenseNo:e.target.value}))} placeholder="DL-XXXX-XXXX" className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">GSTIN</label>
                        <input value={pharmReg.gstin} onChange={e=>setPharmReg(p=>({...p,gstin:e.target.value}))} placeholder="Optional" className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Create Password *</label>
                      <input value={pharmReg.password} onChange={e=>setPharmReg(p=>({...p,password:e.target.value}))} type="password" placeholder="Min 6 characters" className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                    </div>
                  </div>
                  <button onClick={handlePharmacyEmailRegister} disabled={pharmacyLoading}
                    className="w-full py-4 rounded-2xl font-black text-white text-lg shadow-lg disabled:opacity-50 transition-all" style={{backgroundColor:'#FB9280'}}>
                    {pharmacyLoading ? 'Registering...' : 'Register & Go to Dashboard'}
                  </button>
                  <button onClick={()=>setPharmacyAuthView('login')} className="w-full text-center font-bold text-sm hover:underline" style={{color:'#FB9280'}}>Already have an account? Login</button>
                  <button onClick={()=>setPharmacyAuthView('landing')} className="w-full text-center text-gray-400 font-bold text-sm hover:underline">← Back</button>
                </div>
              </div>
            </motion.div>
          </div>
        );
      }

      // ── Login ──
      if (pharmacyAuthView === 'login') {
        return (
          <div className="min-h-screen bg-gradient-to-br from-[#FFF0EE] to-[#FFF8F7] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-8 text-white" style={{background:'linear-gradient(135deg,#FB9280,#e17065)'}}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Store size={24}/></div>
                  <div><h2 className="text-2xl font-black">Pharmacy Login</h2><p className="text-white/80 font-bold text-sm">Welcome back, Partner!</p></div>
                </div>
              </div>
              <div className="p-8 space-y-4">
                {pharmacyAuthError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-bold">{pharmacyAuthError}</div>}
                <button onClick={handlePharmacyGoogleAuth} disabled={pharmacyLoading}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 rounded-2xl font-black transition-all shadow-md text-gray-700" style={{borderColor:'#FB9280'}}>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6"/> Login with Google
                </button>
                <div className="flex items-center gap-3"><div className="flex-1 h-px bg-gray-100"/><span className="text-sm font-bold text-gray-400">OR</span><div className="flex-1 h-px bg-gray-100"/></div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Email</label>
                  <input value={pharmLogin.email} onChange={e=>setPharmLogin(p=>({...p,email:e.target.value}))} type="email" placeholder="pharmacy@example.com" className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Password</label>
                  <input value={pharmLogin.password} onChange={e=>setPharmLogin(p=>({...p,password:e.target.value}))} type="password" placeholder="Your password" className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                </div>
                <button onClick={handlePharmacyEmailLogin} disabled={pharmacyLoading}
                  className="w-full py-4 rounded-2xl font-black text-white text-lg shadow-lg disabled:opacity-50 transition-all" style={{backgroundColor:'#FB9280'}}>
                  {pharmacyLoading ? 'Logging in...' : 'Login to Dashboard'}
                </button>
                <button onClick={()=>setPharmacyAuthView('register')} className="w-full text-center font-bold text-sm hover:underline" style={{color:'#FB9280'}}>New here? Register</button>
                <button onClick={()=>setPharmacyAuthView('landing')} className="w-full text-center text-gray-400 font-bold text-sm hover:underline">← Back</button>
              </div>
            </motion.div>
          </div>
        );
      }

      // ── Dashboard ──
      const pendingOrders = pharmacyOrders.filter(o => o.status === 'Pending').length;
      const lowStockItems = pharmacyStock.filter(s => s.qty <= s.threshold);
      const unreadAlerts = pharmacyAlerts.filter(a => !a.read).length;
      const selectedInvoice = pharmacyOrders.find(o => o.firestoreId === showInvoice);
      const todaySales = pharmacyOrders.filter(o=>o.paid).reduce((s:number,o:any)=>s+(o.amount||0),0);
      const totalRevenue = pharmacyOrders.reduce((s:number,o:any)=>s+(o.amount||0),0);

      return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFF0EE] to-[#FFF8F7] p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{backgroundColor:'#FB9280'}}>
                <Store size={28} className="text-white"/>
              </div>
              <div>
                <h1 className="text-xl font-black" style={{color:'#c0392b'}}>{pharmacyProfile?.shopName || 'My Pharmacy'}</h1>
                <p className="font-bold text-sm" style={{color:'#e17065'}}>{pharmacyProfile?.ownerName} • {pharmacyProfile?.district}</p>
              </div>
            </div>
            <button onClick={()=>{setSelectedRole(null);setPharmacyAuthView('landing');setPharmacyUser(null);setPharmacyProfile(null);}} className="p-3 rounded-2xl font-black text-sm flex items-center gap-2 text-white" style={{backgroundColor:'#FB9280'}}>
              <LogOut size={18}/> Exit
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              {label:'Pending Orders', value:pendingOrders, icon:ShoppingBag, bg:'#FFF0EE', color:'#FB9280'},
              {label:'Low Stock', value:lowStockItems.length, icon:AlertCircle, bg:'#FFF3E0', color:'#FF9800'},
              {label:'ASHA Alerts', value:unreadAlerts, icon:AlertTriangle, bg:'#FCE4EC', color:'#E91E63'},
              {label:"Total Revenue", value:`₹${totalRevenue}`, icon:TrendingUp, bg:'#E8F5E9', color:'#4CAF50'},
            ].map((s,i)=>(
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:s.bg}}>
                  <s.icon size={20} style={{color:s.color}}/>
                </div>
                <div>
                  <p className="text-xl font-black text-gray-800">{s.value}</p>
                  <p className="text-xs font-bold text-gray-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {[
              {id:'orders', label:'Orders', icon:ShoppingBag},
              {id:'stock', label:'Stock', icon:Package},
              {id:'history', label:'Sales History', icon:History},
              {id:'alerts', label:`Alerts${unreadAlerts?` (${unreadAlerts})`:''}`, icon:AlertTriangle},
              {id:'ratings', label:'Ratings', icon:Heart},
            ].map(tab=>(
              <button key={tab.id} onClick={()=>setPharmacyTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-all ${pharmacyTab===tab.id?'text-white shadow-lg':'bg-white text-gray-500 hover:bg-orange-50 border border-orange-100'}`}
                style={pharmacyTab===tab.id?{backgroundColor:'#FB9280'}:{}}>
                <tab.icon size={16}/> {tab.label}
              </button>
            ))}
          </div>

          {/* Orders Tab */}
          {pharmacyTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="font-black text-lg flex items-center gap-2" style={{color:'#c0392b'}}><ShoppingBag size={20}/> Incoming Orders</h2>
              {pharmacyOrders.filter(o=>['Pending','Accepted'].includes(o.status)).length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center border border-orange-100">
                  <p className="font-black text-gray-400">No active orders right now.</p>
                  <p className="text-xs text-gray-300 font-bold mt-1">Orders from patients will appear here in real-time.</p>
                </div>
              )}
              {pharmacyOrders.filter(o=>['Pending','Accepted'].includes(o.status)).map(order=>(
                <div key={order.firestoreId} className="bg-white rounded-3xl p-6 shadow-md border-l-4" style={{borderColor:order.status==='Accepted'?'#4CAF50':'#FB9280'}}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-gray-800 text-lg">{order.patient}</h3>
                        {order.hasPrescription && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-black flex items-center gap-1"><FileText size={10}/> Rx</span>}
                        {!order.hasPrescription && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-black">No Rx</span>}
                      </div>
                      <p className="text-xs text-gray-400 font-bold">{order.id || order.firestoreId?.slice(0,8)} • {order.time || new Date(order.createdAt||'').toLocaleTimeString()}</p>
                      <p className="text-sm font-bold mt-1" style={{color:'#FB9280'}}>{Array.isArray(order.medicines)?order.medicines.join(', '):order.medicines}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin size={11}/>{order.address}</p>
                      <p className="text-sm font-black text-gray-700 mt-1">₹{order.amount} • {order.paymentMode}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-black ${order.status==='Accepted'?'bg-green-100 text-green-700':'bg-orange-100 text-orange-600'}`}>{order.status}</span>
                  </div>
                  {order.status==='Pending' && (
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={()=>acceptOrder(order.firestoreId)} className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm text-white" style={{backgroundColor:'#4CAF50'}}>
                        <CheckCircle2 size={14}/> Accept
                      </button>
                      <button onClick={()=>setShowRejectModal(order.firestoreId)} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-xl font-black text-sm hover:bg-red-200 transition-all">
                        <X size={14}/> Reject
                      </button>
                      <button onClick={()=>generateInvoice(order.firestoreId)} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-xl font-black text-sm hover:bg-blue-200 transition-all">
                        <FileText size={14}/> Invoice
                      </button>
                    </div>
                  )}
                  {order.status==='Accepted' && (
                    <div className="flex gap-2 flex-wrap">
                      {!order.deliveryBoy ? (
                        <button onClick={()=>setShowAssignModal(order.firestoreId)} className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm text-white" style={{backgroundColor:'#FB9280'}}>
                          <Truck size={14}/> Assign Delivery
                        </button>
                      ):(
                        <span className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl font-black text-sm border border-green-100">
                          <Truck size={14}/> {order.deliveryBoy}
                        </span>
                      )}
                      <button onClick={()=>recordPayment(order.firestoreId, order.paymentMode||'COD')} disabled={order.paid} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm transition-all ${order.paid?'bg-gray-100 text-gray-400':'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
                        <BadgeCheck size={14}/> {order.paid?'Paid':'Record Payment'}
                      </button>
                      <button onClick={()=>generateInvoice(order.firestoreId)} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-xl font-black text-sm hover:bg-blue-200 transition-all">
                        <FileText size={14}/> Invoice
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Stock Tab */}
          {pharmacyTab === 'stock' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-lg flex items-center gap-2" style={{color:'#c0392b'}}><Package size={20}/> Medicine Stock</h2>
                <button onClick={()=>setShowAddMedicine(true)} className="flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm text-white shadow-md transition-all hover:opacity-90" style={{backgroundColor:'#FB9280'}}>
                  <Plus size={16}/> Add Medicine
                </button>
              </div>
              {lowStockItems.length>0 && (
                <div className="p-4 rounded-2xl border flex items-start gap-3" style={{backgroundColor:'#FFF3E0', borderColor:'#FFCC02'}}>
                  <AlertCircle size={20} className="text-orange-500 mt-0.5 flex-shrink-0"/>
                  <div>
                    <p className="font-black text-orange-700">Low Stock Alert!</p>
                    <p className="text-sm text-orange-600 font-bold">{lowStockItems.map((s:any)=>s.name).join(', ')} — below threshold. Auto-request sent to district supplier.</p>
                  </div>
                </div>
              )}
              {pharmacyStock.length===0 && (
                <div className="bg-white rounded-2xl p-8 text-center border border-orange-100">
                  <p className="font-black text-gray-400">No medicines added yet.</p>
                  <p className="text-xs text-gray-300 mt-1">Click "Add Medicine" to start building your stock.</p>
                </div>
              )}
              <div className="space-y-3">
                {pharmacyStock.map((item:any)=>(
                  <div key={item.firestoreId} className={`bg-white rounded-2xl p-5 shadow-sm border ${item.qty<=item.threshold?'border-orange-200':'border-gray-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-black text-gray-800">{item.name} <span className="text-xs text-gray-400 font-bold">{item.nameHi && item.nameHi!==item.name?`(${item.nameHi})`:''}</span></p>
                        <p className="text-xs text-gray-400 font-bold">₹{item.price}/{item.unit} • Min stock: {item.threshold}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={()=>updateStock(item.firestoreId,-1,item.qty)} className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center font-black hover:bg-red-100 transition-all"><Minus size={14}/></button>
                        <span className={`font-black text-lg min-w-[2.5rem] text-center ${item.qty<=item.threshold?'text-orange-500':'text-gray-800'}`}>{item.qty}</span>
                        <button onClick={()=>updateStock(item.firestoreId,1,item.qty)} className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-black hover:bg-green-100 transition-all"><Plus size={14}/></button>
                        <button onClick={()=>deleteMedicine(item.firestoreId)} className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-red-50 hover:text-red-400 transition-all ml-1"><Trash2 size={14}/></button>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{width:`${Math.min(100,(item.qty/Math.max(item.threshold*2,1))*100)}%`, backgroundColor:item.qty<=item.threshold?'#FF9800':'#FB9280'}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sales History Tab */}
          {pharmacyTab === 'history' && (
            <div className="space-y-4">
              <h2 className="font-black text-lg flex items-center gap-2" style={{color:'#c0392b'}}><History size={20}/> Sales History</h2>
              <div className="bg-white rounded-2xl p-5 shadow-sm grid grid-cols-3 gap-4 text-center">
                <div><p className="text-2xl font-black text-gray-800">{pharmacyOrders.length}</p><p className="text-xs font-black text-gray-400">Total Orders</p></div>
                <div><p className="text-2xl font-black" style={{color:'#FB9280'}}>₹{totalRevenue}</p><p className="text-xs font-black text-gray-400">Total Revenue</p></div>
                <div><p className="text-2xl font-black text-green-600">{pharmacyOrders.filter(o=>o.status!=='Rejected').length}</p><p className="text-xs font-black text-gray-400">Fulfilled</p></div>
              </div>
              {pharmacyOrders.length===0 && (
                <div className="bg-white rounded-2xl p-8 text-center border border-orange-100">
                  <p className="font-black text-gray-400">No orders yet. Share your pharmacy link with patients to start receiving orders!</p>
                </div>
              )}
              <div className="space-y-3">
                {pharmacyOrders.map(order=>(
                  <div key={order.firestoreId} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="font-black text-gray-800">{order.patient} <span className="text-xs text-gray-400">#{order.firestoreId?.slice(0,6)}</span></p>
                      <p className="text-xs font-bold" style={{color:'#FB9280'}}>{Array.isArray(order.medicines)?order.medicines.join(', '):order.medicines}</p>
                      <p className="text-xs text-gray-400">{order.time||''} • ₹{order.amount} • {order.paymentMode} {order.paid?'• ✅ Paid':''}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full font-black ${order.status==='Rejected'?'bg-red-100 text-red-600':order.status==='Out for Delivery'||order.status==='Delivered'?'bg-green-100 text-green-700':'bg-orange-100 text-orange-600'}`}>{order.status}</span>
                      <button onClick={()=>generateInvoice(order.firestoreId)} className="text-xs font-black text-blue-500 hover:underline flex items-center gap-1"><FileText size={11}/> Invoice</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {pharmacyTab === 'alerts' && (
            <div className="space-y-4">
              <h2 className="font-black text-lg flex items-center gap-2" style={{color:'#c0392b'}}><AlertTriangle size={20}/> ASHA Worker Alerts</h2>
              {pharmacyAlerts.length===0 && (
                <div className="bg-white rounded-2xl p-8 text-center border border-orange-100">
                  <p className="font-black text-gray-400">No alerts right now.</p>
                  <p className="text-xs text-gray-300 mt-1">Urgent medicine requests from ASHA workers will appear here.</p>
                </div>
              )}
              {pharmacyAlerts.map(alert=>(
                <div key={alert.firestoreId} className={`bg-white rounded-3xl p-6 shadow-md border-l-4 ${alert.urgent?'border-red-400':'border-orange-300'} ${!alert.read?'ring-2 ring-red-100':''}`}>
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {alert.urgent&&<span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-black">🚨 URGENT</span>}
                      <span className="font-black text-gray-800">{alert.from}</span>
                    </div>
                    <span className="text-xs text-gray-400">{alert.time}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-600">Patient: <span className="text-gray-800">{alert.patient}</span></p>
                  <p className="text-sm font-bold mt-1" style={{color:'#FB9280'}}>Medicines: {Array.isArray(alert.medicines)?alert.medicines.join(', '):alert.medicines}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={()=>markAlertRead(alert.firestoreId)} className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm text-white" style={{backgroundColor:'#FB9280'}}>
                      <CheckCircle2 size={14}/> Acknowledge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ratings Tab */}
          {pharmacyTab === 'ratings' && (
            <div className="space-y-4">
              <h2 className="font-black text-lg flex items-center gap-2" style={{color:'#c0392b'}}><Heart size={20}/> Patient Ratings</h2>
              {pharmacyRatings.length===0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-orange-100">
                  <p className="font-black text-gray-400">No ratings yet.</p>
                  <p className="text-xs text-gray-300 mt-1">Patients will rate their delivery experience after each order.</p>
                </div>
              ):(
                <>
                  <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                    <p className="text-4xl font-black" style={{color:'#FB9280'}}>{(pharmacyRatings.reduce((s:number,r:any)=>s+(r.rating||0),0)/pharmacyRatings.length).toFixed(1)} ⭐</p>
                    <p className="text-sm font-bold text-gray-400 mt-1">{pharmacyRatings.length} reviews</p>
                  </div>
                  <div className="space-y-3">
                    {pharmacyRatings.map((r:any)=>(
                      <div key={r.firestoreId} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex justify-between mb-1">
                          <span className="font-black text-gray-800">{r.patient}</span>
                          <span className="text-xs text-gray-400">{r.date||new Date(r.createdAt||'').toLocaleDateString()}</span>
                        </div>
                        <p className="text-yellow-500 font-black text-sm">{'⭐'.repeat(r.rating||0)}</p>
                        <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Add Medicine Modal */}
          <AnimatePresence>
            {showAddMedicine && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-gray-800 text-xl">Add Medicine</h3>
                    <button onClick={()=>setShowAddMedicine(false)} className="p-2 bg-gray-100 rounded-full"><X size={18}/></button>
                  </div>
                  <div className="space-y-3">
                    <input value={newMedicine.name} onChange={e=>setNewMedicine(p=>({...p,name:e.target.value}))} placeholder="Medicine name (English) *" className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                    <input value={newMedicine.nameHi} onChange={e=>setNewMedicine(p=>({...p,nameHi:e.target.value}))} placeholder="Medicine name (Hindi)" className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                    <div className="grid grid-cols-2 gap-3">
                      <input value={newMedicine.qty} onChange={e=>setNewMedicine(p=>({...p,qty:e.target.value}))} placeholder="Quantity *" type="number" className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                      <select value={newMedicine.unit} onChange={e=>setNewMedicine(p=>({...p,unit:e.target.value}))} className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none">
                        {['strips','packets','bottles','vials','tubes','sachets'].map(u=><option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input value={newMedicine.price} onChange={e=>setNewMedicine(p=>({...p,price:e.target.value}))} placeholder="Price (₹) *" type="number" className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                      <input value={newMedicine.threshold} onChange={e=>setNewMedicine(p=>({...p,threshold:e.target.value}))} placeholder="Min qty alert" type="number" className="w-full p-3 rounded-2xl border-2 border-orange-100 font-bold outline-none focus:ring-4 focus:ring-orange-100"/>
                    </div>
                  </div>
                  <button onClick={addMedicineToStock} disabled={pharmacySaving} className="w-full mt-5 py-4 rounded-2xl font-black text-white text-lg shadow-lg disabled:opacity-50 transition-all" style={{backgroundColor:'#FB9280'}}>
                    {pharmacySaving?'Saving...':'Add to Stock'}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reject Modal */}
          <AnimatePresence>
            {showRejectModal && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
                  <h3 className="font-black text-gray-800 text-xl mb-4">Reject Order</h3>
                  <select value={rejectReason} onChange={e=>setRejectReason(e.target.value)} className="w-full p-3 rounded-2xl border-2 border-red-100 font-bold outline-none mb-4">
                    <option value="">Select reason...</option>
                    <option value="Out of stock">Out of stock</option>
                    <option value="Prescription required">Prescription required</option>
                    <option value="Invalid prescription">Invalid prescription</option>
                    <option value="Delivery unavailable">Delivery unavailable to this area</option>
                  </select>
                  <div className="flex gap-3">
                    <button onClick={()=>rejectOrder(showRejectModal, rejectReason)} disabled={!rejectReason} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-black disabled:opacity-40">Confirm Reject</button>
                    <button onClick={()=>setShowRejectModal(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black">Cancel</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Assign Delivery Modal */}
          <AnimatePresence>
            {showAssignModal && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
                  <h3 className="font-black text-gray-800 text-xl mb-4">Assign Delivery Boy</h3>
                  <div className="space-y-3 mb-4">
                    {deliveryPool.map(boy=>(
                      <button key={boy} onClick={()=>assignDelivery(showAssignModal, boy)}
                        className="w-full p-4 rounded-2xl border-2 border-orange-100 hover:border-orange-300 font-black text-left text-gray-700 flex items-center gap-3 transition-all hover:bg-orange-50">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black" style={{backgroundColor:'#FB9280'}}>{boy[0]}</div>
                        {boy}
                      </button>
                    ))}
                  </div>
                  <button onClick={()=>setShowAssignModal(null)} className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl font-black">Cancel</button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Invoice Modal */}
          <AnimatePresence>
            {showInvoice && selectedInvoice && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-gray-800 text-xl">Invoice</h3>
                    <button onClick={()=>setShowInvoice(null)} className="p-2 bg-gray-100 rounded-full"><X size={18}/></button>
                  </div>
                  <div className="border-b border-dashed border-gray-200 pb-4 mb-4">
                    <p className="font-black text-lg" style={{color:'#FB9280'}}>{pharmacyProfile?.shopName}</p>
                    <p className="text-xs text-gray-400 font-bold">{pharmacyProfile?.address} • {pharmacyProfile?.phone}</p>
                    <p className="text-xs text-gray-400 font-bold">License: {pharmacyProfile?.licenseNo || 'N/A'}</p>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between"><span className="text-gray-500 font-bold">Invoice No.</span><span className="font-black">#{selectedInvoice.firestoreId?.slice(0,8)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-bold">Patient</span><span className="font-black">{selectedInvoice.patient}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-bold">Date</span><span className="font-black">{new Date(selectedInvoice.createdAt||Date.now()).toLocaleDateString()}</span></div>
                    <div className="flex justify-between items-start"><span className="text-gray-500 font-bold">Medicines</span><span className="font-black text-right max-w-[55%]">{Array.isArray(selectedInvoice.medicines)?selectedInvoice.medicines.join(', '):selectedInvoice.medicines}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-bold">Payment</span><span className="font-black">{selectedInvoice.paymentMode} {selectedInvoice.paid?'✅':''}</span></div>
                  </div>
                  <div className="flex justify-between border-t pt-3 font-black text-lg">
                    <span>Total</span><span style={{color:'#FB9280'}}>₹{selectedInvoice.amount}</span>
                  </div>
                  <button onClick={()=>window.print()} className="w-full mt-4 py-3 rounded-2xl font-black text-white shadow-lg" style={{backgroundColor:'#FB9280'}}>
                    Print / Download
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }
    // ── End Pharmacy Owner Dashboard ──────────────────────────────────
    // ── End Pharmacy Owner Dashboard ──────────────────────────────────

    // ── Delivery Partner Dashboard ───────────────────────────────────
    if (selectedRole === 'delivery') {

      // ── Landing ──
      if (deliveryAuthView === 'landing') {
        return (
          <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-lg">
              {/* Hero */}
              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl mb-6 bg-gradient-to-br from-amber-400 to-yellow-500">
                <div className="p-10 text-center">
                  <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-5 backdrop-blur-sm">
                    <Truck size={48} className="text-white"/>
                  </div>
                  <h1 className="text-4xl font-black text-white tracking-tight mb-1">Delivery Partner</h1>
                  <p className="text-white/80 font-bold">PragatiPath — Earn on your own schedule</p>
                </div>
                <div className="grid grid-cols-3 divide-x divide-white/20 bg-black/10">
                  {[['₹40','Per Delivery'],['Flexible','Work Hours'],['Weekly','Payments']].map(([v,l],i)=>(
                    <div key={i} className="p-4 text-center">
                      <p className="text-white font-black text-xl">{v}</p>
                      <p className="text-white/70 text-xs font-bold">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Perks */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  {icon:Navigation2, title:'GPS Navigation', desc:'Live directions to every delivery location'},
                  {icon:BadgeCheck, title:'OTP Verification', desc:'Secure proof of delivery every time'},
                  {icon:TrendingUp, title:'Daily Earnings', desc:'Track income and payment history live'},
                  {icon:Activity, title:'Simple App', desc:'One tap to update each delivery status'},
                ].map((b,i)=>(
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-50 flex gap-3">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-amber-50">
                      <b.icon size={18} className="text-amber-500"/>
                    </div>
                    <div>
                      <p className="font-black text-gray-800 text-sm">{b.title}</p>
                      <p className="text-xs text-gray-400">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handleDeliveryGoogleAuth} disabled={deliveryLoading}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-amber-300 rounded-2xl font-black text-gray-700 hover:bg-amber-50 transition-all shadow-md">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6"/> Continue with Google
                </button>
                <button onClick={()=>{setDeliveryAuthView('register');setDeliveryAuthError(null);}} className="w-full py-4 bg-amber-400 text-amber-900 rounded-2xl font-black text-lg shadow-lg hover:bg-amber-500 transition-all">
                  Join as Delivery Partner
                </button>
                <button onClick={()=>{setDeliveryAuthView('login');setDeliveryAuthError(null);}} className="w-full py-3 bg-white border border-amber-200 text-amber-800 rounded-2xl font-black hover:bg-amber-50 transition-all">
                  Already Registered? Login
                </button>
                <button onClick={()=>setSelectedRole(null)} className="text-center text-gray-400 font-bold text-sm hover:underline">← Back to roles</button>
              </div>
              {deliveryAuthError && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-bold">{deliveryAuthError}</div>}
            </motion.div>
          </div>
        );
      }

      // ── Register ──
      if (deliveryAuthView === 'register') {
        return (
          <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-8 bg-gradient-to-r from-amber-400 to-yellow-500">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Truck size={24} className="text-white"/></div>
                  <div><h2 className="text-2xl font-black text-white">Join as Partner</h2><p className="text-white/80 font-bold text-sm">Start earning today</p></div>
                </div>
              </div>
              <div className="p-8 space-y-4">
                {deliveryAuthError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-bold">{deliveryAuthError}</div>}
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Full Name *</label>
                  <input value={delivReg.name} onChange={e=>setDelivReg(p=>({...p,name:e.target.value}))} placeholder="e.g. Raju Kumar" className="w-full p-3 rounded-2xl border-2 border-amber-100 font-bold outline-none focus:ring-4 focus:ring-amber-100"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Phone *</label>
                    <input value={delivReg.phone} onChange={e=>setDelivReg(p=>({...p,phone:e.target.value}))} placeholder="+91 98765..." className="w-full p-3 rounded-2xl border-2 border-amber-100 font-bold outline-none focus:ring-4 focus:ring-amber-100"/>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Vehicle</label>
                    <select value={delivReg.vehicle} onChange={e=>setDelivReg(p=>({...p,vehicle:e.target.value}))} className="w-full p-3 rounded-2xl border-2 border-amber-100 font-bold outline-none">
                      {['Bicycle','Motorcycle','Auto','Car'].map(v=><option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Service Area</label>
                  <input value={delivReg.area} onChange={e=>setDelivReg(p=>({...p,area:e.target.value}))} placeholder="e.g. Ward 1-5, Village North" className="w-full p-3 rounded-2xl border-2 border-amber-100 font-bold outline-none focus:ring-4 focus:ring-amber-100"/>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Email *</label>
                  <input value={delivReg.email} onChange={e=>setDelivReg(p=>({...p,email:e.target.value}))} type="email" placeholder="your@email.com" className="w-full p-3 rounded-2xl border-2 border-amber-100 font-bold outline-none focus:ring-4 focus:ring-amber-100"/>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Password *</label>
                  <input value={delivReg.password} onChange={e=>setDelivReg(p=>({...p,password:e.target.value}))} type="password" placeholder="Min 6 characters" className="w-full p-3 rounded-2xl border-2 border-amber-100 font-bold outline-none focus:ring-4 focus:ring-amber-100"/>
                </div>
                <button onClick={handleDeliveryEmailRegister} disabled={deliveryLoading}
                  className="w-full py-4 bg-amber-400 text-amber-900 rounded-2xl font-black text-lg shadow-lg disabled:opacity-50 hover:bg-amber-500 transition-all">
                  {deliveryLoading ? 'Registering...' : 'Create Account & Start'}
                </button>
                <button onClick={()=>setDeliveryAuthView('login')} className="w-full text-center text-amber-600 font-black text-sm hover:underline">Already registered? Login</button>
                <button onClick={()=>setDeliveryAuthView('landing')} className="w-full text-center text-gray-400 font-bold text-sm hover:underline">← Back</button>
              </div>
            </motion.div>
          </div>
        );
      }

      // ── Login ──
      if (deliveryAuthView === 'login') {
        return (
          <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-8 bg-gradient-to-r from-amber-400 to-yellow-500">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Truck size={24} className="text-white"/></div>
                  <div><h2 className="text-2xl font-black text-white">Partner Login</h2><p className="text-white/80 font-bold text-sm">Welcome back!</p></div>
                </div>
              </div>
              <div className="p-8 space-y-4">
                {deliveryAuthError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-bold">{deliveryAuthError}</div>}
                <button onClick={handleDeliveryGoogleAuth} disabled={deliveryLoading}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-amber-300 rounded-2xl font-black text-gray-700 hover:bg-amber-50 transition-all shadow-md">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6"/> Login with Google
                </button>
                <div className="flex items-center gap-3"><div className="flex-1 h-px bg-gray-100"/><span className="text-sm font-bold text-gray-400">OR</span><div className="flex-1 h-px bg-gray-100"/></div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Email</label>
                  <input value={delivLogin.email} onChange={e=>setDelivLogin(p=>({...p,email:e.target.value}))} type="email" placeholder="your@email.com" className="w-full p-3 rounded-2xl border-2 border-amber-100 font-bold outline-none focus:ring-4 focus:ring-amber-100"/>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Password</label>
                  <input value={delivLogin.password} onChange={e=>setDelivLogin(p=>({...p,password:e.target.value}))} type="password" placeholder="Your password" className="w-full p-3 rounded-2xl border-2 border-amber-100 font-bold outline-none focus:ring-4 focus:ring-amber-100"/>
                </div>
                <button onClick={handleDeliveryEmailLogin} disabled={deliveryLoading}
                  className="w-full py-4 bg-amber-400 text-amber-900 rounded-2xl font-black text-lg shadow-lg disabled:opacity-50 hover:bg-amber-500 transition-all">
                  {deliveryLoading ? 'Logging in...' : 'Login to Dashboard'}
                </button>
                <button onClick={()=>setDeliveryAuthView('register')} className="w-full text-center text-amber-600 font-black text-sm hover:underline">New here? Register</button>
                <button onClick={()=>setDeliveryAuthView('landing')} className="w-full text-center text-gray-400 font-bold text-sm hover:underline">← Back</button>
              </div>
            </motion.div>
          </div>
        );
      }

      // ── Dashboard ──
      const activeOrders = deliveryOrders.filter(o => o.status !== 'Delivered');
      const completedOrders = deliveryOrders.filter(o => o.status === 'Delivered');

      return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg">
                <Truck size={24} className="text-amber-900"/>
              </div>
              <div>
                <h1 className="text-xl font-black text-amber-900">{deliveryProfile?.name}</h1>
                <p className="text-amber-700 font-bold text-xs">{deliveryProfile?.vehicle} • {deliveryProfile?.area || 'All areas'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Online toggle */}
              <button onClick={()=>toggleDeliveryOnline(!deliveryOnline)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm border transition-all ${deliveryOnline ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${deliveryOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}/>
                {deliveryOnline ? 'Online' : 'Offline'}
              </button>
              <button onClick={()=>{setSelectedRole(null);setDeliveryAuthView('landing');setDeliveryUser(null);setDeliveryProfile(null);}}
                className="p-2.5 bg-amber-400 text-amber-900 rounded-2xl">
                <LogOut size={16}/>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              {label:"Today", value:`₹${deliveryEarningsData.today}`, icon:Activity, color:'text-green-600', bg:'bg-green-50'},
              {label:'This Week', value:`₹${deliveryEarningsData.weekly}`, icon:TrendingUp, color:'text-amber-700', bg:'bg-amber-50'},
              {label:'Total Trips', value:deliveryProfile?.totalDeliveries||0, icon:BadgeCheck, color:'text-blue-600', bg:'bg-blue-50'},
            ].map((s,i)=>(
              <div key={i} className="bg-white rounded-2xl p-3 shadow-sm text-center">
                <div className={`w-8 h-8 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mx-auto mb-1.5`}><s.icon size={16}/></div>
                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] font-bold text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
            {[
              {id:'orders', label:'Active Orders', icon:Truck},
              {id:'earnings', label:'Earnings', icon:TrendingUp},
              {id:'history', label:'History', icon:History},
            ].map(tab=>(
              <button key={tab.id} onClick={()=>setDeliveryTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-all ${deliveryTab===tab.id?'bg-amber-400 text-amber-900 shadow-lg':'bg-white text-amber-700 hover:bg-amber-50 border border-amber-100'}`}>
                <tab.icon size={16}/> {tab.label}
              </button>
            ))}
          </div>

          {/* Active Orders Tab */}
          {deliveryTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="font-black text-lg text-amber-900 flex items-center gap-2"><Truck size={20}/> Active Deliveries</h2>
              {!deliveryOnline && (
                <div className="bg-white rounded-2xl p-6 text-center border border-amber-100">
                  <p className="font-black text-gray-400 text-lg">You are offline 😴</p>
                  <p className="text-sm text-gray-300 font-bold mt-1">Go online to receive delivery orders</p>
                  <button onClick={()=>toggleDeliveryOnline(true)} className="mt-4 px-6 py-3 bg-green-400 text-white rounded-2xl font-black hover:bg-green-500 transition-all">Go Online</button>
                </div>
              )}
              {deliveryOnline && activeOrders.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center border border-amber-100">
                  <p className="text-4xl mb-3">🛵</p>
                  <p className="font-black text-gray-400">Waiting for orders...</p>
                  <p className="text-xs text-gray-300 font-bold mt-1">New orders from pharmacies will appear here</p>
                </div>
              )}
              {deliveryOnline && activeOrders.map(order=>(
                <div key={order.firestoreId} className={`bg-white rounded-3xl p-5 shadow-md border-l-4 ${order.status==='Picked Up'||order.status==='On the Way'?'border-blue-400':'border-amber-400'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-black text-gray-800 text-lg">{order.patient}</p>
                      <p className="text-xs text-gray-400 font-bold">#{order.firestoreId?.slice(0,6)} • ₹{order.amount} earned ₹{order.earning||40}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-black ${order.status==='On the Way'?'bg-blue-100 text-blue-700':order.status==='Picked Up'?'bg-purple-100 text-purple-700':'bg-amber-100 text-amber-700'}`}>{order.status||'Assigned'}</span>
                  </div>
                  {/* Route cards */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-2xl">
                      <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><Store size={13} className="text-white"/></div>
                      <div>
                        <p className="text-xs font-black text-green-700 uppercase tracking-widest">Pickup from</p>
                        <p className="font-bold text-gray-700 text-sm">{order.shop}</p>
                        <p className="text-xs text-gray-400">{order.shopAddr}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center"><div className="w-0.5 h-4 bg-gray-200"/></div>
                    <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-2xl">
                      <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><MapPin size={13} className="text-white"/></div>
                      <div>
                        <p className="text-xs font-black text-amber-700 uppercase tracking-widest">Deliver to</p>
                        <p className="font-bold text-gray-700 text-sm">{order.patient}</p>
                        <p className="text-xs text-gray-400">{order.patientAddr}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-gray-500 mb-3">📦 {Array.isArray(order.medicines)?order.medicines.join(', '):order.medicines}</p>
                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${order.lat||''},${order.lng||''}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-amber-900 rounded-xl font-black text-sm hover:bg-amber-500 transition-all">
                      <Navigation2 size={14}/> Navigate
                    </a>
                    {(!order.status || order.status==='Assigned') && (
                      <button onClick={()=>updateDeliveryStatus(order.firestoreId,'Picked Up')} className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-black text-sm hover:bg-purple-200 transition-all">
                        <Package size={14}/> Picked Up
                      </button>
                    )}
                    {order.status==='Picked Up' && (
                      <button onClick={()=>updateDeliveryStatus(order.firestoreId,'On the Way')} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-black text-sm hover:bg-blue-200 transition-all">
                        <Truck size={14}/> On the Way
                      </button>
                    )}
                    {order.status==='On the Way' && (
                      <button onClick={()=>setVerifyingOtp(order.firestoreId)} className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl font-black text-sm hover:bg-green-200 transition-all">
                        <BadgeCheck size={14}/> Confirm Delivery
                      </button>
                    )}
                  </div>
                  {/* OTP verification */}
                  {verifyingOtp===order.firestoreId && (
                    <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                      <p className="font-black text-amber-800 text-sm">Enter OTP from patient to confirm delivery:</p>
                      <div className="flex gap-3">
                        <input value={deliveryProofOtp} onChange={e=>setDeliveryProofOtp(e.target.value)} placeholder="OTP" maxLength={6}
                          className="flex-1 p-3 rounded-xl border-2 border-amber-200 font-black text-center text-xl tracking-widest outline-none focus:ring-4 focus:ring-amber-200"/>
                        <button onClick={()=>verifyDeliveryOtp(order.firestoreId, order.otp||'')} className="px-5 py-3 bg-amber-400 text-amber-900 rounded-xl font-black hover:bg-amber-500 transition-all">
                          Verify
                        </button>
                      </div>
                      <button onClick={()=>{setVerifyingOtp(null);setDeliveryProofOtp('');}} className="text-xs text-gray-400 font-bold hover:underline">Cancel</button>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Earnings Tab */}
          {deliveryTab === 'earnings' && (
            <div className="space-y-4">
              <h2 className="font-black text-lg text-amber-900 flex items-center gap-2"><TrendingUp size={20}/> Earnings Summary</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                  <p className="text-3xl font-black text-green-600">₹{deliveryEarningsData.today}</p>
                  <p className="text-xs font-bold text-gray-400 mt-1">Today's Earnings</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
                  <p className="text-3xl font-black text-amber-600">₹{deliveryEarningsData.weekly}</p>
                  <p className="text-xs font-bold text-gray-400 mt-1">Total Earned</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-md">
                <h3 className="font-black text-gray-700 mb-4">Daily Breakdown</h3>
                {deliveryEarningsData.paid.length === 0 ? (
                  <p className="text-center text-gray-400 font-bold py-4">Complete deliveries to see earnings here.</p>
                ) : (
                  <div className="space-y-4">
                    {deliveryEarningsData.paid.map((day: any, i: number)=>(
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-16 text-xs font-black text-gray-400">{day.date}</div>
                        <div className="flex-1 h-3 bg-amber-50 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full transition-all" style={{width:`${Math.min(100,(day.amount/500)*100)}%`}}/>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-amber-700 text-sm">₹{day.amount}</p>
                          <p className="text-xs text-gray-400">{day.orders} orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex items-center justify-between">
                <div>
                  <p className="font-black text-amber-900">Per Delivery Rate</p>
                  <p className="text-xs text-amber-700 font-bold">Fixed rate per completed order</p>
                </div>
                <p className="text-3xl font-black text-amber-600">₹{deliveryEarningsData.perDelivery}</p>
              </div>
            </div>
          )}

          {/* History Tab */}
          {deliveryTab === 'history' && (
            <div className="space-y-4">
              <h2 className="font-black text-lg text-amber-900 flex items-center gap-2"><History size={20}/> Delivery History</h2>
              {deliveryOrders.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center border border-amber-100">
                  <p className="font-black text-gray-400">No deliveries yet.</p>
                  <p className="text-xs text-gray-300 mt-1">Go online and complete your first delivery!</p>
                </div>
              )}
              <div className="space-y-3">
                {deliveryOrders.map(order=>(
                  <div key={order.firestoreId} className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-gray-800">{order.patient}</p>
                        <p className="text-xs text-amber-600 font-bold">{order.patientAddr}</p>
                        <p className="text-xs text-gray-400 mt-0.5">#{order.firestoreId?.slice(0,6)} • {order.shop}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-amber-700">₹{order.earning||deliveryEarningsData.perDelivery}</p>
                        <span className={`text-xs px-2 py-1 rounded-full font-black ${order.status==='Delivered'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{order.status||'Assigned'}</span>
                      </div>
                    </div>
                    {order.deliveredAt && <p className="text-xs text-gray-300 font-bold mt-1">Delivered: {new Date(order.deliveredAt).toLocaleString()}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    // ── End Delivery Partner Dashboard ────────────────────────────────

    // ── Admin Dashboard ───────────────────────────────────────────────
    if (selectedRole === 'admin') {
      const AC = '#9598C9';
      const ACLight = '#F0F0F9';
      const ACDark = '#6366a8';

      // ── Admin Login ──
      if (adminAuthView === 'login') {
        return (
          <div className="min-h-screen flex items-center justify-center p-4" style={{background:`linear-gradient(135deg,${ACLight},#fff)`}}>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-md">
              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-white">
                <div className="p-10 text-center text-white" style={{background:`linear-gradient(135deg,${AC},${ACDark})`}}>
                  <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <ShieldCheck size={42} className="text-white"/>
                  </div>
                  <h1 className="text-3xl font-black tracking-tight">Admin Portal</h1>
                  <p className="text-white/70 font-bold text-sm mt-1">District Health Command Center</p>
                </div>
                <div className="p-8 space-y-4">
                  {adminAuthError && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-bold">{adminAuthError}</div>}
                  <div className="p-3 rounded-2xl text-sm font-bold flex items-center gap-2" style={{backgroundColor:ACLight, color:ACDark}}>
                    <ShieldCheck size={16}/> Restricted access — authorized officers only
                  </div>
                  <button onClick={handleAdminGoogleLogin} disabled={adminLoading}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 rounded-2xl font-black text-gray-700 hover:opacity-90 transition-all shadow-md" style={{borderColor:AC}}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6"/> Login with Google
                  </button>
                  <div className="flex items-center gap-3"><div className="flex-1 h-px bg-gray-100"/><span className="text-sm font-bold text-gray-400">OR</span><div className="flex-1 h-px bg-gray-100"/></div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Email</label>
                    <input value={adminLogin.email} onChange={e=>setAdminLogin(p=>({...p,email:e.target.value}))} type="email" placeholder="admin@district.gov.in"
                      className="w-full p-3 rounded-2xl border-2 font-bold outline-none focus:ring-4" style={{borderColor:`${AC}40`}}/>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Password</label>
                    <input value={adminLogin.password} onChange={e=>setAdminLogin(p=>({...p,password:e.target.value}))} type="password" placeholder="••••••••"
                      className="w-full p-3 rounded-2xl border-2 font-bold outline-none focus:ring-4" style={{borderColor:`${AC}40`}}/>
                  </div>
                  <button onClick={handleAdminEmailLogin} disabled={adminLoading}
                    className="w-full py-4 rounded-2xl font-black text-white text-lg shadow-lg disabled:opacity-50 transition-all" style={{backgroundColor:AC}}>
                    {adminLoading ? 'Verifying...' : 'Login to Command Center'}
                  </button>
                  <button onClick={()=>setSelectedRole(null)} className="w-full text-center text-gray-400 font-bold text-sm hover:underline">← Back to roles</button>
                </div>
              </div>
            </motion.div>
          </div>
        );
      }

      // ── Admin Dashboard ──
      const totalUsers = adminAshaWorkers.length + adminPharmacies.length + adminDeliveryPartners.length;
      const pendingPayouts = adminDeliveryPartners.filter(d => !d.payoutApproved && (d.totalEarnings || 0) > 0);
      const lowStockFacilities = adminFacilities.filter(f => f.stock === 'Low');

      return (
        <div className="min-h-screen p-4 md:p-6" style={{backgroundColor:ACLight}}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{backgroundColor:AC}}>
                <ShieldCheck size={28} className="text-white"/>
              </div>
              <div>
                <h1 className="text-2xl font-black" style={{color:ACDark}}>Admin Command Center</h1>
                <p className="font-bold text-sm text-gray-500">{adminUser?.email} • District Health Officer</p>
              </div>
            </div>
            <button onClick={()=>{setSelectedRole(null);setAdminAuthView('login');setAdminUser(null);}}
              className="p-3 rounded-2xl font-black text-sm flex items-center gap-2 text-white" style={{backgroundColor:AC}}>
              <LogOut size={18}/> Exit
            </button>
          </div>

          {/* KPI Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              {label:'Total Users', value:totalUsers, icon:Users, sub:'Registered accounts'},
              {label:'ASHA Workers', value:adminAshaWorkers.length, icon:Stethoscope, sub:'Active in field'},
              {label:'Pharmacies', value:adminPharmacies.length, icon:Store, sub:'Partner shops'},
              {label:'Pending Payouts', value:pendingPayouts.length, icon:Activity, sub:'Delivery partners'},
            ].map((s,i)=>(
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{backgroundColor:ACLight}}>
                    <s.icon size={18} style={{color:AC}}/>
                  </div>
                  <p className="text-2xl font-black text-gray-800">{s.value}</p>
                </div>
                <p className="text-xs font-black text-gray-600">{s.label}</p>
                <p className="text-xs text-gray-400">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {[
              {id:'overview', label:'Overview', icon:LayoutDashboard},
              {id:'users', label:'Users', icon:Users},
              {id:'facilities', label:'Facilities', icon:Building2},
              {id:'analytics', label:'Analytics', icon:TrendingUp},
              {id:'supply', label:'Supply Chain', icon:Package},
              {id:'payments', label:'Payments', icon:BadgeCheck},
              {id:'broadcast', label:'Broadcast', icon:Send},
              {id:'reports', label:'Reports', icon:FileText},
            ].map(tab=>(
              <button key={tab.id} onClick={()=>setAdminTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs whitespace-nowrap transition-all ${adminTab===tab.id?'text-white shadow-md':'bg-white text-gray-500 hover:opacity-90 border border-white'}`}
                style={adminTab===tab.id?{backgroundColor:AC}:{}}>
                <tab.icon size={14}/> {tab.label}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {adminTab === 'overview' && (
            <div className="space-y-5">
              {/* Escalations */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="font-black text-lg mb-4 flex items-center gap-2" style={{color:ACDark}}><AlertTriangle size={20}/> Active Escalations</h2>
                {adminEscalations.length === 0 ? (
                  <p className="text-gray-400 font-bold text-sm text-center py-4">No escalations. All clear ✅</p>
                ) : (
                  <div className="space-y-3">
                    {adminEscalations.slice(0,5).map((e:any,i:number)=>(
                      <div key={i} className="p-4 rounded-2xl border-l-4 border-red-400 bg-red-50 flex justify-between items-start">
                        <div>
                          <p className="font-black text-gray-800">{e.asha_name || 'ASHA Worker'}</p>
                          <p className="text-sm text-gray-600 font-medium mt-0.5">{e.message}</p>
                          <p className="text-xs text-gray-400 mt-1">Target: {e.target?.toUpperCase()} • {e.created_at}</p>
                        </div>
                        <span className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full font-black">🚨 Urgent</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outbreak detection */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="font-black text-lg mb-4 flex items-center gap-2" style={{color:ACDark}}><AlertCircle size={20}/> Outbreak Detection</h2>
                <div className="space-y-3">
                  {[
                    {zone:'Village North', symptom:'Fever + Chills', cases:7, flag:'Medium', color:'bg-yellow-100 text-yellow-700 border-yellow-300'},
                    {zone:'Ward 3, Jaipur', symptom:'Diarrhoea', cases:12, flag:'High', color:'bg-red-100 text-red-700 border-red-300'},
                    {zone:'Village South', symptom:'Respiratory', cases:3, flag:'Low', color:'bg-green-100 text-green-700 border-green-300'},
                  ].map((o,i)=>(
                    <div key={i} className={`p-4 rounded-2xl border flex justify-between items-center ${o.color}`}>
                      <div>
                        <p className="font-black text-gray-800">{o.zone}</p>
                        <p className="text-sm font-bold">{o.symptom} — {o.cases} reported cases</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-black border ${o.color}`}>{o.flag} Risk</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facility quick view */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="font-black text-lg mb-4 flex items-center gap-2" style={{color:ACDark}}><Building2 size={20}/> Facility Status</h2>
                <div className="space-y-3">
                  {adminFacilities.map(f=>(
                    <div key={f.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div>
                        <p className="font-black text-gray-800">{f.name}</p>
                        <p className="text-xs text-gray-400 font-bold">{f.type} • {f.district} • Beds: {f.bedsAvail}/{f.beds}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-black ${f.stock==='Low'?'bg-orange-100 text-orange-600':'bg-green-100 text-green-700'}`}>Stock: {f.stock}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {adminTab === 'users' && (
            <div className="space-y-5">
              {!adminDataLoaded && <div className="text-center py-8 font-black text-gray-400">Loading user data...</div>}

              {/* ASHA Workers */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="font-black text-lg mb-4 flex items-center gap-2" style={{color:ACDark}}><Stethoscope size={20}/> ASHA Workers ({adminAshaWorkers.length})</h2>
                {adminAshaWorkers.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">No ASHA workers registered yet.</p> : (
                  <div className="space-y-2">
                    {adminAshaWorkers.map((w:any)=>(
                      <div key={w.firestoreId} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{backgroundColor:AC}}>{w.name?.[0]||'A'}</div>
                          <div>
                            <p className="font-black text-gray-800">{w.name}</p>
                            <p className="text-xs text-gray-400 font-bold">{w.email} • {w.district}</p>
                          </div>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-black">Active</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pharmacies */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="font-black text-lg mb-4 flex items-center gap-2" style={{color:ACDark}}><Store size={20}/> Pharmacies ({adminPharmacies.length})</h2>
                {adminPharmacies.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">No pharmacies registered yet.</p> : (
                  <div className="space-y-2">
                    {adminPharmacies.map((p:any)=>(
                      <div key={p.firestoreId} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                        <div>
                          <p className="font-black text-gray-800">{p.shopName}</p>
                          <p className="text-xs text-gray-400 font-bold">{p.ownerName} • {p.phone} • {p.district}</p>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-black ${p.verified?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{p.verified?'Verified':'Pending'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery Partners */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="font-black text-lg mb-4 flex items-center gap-2" style={{color:ACDark}}><Truck size={20}/> Delivery Partners ({adminDeliveryPartners.length})</h2>
                {adminDeliveryPartners.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">No delivery partners registered yet.</p> : (
                  <div className="space-y-2">
                    {adminDeliveryPartners.map((d:any)=>(
                      <div key={d.firestoreId} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50">
                        <div>
                          <p className="font-black text-gray-800">{d.name}</p>
                          <p className="text-xs text-gray-400 font-bold">{d.vehicle} • {d.area} • ₹{d.totalEarnings||0} earned</p>
                        </div>
                        <div className={`w-2.5 h-2.5 rounded-full ${d.online?'bg-green-500':'bg-gray-300'}`}/>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FACILITIES TAB */}
          {adminTab === 'facilities' && (
            <div className="space-y-4">
              <h2 className="font-black text-lg flex items-center gap-2" style={{color:ACDark}}><Building2 size={20}/> Facility Management</h2>
              {adminFacilities.map(f=>(
                <div key={f.id} className="bg-white rounded-3xl p-6 shadow-sm">
                  {editingFacility?.id === f.id ? (
                    <div className="space-y-3">
                      <p className="font-black" style={{color:ACDark}}>{f.name}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {label:'Total Beds', key:'beds'}, {label:'Available Beds', key:'bedsAvail'},
                          {label:'Total Doctors', key:'doctors'}, {label:'Available Doctors', key:'doctorsAvail'},
                        ].map(({label,key})=>(
                          <div key={key}>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{label}</label>
                            <input type="number" value={editingFacility[key]} onChange={e=>setEditingFacility((p:any)=>({...p,[key]:parseInt(e.target.value)||0}))}
                              className="w-full p-3 rounded-2xl border-2 font-bold outline-none" style={{borderColor:`${AC}50`}}/>
                          </div>
                        ))}
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Stock Status</label>
                          <select value={editingFacility.stock} onChange={e=>setEditingFacility((p:any)=>({...p,stock:e.target.value}))}
                            className="w-full p-3 rounded-2xl border-2 font-bold outline-none" style={{borderColor:`${AC}50`}}>
                            <option>Good</option><option>Low</option><option>Critical</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={()=>updateFacility(f.id, editingFacility)} className="flex-1 py-3 rounded-2xl font-black text-white" style={{backgroundColor:AC}}>Save Changes</button>
                        <button onClick={()=>setEditingFacility(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-black">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-black text-gray-800 text-lg">{f.name}</p>
                          <p className="text-xs font-bold text-gray-400">{f.type} • {f.district}</p>
                        </div>
                        <button onClick={()=>setEditingFacility({...f})} className="px-4 py-2 rounded-xl font-black text-sm text-white" style={{backgroundColor:AC}}>Edit</button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          {label:'Beds', value:`${f.bedsAvail}/${f.beds}`, color:'text-blue-600'},
                          {label:'Doctors', value:`${f.doctorsAvail}/${f.doctors}`, color:'text-green-600'},
                          {label:'Medicine Stock', value:f.stock, color:f.stock==='Low'?'text-orange-500':'text-green-600'},
                        ].map((s,i)=>(
                          <div key={i} className="bg-gray-50 rounded-2xl p-3 text-center">
                            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                            <p className="text-xs font-bold text-gray-400">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ANALYTICS TAB */}
          {adminTab === 'analytics' && (
            <div className="space-y-5">
              <h2 className="font-black text-lg flex items-center gap-2" style={{color:ACDark}}><TrendingUp size={20}/> Health Analytics</h2>
              {/* Disease burden */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h3 className="font-black text-gray-700 mb-4">Disease Burden by Village</h3>
                <div className="space-y-3">
                  {[
                    {village:'Village North', fever:18, diarrhoea:5, respiratory:8},
                    {village:'Village South', fever:9, diarrhoea:12, respiratory:3},
                    {village:'Village East', fever:6, diarrhoea:4, respiratory:14},
                    {village:'Ward 3, Jaipur', fever:22, diarrhoea:19, respiratory:7},
                  ].map((row,i)=>(
                    <div key={i} className="p-4 rounded-2xl bg-gray-50">
                      <p className="font-black text-gray-700 mb-2">{row.village}</p>
                      <div className="flex gap-3 text-xs">
                        {[{l:'Fever', v:row.fever, c:'bg-red-400'},{l:'Diarrhoea', v:row.diarrhoea, c:'bg-yellow-400'},{l:'Respiratory', v:row.respiratory, c:'bg-blue-400'}].map((d,j)=>(
                          <div key={j} className="flex-1">
                            <div className="flex justify-between mb-1"><span className="font-bold text-gray-500">{d.l}</span><span className="font-black">{d.v}</span></div>
                            <div className="h-2 bg-gray-100 rounded-full"><div className={`h-full ${d.c} rounded-full`} style={{width:`${Math.min(100,d.v*3)}%`}}/></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Performance metrics */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h3 className="font-black text-gray-700 mb-4">System Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {label:'Referral Success Rate', value:'78%', icon:ArrowRight, color:'text-green-600', bg:'bg-green-50'},
                    {label:'Delivery Completion', value:'91%', icon:Truck, color:'text-blue-600', bg:'bg-blue-50'},
                    {label:'Vaccination Coverage', value:'84%', icon:CheckCircle2, color:'text-purple-600', bg:'bg-purple-50'},
                    {label:'ASHA Visit Rate', value:'93%', icon:Stethoscope, color:'text-amber-600', bg:'bg-amber-50'},
                  ].map((m,i)=>(
                    <div key={i} className="p-5 rounded-2xl text-center" style={{backgroundColor:m.bg.replace('bg-','').includes('50')?undefined:undefined}}>
                      <div className={`w-10 h-10 ${m.bg} ${m.color} rounded-2xl flex items-center justify-center mx-auto mb-2`}><m.icon size={18}/></div>
                      <p className={`text-3xl font-black ${m.color}`}>{m.value}</p>
                      <p className="text-xs font-bold text-gray-400 mt-1">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* ASHA performance */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h3 className="font-black text-gray-700 mb-4">ASHA Worker Performance</h3>
                {adminAshaWorkers.length === 0 ? <p className="text-gray-400 text-sm text-center">No ASHA workers registered yet.</p> : (
                  <div className="space-y-3">
                    {adminAshaWorkers.map((w:any,i:number)=>(
                      <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black" style={{backgroundColor:AC}}>{w.name?.[0]||'A'}</div>
                        <div className="flex-1">
                          <p className="font-black text-gray-800">{w.name}</p>
                          <p className="text-xs text-gray-400">{w.district}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm" style={{color:AC}}>{12+i*3} visits</p>
                          <p className="text-xs text-gray-400">{3+i} referrals</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUPPLY CHAIN TAB */}
          {adminTab === 'supply' && (
            <div className="space-y-5">
              <h2 className="font-black text-lg flex items-center gap-2" style={{color:ACDark}}><Package size={20}/> Medicine Supply Chain</h2>
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h3 className="font-black text-gray-700 mb-4">Pharmacy Stock Overview</h3>
                {adminPharmacies.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">No pharmacies registered yet.</p> : (
                  <div className="space-y-3">
                    {adminPharmacies.map((p:any)=>(
                      <div key={p.firestoreId} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-black text-gray-800">{p.shopName}</p>
                            <p className="text-xs text-gray-400">{p.address} • {p.phone}</p>
                          </div>
                          <span className="text-xs font-black px-3 py-1 rounded-full" style={{backgroundColor:ACLight, color:ACDark}}>Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h3 className="font-black text-gray-700 mb-4">Low Stock Alerts</h3>
                {lowStockFacilities.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">All facilities are adequately stocked ✅</p>
                ) : (
                  <div className="space-y-3">
                    {lowStockFacilities.map(f=>(
                      <div key={f.id} className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex justify-between items-center">
                        <div>
                          <p className="font-black text-gray-800">{f.name}</p>
                          <p className="text-xs text-orange-600 font-bold">Stock: {f.stock} — Reorder needed</p>
                        </div>
                        <button className="text-xs px-3 py-2 rounded-xl font-black text-white" style={{backgroundColor:AC}}>Reorder</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAYMENTS TAB */}
          {adminTab === 'payments' && (
            <div className="space-y-5">
              <h2 className="font-black text-lg flex items-center gap-2" style={{color:ACDark}}><BadgeCheck size={20}/> Payment Management</h2>
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h3 className="font-black text-gray-700 mb-4">Delivery Partner Payouts</h3>
                {adminDeliveryPartners.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">No delivery partners registered yet.</p> : (
                  <div className="space-y-3">
                    {adminDeliveryPartners.map((d:any)=>(
                      <div key={d.firestoreId} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black" style={{backgroundColor:AC}}>{d.name?.[0]||'D'}</div>
                          <div>
                            <p className="font-black text-gray-800">{d.name}</p>
                            <p className="text-xs text-gray-400">{d.totalDeliveries||0} deliveries • ₹{d.totalEarnings||0} total</p>
                          </div>
                        </div>
                        {d.payoutApproved ? (
                          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-black flex items-center gap-1"><CheckCircle2 size={11}/> Approved</span>
                        ) : (
                          <button onClick={()=>approveDeliveryPayout(d.firestoreId)}
                            className="text-xs px-4 py-2 rounded-xl font-black text-white transition-all hover:opacity-90" style={{backgroundColor:AC}}>
                            Approve ₹{d.totalEarnings||0}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BROADCAST TAB */}
          {adminTab === 'broadcast' && (
            <div className="space-y-5">
              <h2 className="font-black text-lg flex items-center gap-2" style={{color:ACDark}}><Send size={20}/> Broadcast Health Advisory</h2>
              <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Send To</label>
                  <div className="flex gap-2">
                    {(['all','asha','patients'] as const).map(t=>(
                      <button key={t} onClick={()=>setAdminBroadcastTarget(t)}
                        className={`flex-1 py-3 rounded-2xl font-black text-sm capitalize transition-all ${adminBroadcastTarget===t?'text-white shadow-md':'bg-gray-100 text-gray-500'}`}
                        style={adminBroadcastTarget===t?{backgroundColor:AC}:{}}>
                        {t==='all'?'Everyone':t==='asha'?'ASHA Workers':'Patients'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Health Advisory Message</label>
                  <textarea value={adminBroadcastMsg} onChange={e=>setAdminBroadcastMsg(e.target.value)} rows={5}
                    className="w-full p-4 rounded-2xl border-2 font-medium resize-none outline-none focus:ring-4" style={{borderColor:`${AC}40`}}
                    placeholder="e.g. Dengue alert in Ward 3. All residents advised to use mosquito nets and avoid stagnant water. Contact your ASHA worker immediately if you have fever..."/>
                </div>
                <button onClick={sendAdminBroadcast} disabled={!adminBroadcastMsg.trim()}
                  className="w-full py-4 rounded-2xl font-black text-white text-lg shadow-lg disabled:opacity-40 transition-all flex items-center justify-center gap-3" style={{backgroundColor:AC}}>
                  <Send size={20}/> Send Advisory
                </button>
                <AnimatePresence>
                  {adminBroadcastSent && (
                    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="p-4 bg-green-50 border border-green-200 rounded-2xl text-center">
                      <p className="font-black text-green-700">✅ Advisory broadcast successfully!</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {adminTab === 'reports' && (
            <div className="space-y-5">
              <h2 className="font-black text-lg flex items-center gap-2" style={{color:ACDark}}><FileText size={20}/> Government Reports (NHM-Compatible)</h2>
              <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
                <p className="text-sm text-gray-500 font-bold">Export data in CSV format compatible with National Health Mission reporting requirements.</p>
                <div className="space-y-3">
                  {[
                    {label:'ASHA Worker Performance Report', desc:'Visits, referrals, outcomes per worker', data:adminAshaWorkers, file:'asha_performance_report.csv'},
                    {label:'Pharmacy & Medicine Supply Report', desc:'Stock levels, orders, low-stock alerts', data:adminPharmacies, file:'pharmacy_supply_report.csv'},
                    {label:'Delivery Partner Report', desc:'Deliveries completed, earnings, performance', data:adminDeliveryPartners, file:'delivery_report.csv'},
                    {label:'Facility Status Report', desc:'Bed availability, doctor count, stock status', data:adminFacilities, file:'facility_status_report.csv'},
                  ].map((r,i)=>(
                    <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 border border-gray-100">
                      <div>
                        <p className="font-black text-gray-800">{r.label}</p>
                        <p className="text-xs text-gray-400 font-bold mt-0.5">{r.desc}</p>
                      </div>
                      <button onClick={()=>exportCSV(r.data, r.file)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm text-white ml-4 flex-shrink-0 transition-all hover:opacity-90" style={{backgroundColor:AC}}>
                        <FileText size={14}/> Export
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-2xl text-sm font-bold flex items-start gap-2" style={{backgroundColor:ACLight, color:ACDark}}>
                  <Info size={16} className="flex-shrink-0 mt-0.5"/>
                  Reports exported as CSV are compatible with NHM HMIS portal. Ensure internet connectivity before uploading.
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    // ── End Admin Dashboard ───────────────────────────────────────────
    // ── End Delivery Boy Dashboard ────────────────────────────────────

    if (!user) {
      if (!selectedRole) {
        return (
          <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 py-12 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-12 w-full max-w-4xl"
            >
              <div className="flex flex-col items-center gap-4">
                <Logo className="w-24 h-24 md:w-32 md:h-32" />
                <h1 className="text-5xl md:text-7xl font-black text-[#6B46C1] tracking-tighter leading-none">
                  Pragati<span className="text-[#9575CD]">Path</span>
                </h1>
                <p className="text-xl font-bold text-gray-500">Select your role to continue</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full">
                {roles.map((role) => (
                  <motion.button
                    key={role.id}
                    whileHover={{ scale: 1.05, translateY: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (role.id === 'patient') {
                        setSelectedRole(role.id);
                      } else if (role.id === 'asha_worker') {
                        setSelectedRole('asha_worker');
                        setAshaView('role_select');
                      } else if (role.id === 'pharmacy') {
                        setSelectedRole('pharmacy');
                      } else if (role.id === 'delivery') {
                        setSelectedRole('delivery');
                      } else if (role.id === 'admin') {
                        setSelectedRole('admin');
                        setAdminAuthView('login');
                      } else {
                        alert(`${role.title} module is coming soon!`);
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-6 rounded-[2.5rem] shadow-xl bg-white border-2 border-transparent hover:border-purple-200 transition-all group`}
                  >
                    <div className={`w-16 h-16 ${role.color} ${role.iconColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <role.icon size={32} />
                    </div>
                    <span className="font-black text-gray-700 text-sm uppercase tracking-wider">{role.title}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        );
      }

      return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 py-12 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-8 max-w-2xl"
          >
            <button 
              onClick={() => setSelectedRole(null)}
              className="absolute top-0 left-0 m-8 p-3 bg-white rounded-2xl shadow-lg text-purple-600 hover:bg-purple-50 transition-all flex items-center gap-2 font-black text-sm uppercase tracking-widest"
            >
              <ChevronLeft size={20} />
              Back to Roles
            </button>

            <Logo className="w-32 h-32 md:w-48 md:h-48" />
            <div>
              <h1 className="text-6xl md:text-8xl font-black text-[#6B46C1] tracking-tighter leading-none">
                Pragati<span className="text-[#9575CD]">Path</span>
              </h1>
              <p className="text-xl md:text-2xl font-bold text-gray-500 mt-4">Patient / User Login</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 mt-8 w-full max-w-md">
              <button 
                onClick={handleGoogleLogin}
                className="flex-1 px-8 py-5 bg-white border-2 border-purple-100 text-[#6B46C1] rounded-3xl font-black text-xl shadow-2xl shadow-purple-100/50 hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-8 h-8" alt="Google" />
                Login with Google
              </button>
              <button 
                onClick={() => setActivePopup('phoneLogin')}
                className="flex-1 px-8 py-5 bg-[#6B46C1] text-white rounded-3xl font-black text-xl shadow-2xl shadow-purple-200 hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                <Phone size={28} />
                Phone OTP Login
              </button>
            </div>
            <p className="text-gray-400 font-bold mt-8">Secure access to your health records and community services.</p>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-12 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
          <div className="flex items-center gap-6">
            <Logo className="w-20 h-20 md:w-24 md:h-24" />
            <div>
              <h1 className="text-5xl md:text-7xl font-black text-[#6B46C1] tracking-tighter leading-none">
                Pragati<span className="text-[#9575CD]">Path</span>
              </h1>
              <p className="text-lg md:text-xl font-bold text-gray-500 mt-2">Digital Health & Education for Villages</p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Welcome back</p>
                <p className="text-xl font-black text-[#6B46C1]">{profile?.fullName || user.displayName || 'User'}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-4 bg-white border-2 border-red-50 text-red-400 rounded-2xl hover:bg-red-50 transition-all shadow-lg shadow-red-100"
              >
                <LogOut size={24} />
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {menuItems.map((item, idx) => (
            <MenuCard key={idx} {...item} />
          ))}
        </div>

        <footer className="mt-24 text-center space-y-4">
          <div className="flex justify-center gap-8 text-gray-400 font-bold text-sm uppercase tracking-widest">
            <a href="#" className="hover:text-[#6B46C1] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#6B46C1] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#6B46C1] transition-colors">Contact Support</a>
          </div>
          <p className="text-gray-400 font-medium">© 2026 PragatiPath. Empowering Rural Communities.</p>
        </footer>
      </div>
    );
  };

  useEffect(() => {
    if (activePopup === 'generalHealth' && !userLocation) {
      detectLocation();
    }
  }, [activePopup]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d.toFixed(1);
  };

  const fetchOverpass = async (query: string, retries = 3, delay = 2000): Promise<any> => {
    const mirrors = [
      "https://overpass-api.de/api/interpreter",
      "https://lz4.overpass-api.de/api/interpreter",
      "https://z.overpass-api.de/api/interpreter",
      "https://overpass.n.osm.ch/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.openstreetmap.ru/cgi/interpreter"
    ];

    let lastError: any = null;

    for (let i = 0; i < retries; i++) {
      for (const mirror of mirrors) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout per mirror attempt

        try {
          const response = await fetch(`${mirror}?data=${encodeURIComponent(query)}`, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (response.status === 429) {
            console.warn(`Overpass API 429 (Too Many Requests) from ${mirror}. Retrying...`);
            continue; 
          }

          if (response.status === 504 || response.status === 503) {
            console.warn(`Overpass API ${response.status} (Timeout/Service Unavailable) from ${mirror}. Trying next mirror...`);
            continue;
          }

          if (!response.ok) {
            throw new Error(`Overpass API returned status ${response.status} from ${mirror}`);
          }

          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error(`Invalid response format from ${mirror}`);
          }

          return await response.json();
        } catch (err: any) {
          clearTimeout(timeoutId);
          lastError = err;
          if (err.name === 'AbortError') {
            console.warn(`Overpass API request timed out for ${mirror}`);
          } else {
            console.error(`Error fetching from ${mirror}:`, err);
          }
        }
      }
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }

    throw lastError || new Error("Failed to fetch from all Overpass mirrors");
  };

  const fetchNearbyHealthcare = async (lat: number, lon: number, radius: number = 3000) => {
    setIsFetchingNearby(true);
    const query = `
      [out:json][timeout:60][maxsize:2000000];
      (
        node["amenity"~"hospital|pharmacy|clinic|doctors|health_specialty"](around:${radius},${lat},${lon});
        way["amenity"~"hospital|pharmacy|clinic|doctors|health_specialty"](around:${radius},${lat},${lon});
      );
      out center;
    `;

    try {
      const data = await fetchOverpass(query);
      const elements = data.elements || [];
      
      const hospitalsList: any[] = [];
      const pharmaciesList: any[] = [];
      const clinicsList: any[] = [];

      elements.forEach((el: any) => {
        if (!el.tags || !el.tags.name) return;
        
        const item = {
          name: el.tags.name,
          nameHi: el.tags['name:hi'] || el.tags['name:ne'] || el.tags['name:mr'] || null,
          address: el.tags['addr:full'] || 
                   (el.tags['addr:street'] ? `${el.tags['addr:street']}${el.tags['addr:city'] ? ', ' + el.tags['addr:city'] : ''}` : 'Address not available'),
          addressHi: el.tags['addr:full:hi'] || el.tags['addr:street:hi'] || null,
          lat: el.lat || (el.center ? el.center.lat : null),
          lon: el.lon || (el.center ? el.center.lon : null),
          type: el.tags.amenity
        };

        if (!item.lat || !item.lon) return;

        const dist = calculateDistance(lat, lon, item.lat, item.lon);
        const finalItem = { ...item, distance: dist };

        if (el.tags.amenity === 'hospital') {
          hospitalsList.push(finalItem);
        } else if (el.tags.amenity === 'pharmacy') {
          pharmaciesList.push(finalItem);
        } else {
          clinicsList.push(finalItem);
        }
      });

      setNearbyHospitals(hospitalsList.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)));
      setNearbyPharmacies(pharmaciesList.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)));
      setNearbyClinics(clinicsList.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)));
      setHospitalsLimit(5);
      setPharmaciesLimit(5);
      setClinicsLimit(5);
      
    } catch (err) {
      console.error("Overpass API Error:", err);
    } finally {
      setIsFetchingNearby(false);
    }
  };

  const fetchNearbyEducation = async (lat: number, lon: number, radius: number = 5000) => {
    setIsFetchingShiksha(true);
    const query = `
      [out:json][timeout:60][maxsize:2000000];
      (
        nwr["amenity"~"school|college|university|kindergarten|language_school|music_school|driving_school|training|tutor"](around:${radius},${lat},${lon});
        nwr["building"~"school|university|college"](around:${radius},${lat},${lon});
        nwr["office"="tutor"](around:${radius},${lat},${lon});
      );
      out center;
    `;

    try {
      const data = await fetchOverpass(query);
      const elements = data.elements || [];
      
      const schoolsList: any[] = [];
      const higherEdList: any[] = [];
      const earlyChildhoodList: any[] = [];
      const coachingList: any[] = [];
      const tutorsList: any[] = [];

      elements.forEach((el: any) => {
        if (!el.tags || !el.tags.name) return;
        
        const affiliation = el.tags.operator || el.tags.description || el.tags.brand || '';
        let affiliationType = 'Check Official Website';
        const affLower = affiliation.toLowerCase();
        if (affLower.includes('cbse')) affiliationType = 'CBSE';
        else if (affLower.includes('icse')) affiliationType = 'ICSE';
        else if (affLower.includes('government') || affLower.includes('govt')) affiliationType = 'Government';
        else if (affLower.includes('state board')) affiliationType = 'State Board';

        // Detect level from tags
        let detectedLevel = 'School';
        if (el.tags.amenity === 'university') detectedLevel = 'University';
        else if (el.tags.amenity === 'college') detectedLevel = 'College';
        else if (el.tags.amenity === 'kindergarten') detectedLevel = 'Kindergarten';
        else if (el.tags.education_level === 'primary') detectedLevel = 'Primary School';
        else if (el.tags.education_level === 'secondary') detectedLevel = 'Secondary School';
        else if (el.tags.amenity === 'language_school') detectedLevel = 'Language Learning';
        else if (el.tags.amenity === 'music_school') detectedLevel = 'Music Education';
        else if (el.tags.amenity === 'driving_school') detectedLevel = 'Driving School';
        else if (el.tags.amenity === 'training') detectedLevel = 'Vocational Training';
        else if (el.tags.amenity === 'tutor' || el.tags.office === 'tutor') detectedLevel = 'Private Tutor';

        const item = {
          name: el.tags.name,
          nameHi: el.tags['name:hi'] || null,
          type: el.tags.amenity || el.tags.office,
          level: detectedLevel,
          affiliation: affiliationType,
          website: el.tags.website || el.tags.contact_website || null,
          address: el.tags['addr:full'] || 
                   (el.tags['addr:street'] ? `${el.tags['addr:street']}${el.tags['addr:city'] ? ', ' + el.tags['addr:city'] : ''}` : 'Address not available'),
          lat: el.lat || (el.center ? el.center.lat : null),
          lon: el.lon || (el.center ? el.center.lon : null),
          subject: el.tags.subject || el.tags.description || null,
          qualification: el.tags.qualification || el.tags.degree || null,
        };

        if (!item.lat || !item.lon) return;

        const dist = calculateDistance(lat, lon, item.lat, item.lon);
        const finalItem = { ...item, distance: dist };

        if (el.tags.amenity === 'school') {
          schoolsList.push(finalItem);
        } else if (el.tags.amenity === 'college' || el.tags.amenity === 'university') {
          higherEdList.push(finalItem);
        } else if (el.tags.amenity === 'kindergarten') {
          earlyChildhoodList.push(finalItem);
        } else if (['language_school', 'music_school', 'driving_school', 'training'].includes(el.tags.amenity)) {
          coachingList.push(finalItem);
        } else if (el.tags.amenity === 'tutor' || el.tags.office === 'tutor') {
          tutorsList.push(finalItem);
        }
      });

      setNearbySchoolsRaw(schoolsList.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)));
      setNearbyHigherEdRaw(higherEdList.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)));
      setNearbyEarlyChildhoodRaw(earlyChildhoodList.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)));
      setNearbyCoachingRaw(coachingList.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)));
      setNearbyTutorsRaw(tutorsList.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)));
      
    } catch (err) {
      console.error("Overpass API Error (Education):", err);
      setShikshaLocationError("Failed to fetch data from OpenStreetMap. Please try again later.");
    } finally {
      setIsFetchingShiksha(false);
    }
  };

  const detectShikshaLocation = async () => {
    setIsLocatingShiksha(true);
    setShikshaLocationError(null);
    try {
      const location = await getPersistentLocation();
      setUserLocation(location);
      fetchNearbyEducation(location.lat, location.lng, shikshaRadius);
      setShikshaView('list');
    } catch (err: any) {
      setShikshaLocationError(err.message || "Could not detect location");
    } finally {
      setIsLocatingShiksha(false);
    }
  };

  const manualShikshaSearch = async () => {
    if (!shikshaManualLocation) return;
    setIsFetchingShiksha(true);
    try {
      // Use Nominatim to geocode the manual location
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(shikshaManualLocation)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        fetchNearbyEducation(parseFloat(lat), parseFloat(lon), shikshaRadius);
        setShikshaView('list');
      } else {
        setShikshaLocationError("Location not found. Please try another city or pin code.");
      }
    } catch (err) {
      setShikshaLocationError("Error searching for location.");
    } finally {
      setIsFetchingShiksha(false);
    }
  };

  const expandShikshaSearch = () => {
    const newRadius = 15000;
    setShikshaRadius(newRadius);
    if (userLocation) {
      fetchNearbyEducation(userLocation.lat, userLocation.lng, newRadius);
    }
  };

  const fetchNearbyCommunity = async (lat: number, lon: number, radius: number = 5000, autoExpand = true) => {
    setIsFetchingSamuday(true);
    const query = `
      [out:json][timeout:60][maxsize:2000000];
      (
        nwr["amenity"~"community_centre|social_facility|training|college|school|language_school|music_school|driving_school|library|townhall|public_service"](around:${radius},${lat},${lon});
        nwr["office"~"ngo|foundation|association|tutor|charity|non_profit|social_service|employment"](around:${radius},${lat},${lon});
        nwr["building"~"community_centre|training|civic|public"](around:${radius},${lat},${lon});
        nwr["social_facility"~"community_centre|training|workshop|outreach|group_home|shelter"](around:${radius},${lat},${lon});
        nwr["leisure"="community_centre"](around:${radius},${lat},${lon});
      );
      out center;
    `;

    try {
      const data = await fetchOverpass(query);
      const elements = data.elements || [];
      
      const centresList: any[] = [];

      elements.forEach((el: any) => {
        if (!el.tags || !el.tags.name) return;
        
        const name = el.tags.name;
        const nameLower = name.toLowerCase();
        const tags = el.tags;
        let category = 'Community Development Centres';
        
        const isComputer = nameLower.includes('computer') || nameLower.includes('digital') || nameLower.includes('it training') || nameLower.includes('software') || nameLower.includes('coding');
        const isEnglish = nameLower.includes('english') || nameLower.includes('spoken') || nameLower.includes('language') || tags.amenity === 'language_school';
        const isWeaving = nameLower.includes('weaving') || nameLower.includes('handicraft') || nameLower.includes('tailoring') || nameLower.includes('stitching') || nameLower.includes('craft');
        const isBusiness = nameLower.includes('business') || nameLower.includes('self help') || nameLower.includes('shg') || nameLower.includes('entrepreneur') || nameLower.includes('microfinance') || tags.office === 'employment';
        const isRehab = nameLower.includes('rehab') || tags.social_facility === 'rehabilitation' || nameLower.includes('detox') || nameLower.includes('recovery');
        const isNGO = tags.office === 'ngo' || tags.office === 'foundation' || tags.office === 'charity' || nameLower.includes('welfare') || nameLower.includes('charity') || nameLower.includes('foundation') || nameLower.includes('society') || nameLower.includes('trust');
        
        if (isComputer) {
          category = 'Computer Training Centres';
        } else if (isEnglish) {
          category = 'Spoken English Centres';
        } else if (isWeaving) {
          category = 'Women Weaving / Skill Centres';
        } else if (isBusiness) {
          category = 'Women Business / Self Help Group Centres';
        } else if (isRehab) {
          category = 'Rehabilitation Centres';
        } else if (isNGO) {
          category = 'NGO / Welfare Organisations';
        } else {
          category = 'Community Development Centres';
        }

        const item = {
          name: name,
          nameHi: el.tags['name:hi'] || null,
          type: el.tags.amenity || el.tags.office || 'Centre',
          category: category,
          website: el.tags.website || el.tags.contact_website || null,
          address: el.tags['addr:full'] || 
                   (el.tags['addr:street'] ? `${el.tags['addr:street']}${el.tags['addr:city'] ? ', ' + el.tags['addr:city'] : ''}` : 'Address not available'),
          lat: el.lat || (el.center ? el.center.lat : null),
          lon: el.lon || (el.center ? el.center.lon : null),
        };

        if (!item.lat || !item.lon) return;

        const dist = calculateDistance(lat, lon, item.lat, item.lon);
        centresList.push({ ...item, distance: dist });
      });

      if (centresList.length === 0 && autoExpand && radius < 20000) {
        console.log(`No results at ${radius}m, expanding to ${radius + 5000}m...`);
        fetchNearbyCommunity(lat, lon, radius + 5000, true);
        return;
      }

      setNearbyCentresRaw(centresList.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)));
      
    } catch (err) {
      console.error("Overpass API Error (Community):", err);
      setSamudayLocationError("Failed to fetch data from OpenStreetMap.");
    } finally {
      setIsFetchingSamuday(false);
    }
  };

  const detectSamudayLocation = async () => {
    setIsLocatingSamuday(true);
    setSamudayLocationError(null);
    try {
      const location = await getPersistentLocation();
      setUserLocation(location);
      fetchNearbyCommunity(location.lat, location.lng, samudayRadius, true);
      setSamudayView('list');
    } catch (err: any) {
      setSamudayLocationError(err.message || "Could not detect location");
    } finally {
      setIsLocatingSamuday(false);
    }
  };

  const manualSamudaySearch = async () => {
    if (!samudayManualLocation) return;
    setIsFetchingSamuday(true);
    setSamudayLocationError(null);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(samudayManualLocation)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        // Use a larger initial radius for manual search as users often search for cities
        fetchNearbyCommunity(parseFloat(lat), parseFloat(lon), 10000, true);
        setSamudayView('list');
      } else {
        setSamudayLocationError("Location not found. Try a different city or pin code.");
      }
    } catch (err) {
      setSamudayLocationError("Error searching for location.");
    } finally {
      setIsFetchingSamuday(false);
    }
  };

  const expandSamudaySearch = () => {
    const newRadius = 10000;
    setSamudayRadius(newRadius);
    if (userLocation) {
      fetchNearbyCommunity(userLocation.lat, userLocation.lng, newRadius);
    }
  };

  const getPersistentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      const storedLat = localStorage.getItem('user_lat');
      const storedLon = localStorage.getItem('user_lon');
      const storedTime = localStorage.getItem('location_timestamp');
      const now = Date.now();

      if (storedLat && storedLon && storedTime && (now - parseInt(storedTime)) < 30 * 60 * 1000) {
        resolve({ lat: parseFloat(storedLat), lng: parseFloat(storedLon) });
        return;
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            localStorage.setItem('user_lat', lat.toString());
            localStorage.setItem('user_lon', lng.toString());
            localStorage.setItem('location_timestamp', now.toString());
            resolve({ lat, lng });
          },
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        reject(new Error("Geolocation not supported"));
      }
    });
  };

  const detectLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const location = await getPersistentLocation();
      setUserLocation(location);
      setIsLocating(false);
      fetchNearbyHealthcare(location.lat, location.lng, searchRadius);
    } catch (error: any) {
      setIsLocating(false);
      if (error.code === 1) { // PERMISSION_DENIED
        setLocationError("Permission Denied: Please enable location access in your browser settings to see nearby healthcare services. / अनुमति अस्वीकृत: नजदीकी स्वास्थ्य सेवाओं को देखने के लिए कृपया अपने ब्राउज़र सेटिंग्स में स्थान पहुंच सक्षम करें।");
      } else {
        setLocationError("Failed to detect location. Please try again. / स्थान का पता लगाने में विफल। कृपया पुनः प्रयास करें।");
      }
    }
  };

  const expandSearch = () => {
    if (userLocation) {
      setSearchRadius(10000);
      fetchNearbyHealthcare(userLocation.lat, userLocation.lng, 10000);
    }
  };

  const vaccineData = [
    { id: 'bcg', name: 'BCG', age: 0, descEn: 'Prevents Tuberculosis', descHi: 'तपेदिक (टीबी) से बचाता है' },
    { id: 'opv', name: 'OPV (Oral Polio)', age: 0, descEn: 'Prevents Polio', descHi: 'पोलियो से बचाता है' },
    { id: 'ipv', name: 'IPV (Inactivated Polio)', age: 0.2, descEn: 'Prevents Polio', descHi: 'पोलियो से बचाता है' },
    { id: 'dpt', name: 'DPT', age: 0.2, descEn: 'Prevents Diphtheria, Pertussis, Tetanus', descHi: 'डिप्थीरिया, काली खांसी, टिटनेस से बचाता है' },
    { id: 'penta', name: 'Pentavalent', age: 0.2, descEn: '5-in-1 vaccine for multiple diseases', descHi: 'कई बीमारियों के लिए 5-इन-1 टीका' },
    { id: 'hepb', name: 'Hepatitis B', age: 0, descEn: 'Prevents Liver Infection', descHi: 'लिवर संक्रमण से बचाता है' },
    { id: 'measles', name: 'Measles', age: 0.75, descEn: 'Prevents Measles', descHi: 'खसरे से बचाता है' },
    { id: 'mmr', name: 'MMR', age: 0.75, descEn: 'Prevents Measles, Mumps, Rubella', descHi: 'खसरा, कण्ठमाला, रूबेला से बचाता है' },
    { id: 'rota', name: 'Rotavirus', age: 0.2, descEn: 'Prevents Diarrhea', descHi: 'दस्त से बचाता है' },
    { id: 'typhoid', name: 'Typhoid', age: 2, descEn: 'Prevents Typhoid Fever', descHi: 'टाइफाइड बुखार से बचाता है' },
    { id: 'hepa', name: 'Hepatitis A', age: 1, descEn: 'Prevents Liver Disease', descHi: 'लिवर की बीमारी से बचाता है' },
    { id: 'vari', name: 'Varicella', age: 1.25, descEn: 'Prevents Chickenpox', descHi: 'चेचक से बचाता है' },
    { id: 'flu', name: 'Influenza', age: 0.5, descEn: 'Prevents Seasonal Flu', descHi: 'मौसमी फ्लू से बचाता है' },
    { id: 'tdap', name: 'Tdap Booster', age: 10, descEn: 'Booster for Tetanus, Diphtheria', descHi: 'टिटनेस, डिप्थीरिया के लिए बूस्टर' },
    { id: 'hpv', name: 'HPV', age: 9, descEn: 'Prevents certain cancers', descHi: 'कुछ प्रकार के कैंसर से बचाता है' },
    { id: 'covid', name: 'COVID-19', age: 12, descEn: 'Prevents Coronavirus', descHi: 'कोरोनावायरस से बचाता है' },
    { id: 'je', name: 'Japanese Encephalitis', age: 0.75, descEn: 'Prevents Brain Infection', descHi: 'मस्तिष्क संक्रमण से बचाता है' }
  ];

  const analyzeSymptoms = async () => {
    if (!symptoms && selectedChips.length === 0) return;
    setIsAnalyzing(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `
        User is a ${formData.age} year old ${formData.gender}.
        Pregnancy Status: ${formData.isPregnant}
        Newborn Mother: ${formData.isNewbornMother}
        Pregnancy Stage: ${formData.pregnancyStage}
        Symptoms Selected: ${selectedChips.join(', ')}
        Additional Notes: ${symptoms}
        Last Period Date: ${lastPeriodDate}
        
        Provide a brief, non-alarming, supportive health prediction in both English and Hindi. 
        If pregnant or postpartum, take that into account. 
        If irregular periods are detected (based on last period date and symptoms), mention it gently.
        Always include a suggestion to consult a doctor.
        Format: English text / Hindi text
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const predictionText = response.text || "Unable to analyze at the moment. Please consult a doctor. / इस समय विश्लेषण करने में असमर्थ। कृपया डॉक्टर से परामर्श लें।";
      setPrediction(predictionText);

      // Save to Firestore
      if (user) {
        const chatRef = doc(db, `users/${user.uid}/data/chatHistory`);
        const chatSnap = await getDoc(chatRef);
        const existingMessages = chatSnap.exists() ? chatSnap.data().messages || [] : [];
        
        await setDoc(chatRef, {
          uid: user.uid,
          messages: [
            ...existingMessages,
            { role: 'user', text: symptoms || selectedChips.join(', '), timestamp: new Date().toISOString() },
            { role: 'model', text: predictionText, timestamp: new Date().toISOString() }
          ],
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setPrediction("Error in analysis. Please consult a doctor. / विश्लेषण में त्रुटि। कृपया डॉक्टर से परामर्श लें।");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getVaccineStatus = (vAge: number, vId: string) => {
    const userAge = parseInt(formData.age) || 0;
    if (completedVaccines.includes(vId)) return 'Done';
    if (userAge >= vAge) return 'Due';
    return 'Upcoming';
  };

  const toggleVaccineDone = async (vId: string) => {
    const newCompleted = completedVaccines.includes(vId) 
      ? completedVaccines.filter(id => id !== vId) 
      : [...completedVaccines, vId];
    
    setCompletedVaccines(newCompleted);

    if (user) {
      try {
        const vRef = doc(db, 'users', user.uid, 'data', 'vaccinations');
        await setDoc(vRef, { 
          completedVaccines: newCompleted,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error("Error updating vaccination:", error);
      }
    }
  };

  const menuItems = [
    { title: 'Swasthya (Health)', icon: HeartPulse, color: 'green' as const, onClick: () => setActivePopup('swasthya') },
    { title: 'Matri Seva (Maternal)', icon: Baby, color: 'purple' as const, onClick: () => setActivePopup('matriSeva') },
    { title: 'Medical Shop', icon: Pill, color: 'blue' as const, onClick: () => setActivePopup('medicalShop') },
    { title: 'Ambulance', icon: Ambulance, color: 'green' as const, onClick: () => setActivePopup('ambulance') },
    { title: 'My Profile', icon: UserCheck, color: 'blue' as const, onClick: () => setActivePopup('profile') },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-purple-50"><Logo className="animate-pulse" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3E5F5] to-white flex flex-col items-center overflow-hidden">
      
      {/* Medical History Public View */}
      <AnimatePresence>
        {viewingHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-white overflow-y-auto p-6"
          >
            <div className="max-w-2xl mx-auto space-y-8 py-12">
              <div className="flex justify-between items-center border-b pb-6">
                <div>
                  <h1 className="text-3xl font-bold text-[#6B46C1]">Medical History</h1>
                  <p className="text-gray-500">Pragati Path Digital Health Record</p>
                </div>
                <button 
                  onClick={() => {
                    setViewingHistory(null);
                    window.history.pushState({}, '', '/');
                  }}
                  className="p-2 bg-gray-100 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              {historyData ? (
                <div className="space-y-8">
                  <section className="bg-purple-50 p-6 rounded-3xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <UserCheck className="text-[#6B46C1]" /> Patient Profile
                    </h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Name:</span> {historyData.profile.fullName}</div>
                      <div><span className="text-gray-500">Age:</span> {historyData.profile.age}</div>
                      <div><span className="text-gray-500">Blood Group:</span> {historyData.profile.bloodGroup}</div>
                      <div><span className="text-gray-500">Location:</span> {historyData.profile.village}</div>
                    </div>
                  </section>

                  {historyData.vaccinations && (
                    <section className="border p-6 rounded-3xl">
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <ClipboardList className="text-green-600" /> Vaccinations
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {historyData.vaccinations.completedVaccines?.map((vId: string) => (
                          <span key={vId} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
                            {vId}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {historyData.maternal && (
                    <section className="border p-6 rounded-3xl">
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Baby className="text-pink-600" /> Maternal Care
                      </h2>
                      <div className="space-y-2 text-sm">
                        {historyData.maternal.pregnancyData && (
                          <p><span className="text-gray-500">Pregnancy Stage:</span> {historyData.maternal.pregnancyData.stage}</p>
                        )}
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Fetching secure records...</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#6B46C1] rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#9575CD] rounded-full blur-3xl" />
      </div>

      <PatientDashboard />

        {/* Phone Login Popup */}
        <AnimatePresence>
          {activePopup === 'phoneLogin' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-50/60 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-8 relative border border-purple-100"
              >
                <button 
                  onClick={() => { setActivePopup(null); setShowOtpInput(false); }}
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>

                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Phone size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-800">Phone Login</h2>
                  <p className="text-gray-500 font-bold">Enter your mobile number to receive OTP</p>
                </div>

                {!showOtpInput ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Mobile Number (with +91)</label>
                      <input 
                        type="tel" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none font-bold text-lg"
                      />
                    </div>
                    <div id="recaptcha-container"></div>
                    {loginError && (
                      <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
                        {loginError}
                      </div>
                    )}
                    <button 
                      onClick={handlePhoneLogin}
                      disabled={isLoggingIn || !phoneNumber}
                      className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-purple-100 hover:bg-purple-700 transition-all disabled:opacity-50"
                    >
                      {isLoggingIn ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Enter 6-digit OTP</label>
                      <input 
                        type="text" 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none font-bold text-lg text-center tracking-[1em]"
                      />
                    </div>
                    <button 
                      onClick={verifyOtp}
                      disabled={isLoggingIn || otp.length !== 6}
                      className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-purple-100 hover:bg-purple-700 transition-all disabled:opacity-50"
                    >
                      {isLoggingIn ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <button 
                      onClick={() => setShowOtpInput(false)}
                      className="w-full py-2 text-purple-600 font-bold text-sm hover:underline"
                    >
                      Change Phone Number
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Profile / Registration Popup */}
        <AnimatePresence>
          {(activePopup === 'profile' || showProfileForm) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
              >
                <div className="p-6 bg-[#6B46C1] text-white flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">User Profile</h2>
                  {!showProfileForm && (
                    <button onClick={() => setActivePopup(null)} className="p-2 hover:bg-white/20 rounded-full">
                      <X size={24} />
                    </button>
                  )}
                </div>
                
                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <UserCheck size={48} className="text-[#6B46C1]" />
                    </div>
                    <p className="text-gray-500 text-sm">Please provide your details for a personalized experience.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        value={formData.fullName}
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                        <input 
                          type="number" 
                          value={formData.age}
                          onChange={(e) => setFormData({...formData, age: e.target.value})}
                          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select 
                          value={formData.gender}
                          onChange={(e) => setFormData({...formData, gender: e.target.value})}
                          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input 
                          type="date" 
                          value={formData.dob}
                          onChange={(e) => setFormData({...formData, dob: e.target.value})}
                          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                        <select 
                          value={formData.bloodGroup}
                          onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                          className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select</option>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                      <input 
                        type="tel" 
                        value={formData.mobile}
                        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500"
                        placeholder="10-digit number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Village/Location</label>
                      <input 
                        type="text" 
                        value={formData.village}
                        onChange={(e) => setFormData({...formData, village: e.target.value})}
                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter your village"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button 
                      onClick={() => saveProfile(formData)}
                      disabled={isSavingProfile}
                      className={`flex-1 bg-[#6B46C1] text-white py-4 rounded-2xl font-semibold transition-colors ${isSavingProfile ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#5A3AA3]'}`}
                    >
                      {isSavingProfile ? 'Saving...' : 'Save Profile'}
                    </button>
                    {user && !showProfileForm && (
                      <button 
                        onClick={handleLogout}
                        className="px-6 py-4 rounded-2xl border border-red-200 text-red-600 font-semibold hover:bg-red-50"
                      >
                        Logout
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Popups */}
      <AnimatePresence mode="wait">
        {activePopup === 'swasthya' && (
          <div key="swasthya" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -100 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 md:p-10 relative"
            >
              <button 
                onClick={() => setActivePopup(null)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={28} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-green-100 text-green-700 rounded-2xl">
                  <HeartPulse size={32} />
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Swasthya (स्वास्थ्य)</h2>
              </div>

              <div className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-lg font-medium text-gray-700">Full Name (पूरा नाम)</label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none text-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Age */}
                  <div className="space-y-2">
                    <label className="text-lg font-medium text-gray-700">Age (आयु)</label>
                    <input 
                      type="number" 
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="Years"
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none text-lg"
                    />
                  </div>

                  {/* Blood Group */}
                  <div className="space-y-2">
                    <label className="text-lg font-medium text-gray-700">Blood Group (optional)</label>
                    <select 
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleInputChange}
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none text-lg appearance-none"
                    >
                      <option value="">Select Group</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-3">
                  <label className="text-lg font-medium text-gray-700">Gender (लिंग)</label>
                  <div className="flex gap-4">
                    {['Male', 'Female', 'Other'].map(g => (
                      <button
                        key={g}
                        onClick={() => handleRadioChange('gender', g)}
                        className={`flex-1 p-4 rounded-2xl border-2 transition-all text-lg font-medium ${
                          formData.gender === g 
                            ? 'border-green-500 bg-green-50 text-green-700' 
                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        {g === 'Male' ? 'Male / पुरुष' : g === 'Female' ? 'Female / महिला' : 'Other / अन्य'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile & OTP */}
                <div className="space-y-2">
                  <label className="text-lg font-medium text-gray-700">Mobile Number (मोबाइल नंबर)</label>
                  <div className="flex gap-3">
                    <input 
                      type="tel" 
                      name="mobile"
                      maxLength={10}
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="10-digit number"
                      disabled={otpVerified}
                      className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none text-lg"
                    />
                    {!otpVerified && (
                      <button 
                        onClick={sendOtp}
                        className="px-6 bg-green-600 text-white rounded-2xl font-medium hover:bg-green-700 transition-colors"
                      >
                        {otpSent ? 'Resend' : 'Send OTP'}
                      </button>
                    )}
                  </div>
                </div>

                {otpSent && !otpVerified && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className="text-lg font-medium text-gray-700">Enter OTP (1234 for demo)</label>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        name="otp"
                        maxLength={4}
                        value={formData.otp}
                        onChange={handleInputChange}
                        placeholder="4-digit code"
                        className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none text-lg"
                      />
                      <button 
                        onClick={verifyDemoOtp}
                        className="px-6 bg-green-600 text-white rounded-2xl font-medium hover:bg-green-700 transition-colors"
                      >
                        Verify
                      </button>
                    </div>
                  </motion.div>
                )}

                {otpVerified && (
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle2 size={20} /> Mobile Verified
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Village */}
                  <div className="space-y-2">
                    <label className="text-lg font-medium text-gray-700">Village (गाँव)</label>
                    <input 
                      type="text" 
                      name="village"
                      value={formData.village}
                      onChange={handleInputChange}
                      placeholder="Your village"
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none text-lg"
                    />
                  </div>
                  {/* District */}
                  <div className="space-y-2">
                    <label className="text-lg font-medium text-gray-700">District (जिला)</label>
                    <input 
                      type="text" 
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="Your district"
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none text-lg"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row gap-4 pt-6">
                  <button 
                    onClick={handleSwasthyaContinue}
                    className="flex-1 py-5 bg-[#2E7D32] text-white rounded-2xl text-xl font-bold shadow-lg shadow-green-100 hover:bg-[#1B5E20] transition-all"
                  >
                    Continue (आगे बढ़ें)
                  </button>
                  <button 
                    onClick={() => setActivePopup(null)}
                    className="flex-1 py-5 border-2 border-[#4FC3F7] text-[#0288D1] rounded-2xl text-xl font-bold hover:bg-[#E1F5FE] transition-all"
                  >
                    Cancel (रद्द करें)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}



        {/* Matri Seva Popup */}

        {/* Choice Popup */}

        {activePopup === 'choice' && (
          <div key="choice" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-10 relative"
            >
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Select Service / सेवा चुनें</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setActivePopup('generalHealth')}
                  className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-[#4FC3F7] bg-[#E1F5FE] text-[#0288D1] hover:scale-105 transition-all group"
                >
                  <div className="p-4 bg-white rounded-2xl mb-4 shadow-sm group-hover:shadow-md transition-all">
                    <HeartPulse size={48} />
                  </div>
                  <span className="text-xl font-bold">General Health</span>
                  <span className="text-sm opacity-70">सामान्य स्वास्थ्य</span>
                </button>

                <button
                  onClick={() => setActivePopup('matriSeva')}
                  className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-pink-200 bg-pink-50 text-pink-600 hover:scale-105 transition-all group"
                >
                  <div className="p-4 bg-white rounded-2xl mb-4 shadow-sm group-hover:shadow-md transition-all">
                    <Baby size={48} />
                  </div>
                  <span className="text-xl font-bold">Matri Seva</span>
                  <span className="text-sm opacity-70">मातृ सेवा</span>
                </button>
              </div>
              <button 
                onClick={() => setActivePopup('swasthya')}
                className="w-full mt-8 py-4 text-gray-400 font-medium hover:text-gray-600 transition-all"
              >
                Back to Form / फॉर्म पर वापस जाएं
              </button>
            </motion.div>
          </div>
        )}

        {activePopup === 'generalHealth' && (
          <div key="generalHealth" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2AAE8A]/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 md:p-10 relative border-4 border-[#2AAE8A]/30"
            >
              <button 
                onClick={() => setActivePopup(null)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={28} />
              </button>

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#2AAE8A]/10 text-[#2AAE8A] rounded-2xl">
                    <Stethoscope size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">General Health (सामान्य स्वास्थ्य)</h2>
                    <p className="text-[#2AAE8A] font-medium">Personalized Health Dashboard</p>
                  </div>
                </div>
                {user && (
                  <div className="p-2 bg-white border border-gray-100 rounded-xl shadow-sm" title="Your Medical ID">
                    <QRCodeCanvas value={`${import.meta.env.VITE_APP_URL || window.location.origin}/history/${user.uid}`} size={64} />
                  </div>
                )}
              </div>

              <div className="space-y-10">
                {/* Emergency Quick Access */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setActivePopup('ambulance')}
                    className="flex items-center justify-center gap-3 p-6 bg-red-500 text-white rounded-[2rem] shadow-lg shadow-red-100 hover:bg-red-600 transition-all group"
                  >
                    <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                      <Ambulance size={28} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg leading-tight">Ambulance 24/7</div>
                      <div className="text-xs opacity-80">एम्बुलेंस 24/7</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActivePopup('medicalShop')}
                    className="flex items-center justify-center gap-3 p-6 bg-[#2AAE8A] text-white rounded-[2rem] shadow-lg shadow-teal-100 hover:bg-[#238c6f] transition-all group"
                  >
                    <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                      <Pill size={28} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg leading-tight">Medical Shop</div>
                      <div className="text-xs opacity-80">दवा दुकान</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActivePopup('ashaWorker')}
                    className="flex items-center justify-center gap-3 p-6 bg-[#2AAE8A] text-white rounded-[2rem] shadow-lg shadow-teal-100 hover:bg-[#238c6f] transition-all group"
                  >
                    <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                      <Users2 size={28} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg leading-tight">ASHA Worker</div>
                      <div className="text-xs opacity-80">आशा कार्यकर्ता</div>
                    </div>
                  </button>
                </div>

                {/* ── Request ASHA Visit ── */}
                <div className="rounded-[2rem] border-2 border-[#2AAE8A]/30 bg-[#f0fdf9] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2AAE8A] rounded-xl flex items-center justify-center">
                        <UserPlus size={20} className="text-white"/>
                      </div>
                      <div>
                        <p className="font-black text-gray-800">Request ASHA Home Visit</p>
                        <p className="text-xs text-[#2AAE8A] font-bold">आशा कार्यकर्ता को घर बुलाएं</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setAshaRequestSource('General Health'); setShowAshaRequestForm(v => !v); setAshaRequestSent(false); if (!showAshaRequestForm) fetchAvailableAshaWorkers(); }}
                      className="px-4 py-2 rounded-xl font-black text-sm text-white transition-all hover:opacity-90"
                      style={{backgroundColor:'#2AAE8A'}}>
                      {showAshaRequestForm && ashaRequestSource === 'General Health' ? 'Cancel' : 'Request Visit'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showAshaRequestForm && ashaRequestSource === 'General Health' && (
                      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-4 pt-2">
                        {ashaRequestSent ? (
                          <div className="p-5 bg-green-50 border border-green-200 rounded-2xl text-center">
                            <p className="text-2xl mb-1">✅</p>
                            <p className="font-black text-green-700">Request sent! Your ASHA worker will visit soon.</p>
                            <p className="text-xs text-green-500 font-bold mt-1">अनुरोध भेजा गया! आपकी आशा कार्यकर्ता जल्द आएंगी।</p>
                          </div>
                        ) : (
                          <>
                            <div>
                              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Describe your health issue *</label>
                              <textarea value={ashaRequestIssue} onChange={e => setAshaRequestIssue(e.target.value)} rows={3} placeholder="e.g. Fever since 2 days, weakness, need checkup... / बुखार 2 दिन से है, कमज़ोरी है..."
                                className="w-full p-4 rounded-2xl border-2 border-[#2AAE8A]/30 font-medium resize-none outline-none focus:ring-4 focus:ring-[#2AAE8A]/20"/>
                            </div>
                            {availableAshaWorkers.length > 0 && (
                              <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Select ASHA Worker</label>
                                <select value={selectedAshaWorkerUid} onChange={e => setSelectedAshaWorkerUid(e.target.value)}
                                  className="w-full p-3 rounded-2xl border-2 border-[#2AAE8A]/30 font-bold outline-none focus:ring-4 focus:ring-[#2AAE8A]/20">
                                  {availableAshaWorkers.map((w:any) => (
                                    <option key={w.uid} value={w.uid}>{w.name} — {w.district || w.area || 'Your area'}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {availableAshaWorkers.length === 0 && (
                              <p className="text-xs text-gray-400 font-bold">Request will be sent to all available ASHA workers in your area.</p>
                            )}
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input type="checkbox" checked={ashaRequestUrgent} onChange={e => setAshaRequestUrgent(e.target.checked)} className="w-5 h-5 rounded accent-red-500"/>
                              <span className="font-black text-red-600 text-sm">🚨 Mark as Urgent / तत्काल चिह्नित करें</span>
                            </label>
                            <button onClick={sendAshaRequest} disabled={!ashaRequestIssue.trim() || ashaRequestSending}
                              className="w-full py-4 rounded-2xl font-black text-white text-lg shadow-lg disabled:opacity-40 transition-all"
                              style={{backgroundColor:'#2AAE8A'}}>
                              {ashaRequestSending ? 'Sending...' : 'Send Request to ASHA Worker'}
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 1. Location Status & Error */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                      <MapPin size={24} className="text-[#2AAE8A]" />
                      Nearby Healthcare Services (नजदीकी स्वास्थ्य सेवाएं)
                    </h3>
                    {isLocating && (
                      <div className="flex items-center gap-2 text-xs font-bold text-[#2AAE8A] animate-pulse">
                        <Navigation size={14} className="animate-spin" />
                        Detecting Location...
                      </div>
                    )}
                    {userLocation && !isLocating && (
                      <div className="text-xs font-bold text-blue-500 flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        Location Active
                      </div>
                    )}
                  </div>

                  {locationError && (
                    <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[2.5rem] space-y-4">
                      <div className="flex items-center gap-4 text-red-600 font-bold">
                        <AlertCircle size={32} />
                        <p className="text-xl">{locationError}</p>
                      </div>
                      <div className="pl-12 space-y-2 text-red-500/80 font-medium">
                        <p>How to reset: Click the lock icon 🔒 in your browser address bar and set Location to "Allow". / रीसेट कैसे करें: अपने ब्राउज़र एड्रेस बार में लॉक आइकन 🔒 पर क्लिक करें और स्थान को "अनुमति दें" पर सेट करें।</p>
                      </div>
                    </div>
                  )}

                  {!userLocation && !isLocating && !locationError && (
                    <button 
                      onClick={detectLocation}
                      className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-bold border-2 border-blue-100 hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Navigation size={20} />
                      Enable Location to see nearby services / नजदीकी सेवाओं को देखने के लिए स्थान सक्षम करें
                    </button>
                  )}
                </section>

                {/* 2. Nearby Healthcare Results */}
                {(nearbyHospitals.length > 0 || nearbyPharmacies.length > 0 || nearbyClinics.length > 0) && (
                  <div className="space-y-10">
                    {/* Hospitals */}
                    {nearbyHospitals.length > 0 && (
                      <section className="space-y-4">
                        <h4 className="text-lg font-bold text-gray-700 flex items-center gap-2 border-b border-gray-100 pb-2">
                          <Building2 size={20} className="text-[#2AAE8A]" />
                          Nearby Hospitals (नजदीकी अस्पताल)
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                          {nearbyHospitals.slice(0, hospitalsLimit).map((h, i) => (
                            <div key={i} className="p-6 bg-white border-2 border-gray-50 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <h5 className="text-xl font-bold text-gray-800">{h.name}</h5>
                                {h.nameHi && <p className="text-lg text-[#2AAE8A] font-bold">{h.nameHi}</p>}
                                <p className="text-sm text-gray-500 font-medium">{h.address}</p>
                                {h.addressHi && <p className="text-xs text-gray-400 font-medium">{h.addressHi}</p>}
                                <div className="flex items-center gap-2 text-xs font-bold text-[#2AAE8A]">
                                  <Navigation size={14} />
                                  {h.distance} km away / {h.distance} किमी दूर
                                </div>
                              </div>
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lon}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-[#2AAE8A]/10 text-[#2AAE8A] rounded-xl font-bold text-sm hover:bg-[#2AAE8A] hover:text-white transition-all flex items-center justify-center gap-2"
                              >
                                <MapIcon size={18} />
                                Open in Maps / मैप्स में खोलें
                              </a>
                            </div>
                          ))}
                        </div>
                        {nearbyHospitals.length > hospitalsLimit && (
                          <button 
                            onClick={() => setHospitalsLimit(prev => prev + 5)}
                            className="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 border-2 border-dashed border-gray-200"
                          >
                            Show More Hospitals / और अस्पताल दिखाएं
                          </button>
                        )}
                      </section>
                    )}

                    {/* Pharmacies */}
                    {nearbyPharmacies.length > 0 && (
                      <section className="space-y-4">
                        <h4 className="text-lg font-bold text-gray-700 flex items-center gap-2 border-b border-gray-100 pb-2">
                          <Pill size={20} className="text-[#2AAE8A]" />
                          Nearby Pharmacies (नजदीकी दवा की दुकानें)
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                          {nearbyPharmacies.slice(0, pharmaciesLimit).map((p, i) => (
                            <div key={i} className="p-6 bg-white border-2 border-gray-50 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <h5 className="text-xl font-bold text-gray-800">{p.name}</h5>
                                {p.nameHi && <p className="text-lg text-[#2AAE8A] font-bold">{p.nameHi}</p>}
                                <p className="text-sm text-gray-500 font-medium">{p.address}</p>
                                {p.addressHi && <p className="text-xs text-gray-400 font-medium">{p.addressHi}</p>}
                                <div className="flex items-center gap-2 text-xs font-bold text-[#2AAE8A]">
                                  <Navigation size={14} />
                                  {p.distance} km away / {p.distance} किमी दूर
                                </div>
                              </div>
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-[#2AAE8A]/10 text-[#2AAE8A] rounded-xl font-bold text-sm hover:bg-[#2AAE8A] hover:text-white transition-all flex items-center justify-center gap-2"
                              >
                                <MapIcon size={18} />
                                Open in Maps / मैप्स में खोलें
                              </a>
                            </div>
                          ))}
                        </div>
                        {nearbyPharmacies.length > pharmaciesLimit && (
                          <button 
                            onClick={() => setPharmaciesLimit(prev => prev + 5)}
                            className="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 border-2 border-dashed border-gray-200"
                          >
                            Show More Pharmacies / और दवा की दुकानें दिखाएं
                          </button>
                        )}
                      </section>
                    )}

                    {/* Clinics */}
                    {nearbyClinics.length > 0 && (
                      <section className="space-y-4">
                        <h4 className="text-lg font-bold text-gray-700 flex items-center gap-2 border-b border-gray-100 pb-2">
                          <Stethoscope size={20} className="text-[#2AAE8A]" />
                          Nearby Clinics / Health Centres (नजदीकी क्लीनिक / स्वास्थ्य केंद्र)
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                          {nearbyClinics.slice(0, clinicsLimit).map((c, i) => (
                            <div key={i} className="p-6 bg-white border-2 border-gray-50 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <h5 className="text-xl font-bold text-gray-800">{c.name}</h5>
                                {c.nameHi && <p className="text-lg text-[#2AAE8A] font-bold">{c.nameHi}</p>}
                                <p className="text-sm text-gray-500 font-medium">{c.address}</p>
                                {c.addressHi && <p className="text-xs text-gray-400 font-medium">{c.addressHi}</p>}
                                <div className="flex items-center gap-2 text-xs font-bold text-[#2AAE8A]">
                                  <Navigation size={14} />
                                  {c.distance} km away / {c.distance} किमी दूर
                                </div>
                              </div>
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lon}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-[#2AAE8A]/10 text-[#2AAE8A] rounded-xl font-bold text-sm hover:bg-[#2AAE8A] hover:text-white transition-all flex items-center justify-center gap-2"
                              >
                                <MapIcon size={18} />
                                Open in Maps / मैप्स में खोलें
                              </a>
                            </div>
                          ))}
                        </div>
                        {nearbyClinics.length > clinicsLimit && (
                          <button 
                            onClick={() => setClinicsLimit(prev => prev + 5)}
                            className="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 border-2 border-dashed border-gray-200"
                          >
                            Show More Clinics / और क्लीनिक दिखाएं
                          </button>
                        )}
                      </section>
                    )}
                  </div>
                )}

                {isFetchingNearby && (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-[#2AAE8A]/20 border-t-[#2AAE8A] rounded-full animate-spin mx-auto" />
                    <p className="text-gray-500 font-bold">Finding nearby healthcare services... / नजदीकी स्वास्थ्य सेवाओं की खोज की जा रही है...</p>
                  </div>
                )}

                {!isFetchingNearby && userLocation && nearbyHospitals.length === 0 && nearbyPharmacies.length === 0 && nearbyClinics.length === 0 && (
                  <div className="py-20 text-center space-y-6 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                    <Search size={64} className="text-gray-300 mx-auto" />
                    <div className="space-y-2">
                      <p className="text-gray-500 font-black text-2xl">
                        No healthcare services found within {searchRadius/1000}km.
                      </p>
                      <p className="text-gray-400 font-bold">
                        {searchRadius/1000} किमी के भीतर कोई स्वास्थ्य सेवा नहीं मिली।
                      </p>
                    </div>
                    {searchRadius < 10000 && (
                      <button 
                        onClick={expandSearch}
                        className="px-10 py-5 bg-[#2AAE8A] text-white rounded-2xl font-black text-xl shadow-xl shadow-teal-100 hover:bg-[#238c6f] hover:scale-105 transition-all flex items-center gap-3 mx-auto"
                      >
                        <Plus size={24} />
                        Expand Search to 10km / खोज को 10 किमी तक बढ़ाएं
                      </button>
                    )}
                  </div>
                )}

                {/* 3. Symptom Entry Section */}
                <section className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                    <Zap size={24} className="text-[#2AAE8A]" />
                    Symptoms (लक्षण)
                  </h3>
                  <div className="relative">
                    <textarea 
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="Type your symptoms here... / अपने लक्षण यहाँ लिखें..."
                      className="w-full p-8 bg-gray-50 border-2 border-gray-100 rounded-[2.5rem] focus:ring-4 focus:ring-[#2AAE8A]/20 focus:border-[#2AAE8A] outline-none text-xl min-h-[160px] transition-all"
                    />
                    <div className="absolute bottom-6 right-6 flex gap-3">
                      <button 
                        onClick={() => startVoiceInput((text) => setSymptoms(prev => prev + ' ' + text))}
                        className={`p-4 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-[#2AAE8A]'} text-white rounded-2xl shadow-lg hover:bg-[#238c6f] transition-all`}
                      >
                        <Mic size={24} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {symptomChips.map(chip => (
                      <button
                        key={chip.en}
                        onClick={() => {
                          if (selectedChips.includes(chip.en)) {
                            setSelectedChips(selectedChips.filter(c => c !== chip.en));
                          } else {
                            setSelectedChips([...selectedChips, chip.en]);
                          }
                        }}
                        className={`px-6 py-3 rounded-full border-2 transition-all text-lg font-bold ${
                          selectedChips.includes(chip.en)
                            ? 'border-[#2AAE8A] bg-[#2AAE8A] text-white shadow-md'
                            : 'border-gray-100 bg-white text-gray-500 hover:border-[#2AAE8A]/30'
                        }`}
                      >
                        {chip.en} / {chip.hi}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={analyzeSymptoms}
                    disabled={isAnalyzing}
                    className="w-full py-6 bg-[#2AAE8A] text-white rounded-[2rem] text-2xl font-bold shadow-xl shadow-[#2AAE8A]/20 hover:bg-[#238c6f] transition-all flex items-center justify-center gap-4"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing...
                      </div>
                    ) : (
                      <>
                        <Search size={28} />
                        Analyze Symptoms / लक्षणों का विश्लेषण करें
                      </>
                    )}
                  </button>
                </section>

                {/* 4. AI Prediction Result Section */}
                <AnimatePresence>
                  {prediction && (
                    <motion.section 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-10 rounded-[3rem] bg-gradient-to-br from-teal-50 to-white border-4 border-[#2AAE8A]/20 shadow-xl space-y-6 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <HeartPulse size={120} className="text-[#2AAE8A]" />
                      </div>
                      <h3 className="text-2xl font-bold text-[#2AAE8A] flex items-center gap-3">
                        <CheckCircle2 size={32} />
                        AI Prediction (एआई भविष्यवाणी)
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-2xl font-medium">
                        {prediction}
                      </p>
                      <div className="pt-4">
                        <button className="w-full py-6 bg-[#2AAE8A] text-white rounded-[2rem] text-2xl font-bold shadow-lg hover:bg-[#238c6f] transition-all flex items-center justify-center gap-3">
                          <Phone size={28} />
                          Doctor se Baat Kare / Consult Doctor
                        </button>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>

                {/* Mental Health Section */}
                <section className="p-8 rounded-[3rem] bg-blue-50 border-4 border-blue-100 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-500">
                      <Brain size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-blue-700">Mental Health / मानसिक स्वास्थ्य</h3>
                      <p className="text-blue-400 font-medium">You are not alone. We are here to listen.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="p-6 bg-white rounded-3xl border-2 border-blue-100 hover:border-blue-300 transition-all flex items-center gap-4 group">
                      <div className="p-3 bg-blue-50 rounded-2xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <MessageSquare size={24} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-gray-800">Chat with Counselor</div>
                        <div className="text-xs text-blue-400">काउंसलर के साथ चैट करें</div>
                      </div>
                    </button>
                    <button className="p-6 bg-white rounded-3xl border-2 border-blue-100 hover:border-blue-300 transition-all flex items-center gap-4 group">
                      <div className="p-3 bg-blue-50 rounded-2xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <Phone size={24} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-gray-800">Voice Call</div>
                        <div className="text-xs text-blue-400">वॉयस कॉल</div>
                      </div>
                    </button>
                  </div>
                  <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                    Book Appointment / अपॉइंटमेंट बुक करें
                  </button>
                </section>

                {/* 4. Vaccination Section */}
                <section className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                    <ClipboardList size={24} className="text-[#2AAE8A]" />
                    Vaccination Dashboard (टीकाकरण डैशबोर्ड)
                  </h3>
                  <div className="space-y-4">
                    {vaccineData.map((v) => {
                      const status = getVaccineStatus(v.age, v.id);
                      const isExpanded = expandedVaccine === v.id;
                      
                      return (
                        <div 
                          key={v.id} 
                          className={`p-5 rounded-3xl border transition-all ${
                            status === 'Done' 
                              ? 'bg-green-50 border-green-200' 
                              : status === 'Due'
                              ? 'bg-white border-gray-200 shadow-sm'
                              : 'bg-gray-50 border-gray-100 opacity-80'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${status === 'Done' ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                {status === 'Done' ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 border-2 border-current rounded-full" />}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800">{v.name}</h4>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    status === 'Done' ? 'bg-green-100 text-green-600' : 
                                    status === 'Due' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                  }`}>
                                    {status === 'Done' ? 'Done / पूर्ण' : status === 'Due' ? 'Due / देय' : 'Upcoming / आगामी'}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {status === 'Upcoming' ? `Next: ${v.age} yrs` : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setExpandedVaccine(isExpanded ? null : v.id)}
                                className="p-2 text-gray-400 hover:text-[#2AAE8A] transition-colors"
                              >
                                <ChevronDown size={20} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                              {status !== 'Done' && (
                                <button 
                                  onClick={() => toggleVaccineDone(v.id)}
                                  className="px-4 py-2 bg-[#2AAE8A] text-white rounded-xl text-sm font-bold hover:bg-[#238c6f] transition-all"
                                >
                                  Mark as Done
                                </button>
                              )}
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-gray-100 space-y-2"
                              >
                                <p className="text-sm text-gray-600 font-medium">{v.descEn}</p>
                                <p className="text-sm text-gray-400 italic">{v.descHi}</p>
                                
                                {status === 'Upcoming' && (
                                  <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <span className="text-xs font-bold text-blue-700">Set Reminder (अनुस्मारक सेट करें)</span>
                                    <button 
                                      className={`w-10 h-5 rounded-full transition-all relative ${formData.immunization ? 'bg-blue-500' : 'bg-gray-200'}`}
                                      onClick={() => setFormData(prev => ({ ...prev, immunization: !prev.immunization }))}
                                    >
                                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.immunization ? 'left-5.5' : 'left-0.5'}`} />
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        )}

        {activePopup === 'matriSeva' && (
          <div key="matriSeva" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-50/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative border border-pink-100"
            >
              {/* Header */}
              <div className="bg-pink-500 p-6 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                    <Baby size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">MATRI SEVA (मातृ सेवा)</h2>
                    <p className="text-pink-100 font-bold text-xs uppercase tracking-widest">Maternal & Child Care Support</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {user && (
                    <div className="p-1 bg-white rounded-lg shadow-sm" title="Your Medical ID">
                      <QRCodeCanvas value={`${import.meta.env.VITE_APP_URL || window.location.origin}/history/${user.uid}`} size={48} />
                    </div>
                  )}
                  <button 
                    onClick={() => setActivePopup('choice')}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="bg-pink-50 p-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0 border-b border-pink-100">
                {[
                  { id: 'dashboard', labelEn: 'Dashboard', labelHi: 'डैशबोर्ड', icon: LayoutDashboard },
                  { id: 'vaccination', labelEn: 'Vaccination', labelHi: 'टीकाकरण', icon: ClipboardList },
                  { id: 'diet', labelEn: 'Health Plan', labelHi: 'स्वास्थ्य योजना', icon: Utensils },
                  { id: 'period', labelEn: 'Period Tracker', labelHi: 'मासिक धर्म', icon: Droplets },
                  { id: 'postpartum', labelEn: 'Postpartum', labelHi: 'प्रसवोत्तर', icon: Heart },
                  { id: 'mentalHealth', labelEn: 'Mental Health', labelHi: 'मानसिक स्वास्थ्य', icon: Brain },
                  { id: 'sexualHealth', labelEn: 'Sexual Health', labelHi: 'यौन स्वास्थ्य', icon: ShieldCheck },
                  { id: 'pregnancyKit', labelEn: 'Pregnancy Kit', labelHi: 'गर्भावस्था किट', icon: HelpCircle },
                  { id: 'shop', labelEn: 'Baby Shop', labelHi: 'शिशु दुकान', icon: ShoppingBag },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMatriTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                      matriTab === tab.id 
                        ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' 
                        : 'text-pink-400 hover:bg-pink-100'
                    }`}
                  >
                    <tab.icon size={18} />
                    <div className="text-left leading-tight">
                      <div className="block">{tab.labelEn}</div>
                      <div className="text-[10px] opacity-80">{tab.labelHi}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
                <AnimatePresence mode="wait">
                  {matriTab === 'dashboard' && (
                    <motion.div
                      key="dashboard"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 rounded-[2.5rem] bg-pink-50 border border-pink-100 flex flex-col items-center text-center space-y-4">
                          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-pink-500 shadow-sm">
                            <Baby size={40} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-pink-700">Child Care</h3>
                            <p className="text-sm text-pink-400 font-bold">Track vaccines & growth</p>
                          </div>
                          <button 
                            onClick={() => setMatriTab('vaccination')}
                            className="w-full py-4 bg-pink-500 text-white rounded-2xl font-black hover:bg-pink-600 transition-all"
                          >
                            Open Tracker
                          </button>
                        </div>
                        <div className="p-8 rounded-[2.5rem] bg-blue-50 border border-blue-100 flex flex-col items-center text-center space-y-4">
                          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-blue-500 shadow-sm">
                            <HeartPulse size={40} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-blue-700">Maternal Health</h3>
                            <p className="text-sm text-blue-400 font-bold">Diet, Period & Postpartum</p>
                          </div>
                          <button 
                            onClick={() => setMatriTab('diet')}
                            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black hover:bg-blue-600 transition-all"
                          >
                            Open Health Plan
                          </button>
                        </div>
                      </div>

                      <div className="p-8 rounded-[2.5rem] bg-red-50 border border-red-100 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center text-white animate-pulse">
                            <Ambulance size={32} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-red-700">Emergency 24/7</h3>
                            <p className="text-sm text-red-400 font-bold">Need help right now?</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setActivePopup('ambulance')}
                          className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                        >
                          CALL NOW
                        </button>
                      </div>

                      <div className="p-8 rounded-[2.5rem] bg-pink-50 border border-pink-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center text-white">
                              <Users2 size={32} />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-pink-700">Request ASHA Home Visit</h3>
                              <p className="text-sm text-pink-400 font-bold">आशा कार्यकर्ता को घर बुलाएं</p>
                            </div>
                          </div>
                          <button
                            onClick={() => { setAshaRequestSource('MatriSeva'); setShowAshaRequestForm(v => !v); setAshaRequestSent(false); if (!showAshaRequestForm) fetchAvailableAshaWorkers(); }}
                            className="px-6 py-3 bg-pink-600 text-white rounded-2xl font-black hover:bg-pink-700 transition-all shadow-lg shadow-pink-200">
                            {showAshaRequestForm && ashaRequestSource === 'MatriSeva' ? 'Cancel' : 'Request Visit'}
                          </button>
                        </div>

                        <AnimatePresence>
                          {showAshaRequestForm && ashaRequestSource === 'MatriSeva' && (
                            <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-4 pt-2">
                              {ashaRequestSent ? (
                                <div className="p-5 bg-green-50 border border-green-200 rounded-2xl text-center">
                                  <p className="text-2xl mb-1">✅</p>
                                  <p className="font-black text-green-700">Request sent! Your ASHA worker will visit soon.</p>
                                  <p className="text-xs text-green-500 font-bold mt-1">अनुरोध भेजा गया!</p>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Describe your concern *</label>
                                    <textarea value={ashaRequestIssue} onChange={e => setAshaRequestIssue(e.target.value)} rows={3}
                                      placeholder="e.g. 8 months pregnant, need checkup / 8 महीने गर्भवती हूं, जांच चाहिए..."
                                      className="w-full p-4 rounded-2xl border-2 border-pink-200 font-medium resize-none outline-none focus:ring-4 focus:ring-pink-200"/>
                                  </div>
                                  {availableAshaWorkers.length > 0 && (
                                    <div>
                                      <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Select ASHA Worker</label>
                                      <select value={selectedAshaWorkerUid} onChange={e => setSelectedAshaWorkerUid(e.target.value)}
                                        className="w-full p-3 rounded-2xl border-2 border-pink-200 font-bold outline-none focus:ring-4 focus:ring-pink-200">
                                        {availableAshaWorkers.map((w:any) => (
                                          <option key={w.uid} value={w.uid}>{w.name} — {w.district || w.area || 'Your area'}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                  <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={ashaRequestUrgent} onChange={e => setAshaRequestUrgent(e.target.checked)} className="w-5 h-5 rounded accent-red-500"/>
                                    <span className="font-black text-red-600 text-sm">🚨 Mark as Urgent / तत्काल</span>
                                  </label>
                                  <button onClick={sendAshaRequest} disabled={!ashaRequestIssue.trim() || ashaRequestSending}
                                    className="w-full py-4 rounded-2xl font-black text-white text-lg shadow-lg disabled:opacity-40 transition-all bg-pink-600 hover:bg-pink-700">
                                    {ashaRequestSending ? 'Sending...' : 'Send Request'}
                                  </button>
                                </>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}

                  {matriTab === 'vaccination' && (
                    <motion.div
                      key="vaccination"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-pink-500">
                            <Calendar size={24} />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Child's Date of Birth (बच्चे की जन्म तिथि)</label>
                            <input 
                              type="date" 
                              value={childDob}
                              onChange={(e) => setChildDob(e.target.value)}
                              className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-pink-400 font-bold text-gray-700"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
                          <ClipboardList size={24} className="text-pink-500" />
                          Vaccination Schedule (टीकाकरण कार्यक्रम)
                        </h3>
                        <div className="grid gap-4">
                          {vaccineList.map((v) => {
                            const status = getMatriVaccineStatus(v.id, childDob, v.months);
                            const dueDate = calculateVaccineDate(childDob, v.months);
                            const isExpanded = matriExpandedVaccine === v.id;

                            return (
                              <div 
                                key={v.id}
                                className={`p-6 rounded-[2rem] border-2 transition-all ${
                                  status === 'Done' ? 'bg-green-50 border-green-200' :
                                  status === 'Due' ? 'bg-red-50 border-red-200 shadow-lg shadow-red-50' :
                                  'bg-white border-slate-100'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                      status === 'Done' ? 'bg-green-500 text-white' :
                                      status === 'Due' ? 'bg-red-500 text-white animate-pulse' :
                                      'bg-slate-100 text-slate-400'
                                    }`}>
                                      {status === 'Done' ? <CheckCircle2 size={24} /> : <Droplet size={24} />}
                                    </div>
                                    <div>
                                      <h4 className="font-black text-gray-800">{v.name}</h4>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase ${
                                          status === 'Done' ? 'bg-green-200 text-green-700' :
                                          status === 'Due' ? 'bg-red-200 text-red-700' :
                                          'bg-slate-200 text-slate-500'
                                        }`}>
                                          {status}
                                        </span>
                                        {dueDate && (
                                          <span className="text-[10px] font-bold text-gray-400">
                                            Due: {dueDate}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => setMatriExpandedVaccine(isExpanded ? null : v.id)}
                                      className="p-2 text-gray-400 hover:text-pink-500 transition-colors"
                                    >
                                      <Info size={20} />
                                    </button>
                                    {status !== 'Done' && (
                                      <button 
                                        onClick={() => setDoneVaccines(prev => [...prev, v.id])}
                                        className="px-4 py-2 bg-pink-500 text-white rounded-xl text-xs font-black hover:bg-pink-600 transition-all"
                                      >
                                        Mark Done
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="mt-4 pt-4 border-t border-slate-100 overflow-hidden"
                                    >
                                      <p className="text-sm font-bold text-gray-600">{v.descEn}</p>
                                      <p className="text-xs font-bold text-pink-400">{v.descHi}</p>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {matriTab === 'diet' && (
                    <motion.div
                      key="diet"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      {/* Smart Trimester Detection Header */}
                      {lastPeriodDate && (
                        <div className="space-y-6">
                          <div className="p-8 rounded-[2.5rem] bg-pink-500 text-white shadow-xl shadow-pink-200 flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="text-xs font-black uppercase tracking-widest opacity-80">Current Status</div>
                              <div className="text-3xl font-black">
                                Week {getPregnancyInfo(lastPeriodDate)?.weeks} • Trimester {getPregnancyInfo(lastPeriodDate)?.trimester}
                              </div>
                              <div className="text-sm font-bold opacity-90">
                                EDD: {getPregnancyInfo(lastPeriodDate)?.edd.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                            </div>
                            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md">
                              <Baby size={48} />
                            </div>
                          </div>

                          {/* Next Visit Schedule */}
                          <div className="p-6 bg-white border-2 border-pink-100 rounded-[2rem] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-pink-50 rounded-2xl text-pink-500">
                                <Calendar size={24} />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Next Checkup Schedule</h4>
                                <div className="text-lg font-black text-gray-800">
                                  {getNextVisitSchedule(getPregnancyInfo(lastPeriodDate)?.weeks || 0).en}
                                </div>
                                <div className="text-xs font-bold text-pink-400">
                                  {getNextVisitSchedule(getPregnancyInfo(lastPeriodDate)?.weeks || 0).hi}
                                </div>
                              </div>
                            </div>
                            <div className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-[10px] font-black uppercase">
                              Active Plan
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {[1, 2, 3].map(t => {
                          const currentTrimester = lastPeriodDate ? getPregnancyInfo(lastPeriodDate)?.trimester : null;
                          const isCurrent = currentTrimester === t;
                          
                          return (
                            <button
                              key={t}
                              onClick={() => setSelectedTrimester(t)}
                              className={`px-6 py-4 rounded-2xl font-black text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                                selectedTrimester === t 
                                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-200' 
                                  : 'bg-pink-50 text-pink-500 hover:bg-pink-100'
                              }`}
                            >
                              {isCurrent && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                              Trimester {t}
                            </button>
                          );
                        })}
                      </div>

                      {trimesterPlans.filter(p => p.trimester === selectedTrimester).map(p => (
                        <div key={p.trimester} className="space-y-8">
                          {/* Tests Section */}
                          <div className="space-y-4">
                            <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
                              <ClipboardList size={24} className="text-pink-500" />
                              Antenatal Tests (प्रसव पूर्व जांच)
                            </h3>
                            <div className="grid gap-4">
                              {p.tests?.map((test: any) => {
                                const isDone = completedTests.includes(test.id);
                                return (
                                  <div 
                                    key={test.id}
                                    className={`p-6 rounded-[2rem] border-2 transition-all ${
                                      isDone ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                          isDone ? 'bg-green-500 text-white' : 'bg-pink-100 text-pink-500'
                                        }`}>
                                          {isDone ? <CheckCircle2 size={24} /> : <Activity size={24} />}
                                        </div>
                                        <div>
                                          <h4 className="font-black text-gray-800">{test.name}</h4>
                                          <p className="text-[10px] font-bold text-pink-400">{test.nameHi}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input 
                                          type="date"
                                          value={testDates[test.id] || ''}
                                          onChange={(e) => setTestDates(prev => ({ ...prev, [test.id]: e.target.value }))}
                                          className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-pink-400"
                                        />
                                        <button 
                                          onClick={() => setCompletedTests(prev => isDone ? prev.filter(id => id !== test.id) : [...prev, test.id])}
                                          className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                                            isDone ? 'bg-green-200 text-green-700' : 'bg-pink-500 text-white hover:bg-pink-600'
                                          }`}
                                        >
                                          {isDone ? 'DONE' : 'MARK DONE'}
                                        </button>
                                      </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                      <p className="text-sm font-bold text-gray-600">{test.desc}</p>
                                      <p className="text-[10px] font-bold text-pink-300 italic">{test.descHi}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Symptoms Section */}
                          <div className="space-y-4">
                            <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
                              <AlertCircle size={24} className="text-pink-500" />
                              Expected Symptoms (संभावित लक्षण)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {p.symptoms?.map((sym: any, i: number) => (
                                <div key={i} className="p-4 bg-pink-50 border border-pink-100 rounded-2xl flex items-center gap-3">
                                  <div className="w-2 h-2 bg-pink-400 rounded-full" />
                                  <div>
                                    <div className="text-sm font-bold text-gray-700">{sym.en}</div>
                                    <div className="text-[10px] font-bold text-pink-400">{sym.hi}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="p-6 bg-white border-2 border-dashed border-pink-200 rounded-[2rem] text-center">
                              <p className="text-xs font-bold text-gray-500">Most symptoms are normal, but if you feel severe pain or heavy bleeding, consult a doctor immediately.</p>
                              <p className="text-[10px] text-pink-400 italic mt-1">अधिकांश लक्षण सामान्य हैं, लेकिन यदि आप गंभीर दर्द या भारी रक्तस्राव महसूस करते हैं, तो तुरंत डॉक्टर से परामर्श लें।</p>
                            </div>
                          </div>

                          {/* Diet & Advice */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 rounded-[2.5rem] bg-pink-50 border border-pink-100 space-y-4">
                              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Utensils size={14} /> Recommended Diet
                              </h4>
                              <div className="grid gap-3">
                                {p.diet.map((item, i) => (
                                  <div key={i} className="p-4 bg-white rounded-2xl border border-pink-100 flex items-center justify-between">
                                    <div>
                                      <div className="font-bold text-gray-800">{item.en}</div>
                                      <div className="text-xs font-bold text-pink-400">{item.hi}</div>
                                    </div>
                                    <CheckCircle2 size={18} className="text-green-500" />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="p-8 rounded-[2.5rem] bg-blue-50 border border-blue-100 space-y-4">
                              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Info size={14} /> Expert Advice
                              </h4>
                              <div className="p-6 bg-white rounded-[1.8rem] border border-blue-100">
                                <p className="text-sm font-bold text-gray-700">{p.adviceEn}</p>
                                <p className="text-xs font-bold text-blue-400 mt-2 italic">{p.adviceHi}</p>
                              </div>
                              <button 
                                onClick={() => setActivePopup('generalHealth')}
                                className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-3"
                              >
                                <Phone size={20} />
                                Consult Doctor
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {matriTab === 'period' && (
                    <motion.div
                      key="period"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="p-8 rounded-[2.5rem] bg-pink-50 border border-pink-100 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-pink-500">
                            <Droplet size={24} />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Last Period Date (अंतिम मासिक धर्म की तिथि)</label>
                            <input 
                              type="date" 
                              value={lastPeriodDate}
                              onChange={(e) => setLastPeriodDate(e.target.value)}
                              className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-pink-400 font-bold text-gray-700"
                            />
                          </div>
                        </div>

                        {lastPeriodDate && (
                          <div className="p-6 bg-white rounded-[1.8rem] border border-pink-200 flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Next Predicted Cycle</h4>
                              <div className="text-2xl font-black text-pink-600">{predictNextPeriod(lastPeriodDate)}</div>
                            </div>
                            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-500">
                              <Calendar size={24} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-white border border-pink-100 rounded-3xl space-y-3">
                          <h4 className="font-black text-pink-700 flex items-center gap-2">
                            <Info size={18} />
                            Irregular Periods
                          </h4>
                          <p className="text-xs font-bold text-gray-500">Causes: Stress, weight changes, hormonal imbalance, or medical conditions like PCOS.</p>
                          <p className="text-[10px] text-pink-400 italic">कारण: तनाव, वजन में बदलाव, हार्मोनल असंतुलन, या पीसीओएस जैसी चिकित्सा स्थितियां।</p>
                        </div>
                        <div className="p-6 bg-white border border-pink-100 rounded-3xl space-y-3">
                          <h4 className="font-black text-pink-700 flex items-center gap-2">
                            <Droplets size={18} />
                            Bleeding in Pregnancy
                          </h4>
                          <p className="text-xs font-bold text-gray-500">Spotting can be normal in early pregnancy, but heavy bleeding requires immediate medical attention.</p>
                          <p className="text-[10px] text-pink-400 italic">गर्भावस्था के शुरुआती दिनों में स्पॉटिंग सामान्य हो सकती है, लेकिन भारी रक्तस्राव के लिए तत्काल चिकित्सा की आवश्यकता होती है।</p>
                        </div>
                      </div>

                      <div className="p-8 rounded-[2.5rem] bg-red-50 border border-red-100 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-red-500">
                            <AlertCircle size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-red-700">Irregular Bleeding?</h3>
                            <p className="text-xs font-bold text-red-400">असामान्य रक्तस्राव की रिपोर्ट करें</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-gray-600">
                          If you experience unexpected bleeding or spotting, it's important to track it. Most cases are normal, but consulting a doctor is always safer.
                        </p>
                        <button 
                          onClick={() => setActivePopup('generalHealth')}
                          className="w-full py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all flex items-center justify-center gap-3"
                        >
                          <Phone size={20} />
                          Consult Doctor (डॉक्टर से संपर्क करें)
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {matriTab === 'mentalHealth' && (
                    <motion.div
                      key="mentalHealth"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="p-8 rounded-[2.5rem] bg-blue-50 border border-blue-100 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-500">
                            <Brain size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-blue-700">Mental Health Support</h3>
                            <p className="text-xs font-bold text-blue-400">मानसिक स्वास्थ्य सहायता</p>
                          </div>
                        </div>
                        <div className="grid gap-4">
                          {counselors.map(c => (
                            <div key={c.id} className="p-6 bg-white rounded-3xl border border-blue-100 flex items-center justify-between">
                              <div>
                                <h4 className="font-black text-gray-800">{c.name}</h4>
                                <p className="text-xs font-bold text-blue-500">{c.specialty}</p>
                                <p className="text-[10px] text-gray-400">{c.specialtyHi}</p>
                              </div>
                              <button className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-black hover:bg-blue-600 transition-all">
                                {c.contact}
                              </button>
                            </div>
                          ))}
                        </div>
                        <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                          <MessageSquare size={20} />
                          Talk to Counselor (काउंसलर से बात करें)
                        </button>
                      </div>

                      <div className="p-8 rounded-[2.5rem] bg-pink-50 border border-pink-100 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-pink-500">
                            <Heart size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-pink-700">{postpartumDepressionInfo.title}</h3>
                            <p className="text-xs font-bold text-pink-400">{postpartumDepressionInfo.titleHi}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-gray-600">{postpartumDepressionInfo.desc}</p>
                        <p className="text-xs font-bold text-pink-400 italic">{postpartumDepressionInfo.descHi}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Symptoms (लक्षण)</h4>
                            <ul className="space-y-1">
                              {postpartumDepressionInfo.symptoms.map((s, i) => (
                                <li key={i} className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-pink-400 rounded-full" /> {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Management (प्रबंधन)</h4>
                            <ul className="space-y-1">
                              {postpartumDepressionInfo.management.map((m, i) => (
                                <li key={i} className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" /> {m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <button className="w-full py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 transition-all">
                          Emergency Help (आपातकालीन सहायता)
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {matriTab === 'sexualHealth' && (
                    <motion.div
                      key="sexualHealth"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="p-8 rounded-[2.5rem] bg-teal-50 border border-teal-100 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-teal-500">
                            <ShieldCheck size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-teal-700">Sexual Health (यौन स्वास्थ्य)</h3>
                            <p className="text-xs font-bold text-teal-400">Safe, respectful, and educational</p>
                          </div>
                        </div>
                        <div className="grid gap-6">
                          {sexualHealthInfo.map((info, i) => (
                            <div key={i} className="p-6 bg-white rounded-3xl border border-teal-100 space-y-2">
                              <h4 className="font-black text-teal-700">{info.title} / {info.titleHi}</h4>
                              <p className="text-sm font-bold text-gray-600">{info.desc}</p>
                              <p className="text-xs font-bold text-teal-400 italic">{info.descHi}</p>
                            </div>
                          ))}
                        </div>
                        <div className="p-6 bg-white rounded-3xl border border-teal-100 flex items-center justify-between">
                          <div>
                            <h4 className="font-black text-gray-800">Reproductive Health Awareness</h4>
                            <p className="text-xs font-bold text-teal-500">Know your body, stay healthy</p>
                          </div>
                          <button className="px-6 py-3 bg-teal-500 text-white rounded-xl text-xs font-black hover:bg-teal-600 transition-all">
                            Learn More
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {matriTab === 'pregnancyKit' && (
                    <motion.div
                      key="pregnancyKit"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="p-8 rounded-[2.5rem] bg-pink-50 border border-pink-100 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-pink-500">
                            <HelpCircle size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-pink-700">Pregnancy Kit Guide</h3>
                            <p className="text-xs font-bold text-pink-400">गर्भावस्था किट गाइड</p>
                          </div>
                        </div>
                        <div className="space-y-6">
                          {pregnancyKitSteps.map((s) => (
                            <div key={s.step} className="flex gap-6">
                              <div className="shrink-0 w-12 h-12 bg-pink-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-pink-200">
                                {s.step}
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-black text-gray-800">{s.title} / {s.titleHi}</h4>
                                <p className="text-sm font-bold text-gray-600">{s.desc}</p>
                                <p className="text-xs font-bold text-pink-400 italic">{s.descHi}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-8 bg-white rounded-[2rem] border-2 border-dashed border-pink-200 text-center space-y-4">
                          <div className="text-pink-600 font-black">Positive Result? (सकारात्मक परिणाम?)</div>
                          <p className="text-xs font-bold text-gray-500">Congratulations! Please consult a doctor to start your prenatal care journey.</p>
                          <button 
                            onClick={() => setMatriTab('diet')}
                            className="px-8 py-4 bg-pink-500 text-white rounded-2xl font-black hover:bg-pink-600 transition-all"
                          >
                            View Prenatal Plan
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {matriTab === 'postpartum' && (
                    <motion.div
                      key="postpartum"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="p-8 rounded-[2.5rem] bg-pink-50 border border-pink-100 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-pink-500">
                            <Calendar size={24} />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Delivery Date (प्रसव की तिथि)</label>
                            <input 
                              type="date" 
                              value={childDob}
                              onChange={(e) => setChildDob(e.target.value)}
                              className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-pink-400 font-bold text-gray-700"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
                          <Heart size={24} className="text-pink-500" />
                          Postpartum Symptoms (प्रसवोत्तर लक्षण)
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {postpartumSymptomChips.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                if (postpartumSymptoms.includes(s.en)) {
                                  setPostpartumSymptoms(prev => prev.filter(item => item !== s.en));
                                } else {
                                  setPostpartumSymptoms(prev => [...prev, s.en]);
                                }
                              }}
                              className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                                postpartumSymptoms.includes(s.en)
                                  ? 'bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-100'
                                  : 'bg-white border-slate-100 text-gray-600 hover:border-pink-200'
                              }`}
                            >
                              <div className="block">{s.en}</div>
                              <div className="text-[10px] opacity-80">{s.hi}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Add more details (अधिक विवरण जोड़ें)</h3>
                          <button 
                            onClick={() => startVoiceInput((text) => setPostpartumNote(prev => prev + (prev ? ' ' : '') + text))}
                            className={`flex items-center gap-2 ${isListening ? 'text-red-500 animate-pulse' : 'text-pink-500'} font-black text-xs hover:text-pink-600`}
                          >
                            <Mic size={14} /> {isListening ? 'Listening...' : 'Voice Input'}
                          </button>
                        </div>
                        <textarea 
                          value={postpartumNote}
                          onChange={(e) => setPostpartumNote(e.target.value)}
                          placeholder="How are you feeling today? / आप आज कैसा महसूस कर रही हैं?"
                          className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:ring-2 focus:ring-pink-400 font-bold text-gray-700 min-h-[150px]"
                        />
                        <button 
                          onClick={analyzePostpartumSymptoms}
                          disabled={isAnalyzingPostpartum}
                          className="w-full py-5 bg-pink-500 text-white rounded-2xl font-black hover:bg-pink-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-pink-200"
                        >
                          {isAnalyzingPostpartum ? (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Analyzing...
                            </div>
                          ) : (
                            <>
                              <Brain size={20} />
                              AI Health Check (एआई स्वास्थ्य जांच)
                            </>
                          )}
                        </button>
                      </div>

                      <AnimatePresence>
                        {postpartumPrediction && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-8 rounded-[2.5rem] bg-gradient-to-br from-pink-50 to-white border-2 border-pink-200 shadow-xl space-y-4"
                          >
                            <div className="flex items-center gap-3 text-pink-600">
                              <CheckCircle2 size={24} />
                              <h4 className="text-xl font-black">AI Analysis Result</h4>
                            </div>
                            <p className="text-gray-700 font-bold leading-relaxed whitespace-pre-line">
                              {postpartumPrediction}
                            </p>
                            <div className="pt-4 flex gap-4">
                              <button 
                                onClick={() => setActivePopup('generalHealth')}
                                className="flex-1 py-4 bg-pink-500 text-white rounded-2xl font-black hover:bg-pink-600 transition-all"
                              >
                                Consult Doctor
                              </button>
                              <button 
                                onClick={() => setPostpartumPrediction(null)}
                                className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all"
                              >
                                Clear
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="p-8 rounded-[2.5rem] bg-pink-50 border border-pink-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-pink-500 shadow-sm">
                            <Stethoscope size={28} />
                          </div>
                          <div>
                            <h4 className="font-black text-pink-700">Need Expert Advice?</h4>
                            <p className="text-xs font-bold text-pink-400">Doctor se Baat Kare</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setActivePopup('generalHealth')}
                          className="px-6 py-4 bg-pink-500 text-white rounded-2xl font-black hover:bg-pink-600 transition-all"
                        >
                          Talk to Doctor
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {matriTab === 'shop' && (
                    <motion.div
                      key="shop"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
                          <ShoppingBag size={24} className="text-pink-500" />
                          Baby Care Shop (शिशु दुकान)
                        </h3>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <ShoppingCart size={24} className="text-gray-400" />
                            {babyCart.length > 0 && (
                              <span className="absolute -top-2 -right-2 w-5 h-5 bg-pink-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                {babyCart.reduce((sum, item) => sum + item.quantity, 0)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {babyProducts.map((p) => (
                          <div key={p.id} className="p-6 rounded-[2.5rem] bg-white border-2 border-slate-50 hover:border-pink-100 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="text-lg font-black text-gray-800">{p.name}</h4>
                                <p className="text-xs font-bold text-pink-400">{p.nameHi}</p>
                              </div>
                              {p.discount > 0 && (
                                <div className="px-3 py-1 bg-pink-500 text-white text-[10px] font-black rounded-lg">
                                  {p.discount}% OFF
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 font-bold mb-6 line-clamp-2">{p.desc}</p>
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-black text-gray-800">₹{p.price}</div>
                              <button 
                                onClick={() => addToBabyCart(p)}
                                className="px-6 py-3 bg-pink-50 text-pink-500 rounded-xl text-xs font-black hover:bg-pink-500 hover:text-white transition-all flex items-center gap-2"
                              >
                                <Plus size={14} /> Add to Cart
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {babyCart.length > 0 && (
                        <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xl font-black">Your Cart</h4>
                            <span className="text-pink-400 font-black">{babyCart.length} Items</span>
                          </div>
                          <div className="space-y-3">
                            {babyCart.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
                                <div>
                                  <div className="font-bold">{item.name}</div>
                                  <div className="text-xs opacity-60">₹{item.price} x {item.quantity}</div>
                                </div>
                                <button 
                                  onClick={() => removeFromBabyCart(item.id)}
                                  className="p-2 text-red-400 hover:text-red-500"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                            <div>
                              <div className="text-xs opacity-60 uppercase font-black">Total Payable</div>
                              <div className="text-3xl font-black">₹{babyCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</div>
                            </div>
                            <button 
                              onClick={handleCheckout}
                              className="px-10 py-5 bg-pink-500 text-white rounded-2xl font-black hover:bg-pink-600 transition-all shadow-xl shadow-pink-900/20"
                            >
                              CHECKOUT
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-gray-400">
                  <Info size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Pragatipath Matri Seva Network</span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActivePopup('choice')}
                    className="px-6 py-3 text-gray-500 font-black text-xs hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )
}
        {activePopup === 'ambulance' && (
          <div key="ambulance" className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden relative border border-red-100"
            >
              {/* Emergency Header Banner */}
              <div className="bg-red-600 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl animate-pulse">
                      <Ambulance size={36} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black tracking-tight">AMBULANCE 24/7</h2>
                      <p className="text-red-100 font-bold text-sm uppercase tracking-widest">Emergency Response System</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActivePopup('generalHealth')}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Primary Emergency Action */}
                <div className="p-1 bg-red-50 rounded-[2rem]">
                  <a 
                    href="tel:108"
                    className="flex items-center justify-between p-6 bg-white rounded-[1.8rem] border-2 border-red-500 shadow-lg shadow-red-100 group hover:bg-red-500 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center text-white group-hover:bg-white group-hover:text-red-500 transition-colors">
                        <Phone size={32} fill="currentColor" />
                      </div>
                      <div>
                        <div className="text-3xl font-black text-red-600 group-hover:text-white transition-colors">108</div>
                        <div className="text-sm font-bold text-gray-500 group-hover:text-red-100 transition-colors uppercase">Govt. Emergency (सरकारी आपातकालीन)</div>
                      </div>
                    </div>
                    <div className="px-6 py-3 bg-red-600 text-white rounded-xl font-black group-hover:bg-white group-hover:text-red-600 transition-colors">
                      CALL NOW
                    </div>
                  </a>
                </div>

                {/* Other Suppliers */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Other Local Providers (अन्य स्थानीय प्रदाता)</h3>
                  <div className="grid gap-4">
                    {ambulanceSuppliers.filter(s => s.phone !== '108').map((s, i) => (
                      <div key={i} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm border border-red-50">
                            <Navigation size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">{s.name}</h4>
                            <p className="text-xs font-bold text-red-500 uppercase">{s.nameHi}</p>
                          </div>
                        </div>
                        <a 
                          href={`tel:${s.phone.replace(/\s/g, '')}`}
                          className="p-3 bg-white text-red-600 rounded-xl border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        >
                          <Phone size={20} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
                  <button 
                    onClick={() => setActivePopup('generalHealth')}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 group"
                  >
                    <ChevronDown className="group-hover:translate-y-1 transition-transform" />
                    Go Back to Dashboard (वापस डैशबोर्ड पर जाएं)
                  </button>
                  <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-tighter">
                    Pragatipath Emergency Network • Always Active
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activePopup === 'ashaWorker' && (
          <div key="ashaWorker" className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-purple-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden relative border border-purple-100"
            >
              {/* Header Banner */}
              <div className="bg-purple-600 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
                      <Users2 size={36} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black tracking-tight">ASHA WORKERS</h2>
                      <p className="text-purple-100 font-bold text-sm uppercase tracking-widest">Local Health Support System</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActivePopup(null)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Your Local ASHA Workers (आपकी स्थानीय आशा कार्यकर्ता)</h3>
                  <div className="grid gap-4">
                    {ashaWorkers.map((w, i) => (
                      <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm border border-purple-50">
                            <Users2 size={24} />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-800">{w.name}</h4>
                            <p className="text-sm font-bold text-purple-500 uppercase">{w.nameHi} • {w.area}</p>
                          </div>
                        </div>
                        <a 
                          href={`tel:${w.phone.replace(/\s/g, '')}`}
                          className="flex items-center gap-3 px-6 py-3 bg-white text-purple-600 rounded-xl border border-purple-100 hover:bg-purple-600 hover:text-white transition-all shadow-sm font-black"
                        >
                          <Phone size={20} />
                          CALL
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
                  <button 
                    onClick={() => setActivePopup(null)}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 group"
                  >
                    <ChevronDown className="group-hover:translate-y-1 transition-transform" />
                    Close
                  </button>
                  <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-tighter">
                    Pragatipath Community Health Network
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {activePopup === 'medicalShop' && (
          <div key="medicalShop" className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden relative border border-teal-100 flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#2E7D32] to-[#2AAE8A] p-8 text-white relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
                      <Store size={36} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black tracking-tight">MEDICAL SHOP / दवा दुकान</h2>
                      <p className="text-teal-50 font-bold text-sm uppercase tracking-widest">Your Trusted Rural Pharmacy</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setShowCart(!showCart)}
                      className="relative p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <ShoppingCart size={24} />
                      {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                          {cart.reduce((s, i) => s + i.quantity, 0)}
                        </span>
                      )}
                    </button>
                    <button 
                      onClick={() => setActivePopup('generalHealth')}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex">
                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {/* Search and OCR */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input 
                        type="text"
                        placeholder="Search medicines (दवाइयाँ खोजें)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#2AAE8A] focus:bg-white transition-all outline-none font-medium"
                      />
                    </div>
                    <div className="relative flex flex-col gap-2">
                      <input 
                        type="file" 
                        id="prescription-upload" 
                        className="hidden" 
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handlePrescriptionFileChange}
                      />
                      <div className="flex gap-2">
                        <label 
                          htmlFor="prescription-upload"
                          className="flex items-center justify-center gap-3 flex-1 py-4 rounded-2xl border-2 border-dashed bg-white border-[#2AAE8A]/30 text-[#2AAE8A] hover:bg-teal-50 hover:border-[#2AAE8A] transition-all cursor-pointer font-bold"
                        >
                          <Upload size={20} />
                          {selectedPrescription ? selectedPrescription.name : 'Select Prescription (पर्चा चुनें)'}
                        </label>
                        <button
                          onClick={handleScanPrescription}
                          disabled={!selectedPrescription || ocrLoading}
                          className={`px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 ${!selectedPrescription || ocrLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#2AAE8A] text-white hover:bg-[#238c6f] shadow-lg shadow-teal-100'}`}
                        >
                          {ocrLoading ? <Clock className="animate-spin" size={20} /> : <Search size={20} />}
                          {ocrLoading ? 'Scanning...' : 'Scan Prescription'}
                        </button>
                      </div>
                      {uploadMessage && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`text-xs font-bold text-center ${uploadMessage.includes('Failed') ? 'text-red-500' : 'text-[#2AAE8A]'}`}
                        >
                          {uploadMessage}
                        </motion.p>
                      )}
                    </div>
                  </div>

                  {/* OCR Results Display */}
                  {(detectedText || detectedMedicines.length > 0) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-200"
                    >
                      {detectedText && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={16} className="text-[#2AAE8A]" />
                            Detected Prescription Text (पहचाना गया पाठ)
                          </h4>
                          <div className="p-4 bg-white rounded-xl border border-slate-100 text-sm text-gray-600 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                            {detectedText}
                          </div>
                        </div>
                      )}

                      {detectedMedicines.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Pill size={16} className="text-[#2AAE8A]" />
                            Detected Medicines (पहचानी गई दवाइयाँ)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {detectedMedicines.map((med, idx) => (
                              <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl border border-teal-100 shadow-sm">
                                <div>
                                  <div className="font-bold text-gray-800">{med.en}</div>
                                  <div className="text-xs text-[#2AAE8A] font-medium">{med.hi}</div>
                                </div>
                                <div className="p-2 bg-teal-50 text-[#2AAE8A] rounded-lg">
                                  <CheckCircle2 size={16} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {detectedMedicines.length === 0 && detectedText && (
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 text-xs font-bold flex items-center gap-2">
                          <Info size={16} />
                          No specific medicines were clearly identified from the text. Please check the raw text above.
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Categories */}
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {medicineCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 py-2 rounded-full whitespace-nowrap font-bold text-sm transition-all ${selectedCategory === cat ? 'bg-[#2AAE8A] text-white shadow-lg shadow-teal-100' : 'bg-slate-100 text-gray-500 hover:bg-slate-200'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* OCR Results Highlight */}
                  {ocrResults.length > 0 && (
                    <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 flex items-center gap-3">
                      <Info size={20} className="text-[#2AAE8A]" />
                      <div className="text-sm">
                        <span className="font-bold text-[#2AAE8A]">Prescription Matches:</span> Found {ocrResults.length} medicines. Matching items are highlighted below.
                      </div>
                      <button 
                        onClick={() => setOcrResults([])}
                        className="ml-auto text-xs font-bold text-gray-400 hover:text-gray-600"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {/* Medicine Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {medicines
                      .filter(m => 
                        (selectedCategory === 'All' || m.category === selectedCategory) &&
                        (m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.nameHi.includes(searchTerm))
                      )
                      .map(m => {
                        const isMatched = ocrResults.some(res => m.name.toLowerCase().includes(res));
                        return (
                          <motion.div 
                            key={m.id}
                            layout
                            className={`p-6 rounded-[2rem] bg-white border-2 transition-all group ${isMatched ? 'border-[#2AAE8A] bg-teal-50/30' : 'border-slate-50 hover:border-teal-100 hover:shadow-xl'}`}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="text-xl font-black text-gray-800">{m.name}</h4>
                                <p className="text-sm font-bold text-[#2AAE8A]">{m.nameHi}</p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${m.available ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {m.available ? 'In Stock' : 'Out of Stock'}
                              </div>
                            </div>
                            
                            <p className="text-xs text-gray-400 mb-4 line-clamp-2">{m.desc}</p>
                            
                            <div className="flex items-center gap-4 mb-6">
                              <div className="flex-1">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Price (मूल्य)</div>
                                <div className="text-2xl font-black text-gray-800">₹{m.price}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prescription</div>
                                <div className={`text-xs font-black ${m.prescription ? 'text-orange-500' : 'text-gray-400'}`}>
                                  {m.prescription ? 'Required (हाँ)' : 'Not Required (नहीं)'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-6 text-[10px] font-bold text-gray-400">
                              <Store size={12} />
                              {m.shop}
                            </div>

                            <button 
                              disabled={!m.available}
                              onClick={() => addToCart(m)}
                              className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${m.available ? 'bg-[#2AAE8A] text-white shadow-lg shadow-teal-100 hover:bg-[#238c6f]' : 'bg-slate-100 text-gray-300 cursor-not-allowed'}`}
                            >
                              <Plus size={18} />
                              Add to Cart (कार्ट में जोड़ें)
                            </button>
                          </motion.div>
                        );
                      })}
                  </div>

                  {/* Nearby Shops Section */}
                  <div className="pt-8 border-t border-slate-100">
                    <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3">
                      <MapPin size={24} className="text-[#2AAE8A]" />
                      Nearby Pharmacies (नजदीकी दवा की दुकानें)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {medicalShopPharmacies.map((p, i) => (
                        <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-gray-800">{p.name}</h4>
                              <p className="text-xs font-bold text-[#2AAE8A]">{p.nameHi}</p>
                            </div>
                            <div className="px-2 py-1 bg-teal-500 text-white text-[10px] font-black rounded-lg">
                              {p.discount}% OFF
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                            <div className="flex items-center gap-1">
                              <Navigation size={12} />
                              {p.distance}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              {p.delivery ? 'Delivery Available' : 'No Delivery'}
                            </div>
                          </div>
                          <button className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-gray-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                            <Phone size={14} />
                            Contact Shop
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cart Sidebar */}
                <AnimatePresence>
                  {showCart && (
                    <motion.div 
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      className="w-full md:w-96 bg-slate-50 border-l border-slate-100 flex flex-col shadow-2xl z-20"
                    >
                      <div className="p-8 border-b border-slate-200 flex items-center justify-between bg-white">
                        <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                          <ShoppingCart size={24} className="text-[#2AAE8A]" />
                          Your Cart
                        </h3>
                        <button onClick={() => setShowCart(false)} className="p-2 text-gray-400 hover:text-gray-600">
                          <X size={20} />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {cart.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <ShoppingCart size={48} className="opacity-20" />
                            <p className="font-bold">Your cart is empty</p>
                          </div>
                        ) : (
                          cart.map(item => (
                            <div key={item.id} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                                <p className="text-[10px] text-gray-400">{item.shop}</p>
                                <div className="mt-2 flex items-center gap-3">
                                  <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-gray-600 hover:bg-slate-200">-</button>
                                  <span className="text-sm font-black">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-gray-600 hover:bg-slate-200">+</button>
                                </div>
                              </div>
                              <div className="text-right flex flex-col justify-between">
                                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 ml-auto">
                                  <Trash2 size={16} />
                                </button>
                                <div className="font-black text-gray-800">₹{item.price * item.quantity}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {cart.length > 0 && (
                        <div className="p-8 bg-white border-t border-slate-200 space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold text-gray-400">
                              <span>Subtotal (उप-योग)</span>
                              <span>₹{calculateTotal().subtotal}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-teal-600">
                              <span className="flex items-center gap-1"><Tag size={14} /> Discount (छूट)</span>
                              <span>-₹{calculateTotal().discount}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex justify-between text-xl font-black text-gray-800">
                              <span>Total (कुल मूल्य)</span>
                              <span>₹{calculateTotal().total}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 bg-slate-50 p-3 rounded-xl">
                            <Clock size={14} />
                            Est. Delivery: 30-45 mins
                          </div>

                          <button className="w-full py-5 bg-[#2E7D32] text-white rounded-2xl font-black text-lg shadow-xl shadow-green-100 hover:bg-[#1B5E20] transition-all">
                            Checkout (भुगतान करें)
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
