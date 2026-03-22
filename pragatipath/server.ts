import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG and JPEG are supported.'));
    }
  }
});

// Medicine database for bilingual matching
const MEDICINE_DB = [
  { en: "Paracetamol", hi: "पैरासिटामोल" },
  { en: "Ibuprofen", hi: "इबुप्रोफेन" },
  { en: "Amoxicillin", hi: "एमोक्सिसिलिन" },
  { en: "Metformin", hi: "मेटफॉर्मिन" },
  { en: "Amlodipine", hi: "एम्लोडिपाइन" },
  { en: "Cetirizine", hi: "सेटीरिज़िन" },
  { en: "Azithromycin", hi: "एज़िथ्रोमाइसिन" },
  { en: "Omeprazole", hi: "ओमेप्राज़ोल" },
  { en: "Pantoprazole", hi: "पेंटोप्राज़ोल" },
  { en: "Ranitidine", hi: "रैनिटिडिन" },
  { en: "Diclofenac", hi: "डाइक्लोफेनाक" },
  { en: "Atorvastatin", hi: "एटोरवास्टेटिन" },
  { en: "Losartan", hi: "लोसार्टन" },
  { en: "Telmisartan", hi: "टेल्मिसार्टन" },
  { en: "Glimepiride", hi: "ग्लिमेपिराइड" },
  { en: "Ciprofloxacin", hi: "सिप्रोफ्लोक्सासिन" },
  { en: "Doxycycline", hi: "डॉक्सीसाइक्लिन" },
  { en: "Metronidazole", hi: "मेट्रोनिडाजोल" },
  { en: "Voglibose", hi: "वोग्लिबोसे" },
  { en: "Sitagliptin", hi: "सिटाग्लिप्टिन" }
];

const db = new Database("organisations.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS asha_workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    district TEXT,
    password_hash TEXT,
    role TEXT DEFAULT 'asha_worker',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS asha_voice_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asha_uid TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    transcript TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS asha_medicine_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asha_uid TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    medicines TEXT NOT NULL,
    status TEXT DEFAULT 'Requested',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS asha_escalations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asha_uid TEXT NOT NULL,
    asha_name TEXT,
    message TEXT NOT NULL,
    target TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  DROP TABLE IF EXISTS organisations;
  CREATE TABLE IF NOT EXISTS organisations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organisation_name TEXT NOT NULL,
    organisation_name_hi TEXT,
    category TEXT NOT NULL,
    category_hi TEXT,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    village TEXT NOT NULL,
    address TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    description TEXT NOT NULL,
    description_hi TEXT,
    services TEXT NOT NULL,
    members_count INTEGER NOT NULL,
    verified_status TEXT DEFAULT 'Pending Verification',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed initial data if empty
const count = db.prepare("SELECT COUNT(*) as count FROM organisations").get() as { count: number };
if (count.count === 0) {
  const seedOrgs = [
    {
      name: "Jaipur Farmers Collective",
      name_hi: "जयपुर किसान सामूहिक",
      cat: "Farmers Producer Organisation (FPO)",
      cat_hi: "किसान उत्पादक संगठन (FPO)",
      state: "Rajasthan",
      dist: "Jaipur",
      vill: "Rampur",
      addr: "Main Market, Rampur, Jaipur",
      contact: "Rajesh Kumar",
      phone: "9876543210",
      email: "jaipur.farmers@example.com",
      desc: "A collective of local farmers working together to improve crop yields and market access. We provide seeds, fertilizers, and training to our members.",
      desc_hi: "स्थानीय किसानों का एक समूह जो फसल की पैदावार और बाजार तक पहुंच में सुधार के लिए मिलकर काम कर रहा है। हम अपने सदस्यों को बीज, उर्वरक और प्रशिक्षण प्रदान करते हैं।",
      services: ["Seed Distribution", "Market Access", "Technical Training"],
      members: 150,
      status: "Verified"
    },
    {
      name: "Kishanpur Women's Crafts",
      name_hi: "किशनपुर महिला शिल्प",
      cat: "Handmade Crafts Collective",
      cat_hi: "हस्तनिर्मित शिल्प सामूहिक",
      state: "Rajasthan",
      dist: "Jodhpur",
      vill: "Kishanpur",
      addr: "Community Center, Kishanpur, Jodhpur",
      contact: "Sunita Devi",
      phone: "9123456789",
      email: "kishanpur.crafts@example.com",
      desc: "Empowering rural women through traditional handicraft production. We specialize in hand-woven textiles and pottery.",
      desc_hi: "पारंपरिक हस्तशिल्प उत्पादन के माध्यम से ग्रामीण महिलाओं को सशक्त बनाना। हम हाथ से बुने हुए वस्त्रों और मिट्टी के बर्तनों में विशेषज्ञ हैं।",
      services: ["Skill Development", "Product Marketing", "Micro-finance"],
      members: 45,
      status: "Verified"
    },
    {
      name: "Asha Rehabilitation Centre",
      name_hi: "आशा पुनर्वास केंद्र",
      cat: "Rehabilitation Centre",
      cat_hi: "पुनर्वास केंद्र",
      state: "Rajasthan",
      dist: "Jaipur",
      vill: "Rampur",
      addr: "Sector 4, Rampur, Jaipur",
      contact: "Dr. Amit Sharma",
      phone: "9822334455",
      email: "asha.rehab@example.com",
      desc: "Providing comprehensive rehabilitation services for individuals recovering from addiction and physical injuries. Our team offers physiotherapy and counseling.",
      desc_hi: "नशे की लत और शारीरिक चोटों से उबरने वाले व्यक्तियों के लिए व्यापक पुनर्वास सेवाएं प्रदान करना। हमारी टीम फिजियोथेरेपी और परामर्श प्रदान करती है।",
      services: ["Physiotherapy", "Counseling", "Occupational Therapy"],
      members: 25,
      status: "Verified"
    },
    {
      name: "Global Spoken English Academy",
      name_hi: "ग्लोबल स्पोकन इंग्लिश एकेडमी",
      cat: "Spoken English Centre",
      cat_hi: "स्पोकन इंग्लिश सेंटर",
      state: "Rajasthan",
      dist: "Udaipur",
      vill: "Rampur",
      addr: "Education Hub, Rampur, Udaipur",
      contact: "Meera Nair",
      phone: "9766554433",
      email: "global.english@example.com",
      desc: "Helping rural youth improve their communication skills in English to enhance employability. We focus on confidence building and grammar.",
      desc_hi: "ग्रामीण युवाओं को रोजगार क्षमता बढ़ाने के लिए अंग्रेजी में उनके संचार कौशल में सुधार करने में मदद करना। हम आत्मविश्वास निर्माण और व्याकरण पर ध्यान केंद्रित करते हैं।",
      services: ["Basic English", "Advanced Communication", "Interview Prep"],
      members: 60,
      status: "Verified"
    },
    {
      name: "Digital Saksharta Computer Centre",
      name_hi: "डिजिटल साक्षरता कंप्यूटर केंद्र",
      cat: "Computer Training Institute",
      cat_hi: "कंप्यूटर प्रशिक्षण संस्थान",
      state: "Rajasthan",
      dist: "Jodhpur",
      vill: "Kishanpur",
      addr: "Main Road, Kishanpur, Jodhpur",
      contact: "Suresh Verma",
      phone: "9544332211",
      email: "digital.saksharta@example.com",
      desc: "Bridging the digital divide by providing affordable computer education and internet access to the community. We offer basic and advanced IT courses.",
      desc_hi: "समुदाय को सस्ती कंप्यूटर शिक्षा और इंटरनेट पहुंच प्रदान करके डिजिटल विभाजन को कम करना। हम बुनियादी और उन्नत आईटी पाठ्यक्रम प्रदान करते हैं।",
      services: ["Basic IT Skills", "Web Development", "Internet Access"],
      members: 120,
      status: "Verified"
    }
  ];

  const insertStmt = db.prepare(`
    INSERT INTO organisations (
      organisation_name, organisation_name_hi, category, category_hi, state, district, village, address, 
      contact_person, phone, email, description, description_hi, services, members_count, verified_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  seedOrgs.forEach(org => {
    insertStmt.run(
      org.name, org.name_hi, org.cat, org.cat_hi, org.state, org.dist, org.vill, org.addr,
      org.contact, org.phone, org.email, org.desc, org.desc_hi, JSON.stringify(org.services), org.members, org.status
    );
  });
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is healthy" });
  });

  // ── ASHA Worker API Routes ─────────────────────────────────────────
  app.post("/api/asha/register", (req, res) => {
    const { uid, name, email, phone, district } = req.body;
    try {
      const stmt = db.prepare(`INSERT OR IGNORE INTO asha_workers (uid, name, email, phone, district) VALUES (?, ?, ?, ?, ?)`);
      stmt.run(uid, name, email || '', phone || '', district || '');
      const worker = db.prepare("SELECT * FROM asha_workers WHERE uid = ?").get(uid);
      res.json(worker);
    } catch (err) {
      res.status(500).json({ error: "Failed to register ASHA worker" });
    }
  });

  app.get("/api/asha/:uid", (req, res) => {
    const worker = db.prepare("SELECT * FROM asha_workers WHERE uid = ?").get(req.params.uid);
    if (!worker) return res.status(404).json({ error: "Not found" });
    res.json(worker);
  });

  app.post("/api/asha/voice-note", (req, res) => {
    const { asha_uid, patient_id, patient_name, transcript } = req.body;
    try {
      const stmt = db.prepare(`INSERT INTO asha_voice_notes (asha_uid, patient_id, patient_name, transcript) VALUES (?, ?, ?, ?)`);
      const info = stmt.run(asha_uid, patient_id, patient_name, transcript);
      res.json({ id: info.lastInsertRowid, message: "Voice note saved" });
    } catch (err) {
      res.status(500).json({ error: "Failed to save voice note" });
    }
  });

  app.get("/api/asha/:uid/voice-notes", (req, res) => {
    const notes = db.prepare("SELECT * FROM asha_voice_notes WHERE asha_uid = ? ORDER BY created_at DESC").all(req.params.uid);
    res.json(notes);
  });

  app.post("/api/asha/medicine-request", (req, res) => {
    const { asha_uid, patient_id, patient_name, medicines } = req.body;
    try {
      const stmt = db.prepare(`INSERT INTO asha_medicine_requests (asha_uid, patient_id, patient_name, medicines) VALUES (?, ?, ?, ?)`);
      const info = stmt.run(asha_uid, patient_id, patient_name, JSON.stringify(medicines));
      res.json({ id: info.lastInsertRowid, message: "Medicine request submitted" });
    } catch (err) {
      res.status(500).json({ error: "Failed to submit medicine request" });
    }
  });

  app.post("/api/asha/escalate", (req, res) => {
    const { asha_uid, asha_name, message, target } = req.body;
    try {
      const stmt = db.prepare(`INSERT INTO asha_escalations (asha_uid, asha_name, message, target) VALUES (?, ?, ?, ?)`);
      stmt.run(asha_uid, asha_name || '', message, target);
      io.emit("asha_escalation", { asha_uid, asha_name, message, target, time: new Date().toISOString() });
      res.json({ message: "Escalation sent" });
    } catch (err) {
      res.status(500).json({ error: "Failed to send escalation" });
    }
  });

  app.get("/api/asha/escalations", (req, res) => {
    const escalations = db.prepare("SELECT * FROM asha_escalations ORDER BY created_at DESC LIMIT 50").all();
    res.json(escalations);
  });

  // ── WebRTC LAN Signaling for mesh sync ─────────────────────────
  // Devices on same WiFi/hotspot use this to discover each other
  const meshPeers: Map<string, any> = new Map(); // deviceId → {ws, ownerUid}

  io.on('connection', (socket) => {
    let myDeviceId: string | null = null;

    socket.on('mesh_register', (data: { deviceId: string; ownerUid: string }) => {
      myDeviceId = data.deviceId;
      meshPeers.set(data.deviceId, { socket, ownerUid: data.ownerUid });
      // Send list of existing peers (same ownerUid = same ASHA worker's devices)
      const peers = Array.from(meshPeers.entries())
        .filter(([id, p]) => id !== data.deviceId && p.ownerUid === data.ownerUid)
        .map(([id]) => id);
      socket.emit('mesh_peers', { peers });
      // Notify others
      peers.forEach(peerId => {
        meshPeers.get(peerId)?.socket.emit('mesh_peer_joined', { deviceId: data.deviceId });
      });
    });

    socket.on('mesh_signal', (data: { to: string; payload: any }) => {
      meshPeers.get(data.to)?.socket.emit('mesh_signal', {
        from: myDeviceId,
        payload: data.payload
      });
    });

    socket.on('disconnect', () => {
      if (myDeviceId) meshPeers.delete(myDeviceId);
    });
  });
  // ── End ASHA Worker API Routes ─────────────────────────────────────

  app.get("/api/organisations", (req, res) => {
    const orgs = db.prepare("SELECT * FROM organisations ORDER BY created_at DESC").all();
    res.json(orgs);
  });

  app.post("/api/organisations", (req, res) => {
    const {
      organisation_name,
      category,
      state,
      district,
      village,
      address,
      contact_person,
      phone,
      email,
      description,
      services,
      members_count
    } = req.body;

    try {
      const stmt = db.prepare(`
        INSERT INTO organisations (
          organisation_name, category, state, district, village, address, 
          contact_person, phone, email, description, services, members_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const info = stmt.run(
        organisation_name,
        category,
        state,
        district,
        village,
        address,
        contact_person,
        phone,
        email,
        description,
        JSON.stringify(services),
        members_count
      );

      const newOrg = db.prepare("SELECT * FROM organisations WHERE id = ?").get(info.lastInsertRowid);
      
      // Broadcast to all clients
      io.emit("organisation_added", newOrg);
      
      res.status(201).json(newOrg);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to register organisation" });
    }
  });

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
