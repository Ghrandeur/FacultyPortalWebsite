// New Features Routes: Newsletter, Marketplace, Departments, Parliamentarians, Social Handles, Companion
// Add this to backend/server.js or include in a separate routes file

const express = require("express");
const router = express.Router();
const { db, admin } = require("../config/firebase");

function toSnapshotArray(snapshot) {
  const items = [];
  snapshot.forEach((doc) => {
    items.push({ id: doc.id, ...doc.data() });
  });
  return items;
}

function serverTimestamp() {
  return admin.firestore.FieldValue.serverTimestamp();
}

// ==================== NEWSLETTER ROUTES ====================

// Subscribe to newsletter
router.post("/newsletter/subscribe", async (req, res) => {
  try {
    const { regNo, department, email } = req.body;

    if (!regNo || !department || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingSnapshot = await db.collection("newsletter_subscribers").where("email", "==", email).get();

    if (!existingSnapshot.empty) {
      return res.status(400).json({ error: "Email already subscribed" });
    }

    const docRef = await db.collection("newsletter_subscribers").add({
      regNo,
      department,
      email,
      subscribedAt: serverTimestamp(),
      active: true,
    });

    res.json({ success: true, id: docRef.id, message: "Subscription successful" });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    res.status(500).json({ error: error.message || "Failed to subscribe" });
  }
});

// Get all newsletters
router.get("/newsletter/all", async (req, res) => {
  try {
    const querySnapshot = await db.collection("newsletters").orderBy("createdAt", "desc").get();
    res.json(toSnapshotArray(querySnapshot));
  } catch (error) {
    console.error("Get newsletters error:", error);
    res.status(500).json({ error: error.message || "Failed to get newsletters" });
  }
});

// Create newsletter (Admin)
router.post("/newsletter/create", async (req, res) => {
  try {
    const { title, content, category, preview } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content required" });
    }

    const docRef = await db.collection("newsletters").add({
      title,
      content,
      category: category || "General",
      preview: preview || content.substring(0, 150),
      createdAt: serverTimestamp(),
    });

    res.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Create newsletter error:", error);
    res.status(500).json({ error: error.message || "Failed to create newsletter" });
  }
});

// ==================== MARKETPLACE ROUTES ====================

// Get all marketplace items
router.get("/marketplace/items", async (req, res) => {
  try {
    const querySnapshot = await db.collection("marketplace_items").orderBy("createdAt", "desc").get();
    res.json(toSnapshotArray(querySnapshot));
  } catch (error) {
    console.error("Get marketplace items error:", error);
    res.status(500).json({ error: error.message || "Failed to get items" });
  }
});

// Create marketplace item
router.post("/marketplace/item/create", async (req, res) => {
  try {
    const { name, category, price, description, contactPhone, contactWhatsApp } = req.body;

    if (!name || !category || !price || !description || !contactPhone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const docRef = await db.collection("marketplace_items").add({
      name,
      category,
      price: parseFloat(price),
      description,
      contactPhone,
      contactWhatsApp: contactWhatsApp || null,
      image: null,
      views: 0,
      createdAt: serverTimestamp(),
    });

    res.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Create marketplace item error:", error);
    res.status(500).json({ error: error.message || "Failed to create item" });
  }
});

// ==================== DEPARTMENTS ROUTES ====================

// Get all departments
router.get("/departments/all", async (req, res) => {
  try {
    const querySnapshot = await db.collection("departments").orderBy("order", "asc").get();
    res.json(toSnapshotArray(querySnapshot));
  } catch (error) {
    console.error("Get departments error:", error);
    res.status(500).json({ error: error.message || "Failed to get departments" });
  }
});

// Create department (Admin)
router.post("/departments/create", async (req, res) => {
  try {
    const { name, description, hod, contact, location, programs, achievements, order } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: "Name and description required" });
    }

    const docRef = await db.collection("departments").add({
      name,
      description,
      hod: hod || "N/A",
      contact: contact || "N/A",
      location: location || "N/A",
      programs: programs || [],
      achievements: achievements || "",
      order: order || 0,
      logo: null,
    });

    res.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Create department error:", error);
    res.status(500).json({ error: error.message || "Failed to create department" });
  }
});

// ==================== PARLIAMENTARIANS ROUTES ====================

// Get all parliamentarians
router.get("/parliamentarians/all", async (req, res) => {
  try {
    const querySnapshot = await db.collection("parliamentarians").orderBy("order", "asc").get();
    res.json(toSnapshotArray(querySnapshot));
  } catch (error) {
    console.error("Get parliamentarians error:", error);
    res.status(500).json({ error: error.message || "Failed to get parliamentarians" });
  }
});

// Create parliamentarian (Admin)
router.post("/parliamentarians/create", async (req, res) => {
  try {
    const { name, position, department, bio, portfolio, email, phone, achievements, order } = req.body;

    if (!name || !position) {
      return res.status(400).json({ error: "Name and position required" });
    }

    const docRef = await db.collection("parliamentarians").add({
      name,
      position,
      department: department || "N/A",
      bio: bio || "",
      portfolio: portfolio || "",
      email: email || "",
      phone: phone || "",
      achievements: achievements || [],
      image: null,
      order: order || 0,
    });

    res.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Create parliamentarian error:", error);
    res.status(500).json({ error: error.message || "Failed to create parliamentarian" });
  }
});

// ==================== SOCIAL HANDLES ROUTES ====================

// Get all social handles
router.get("/social-handles/all", async (req, res) => {
  try {
    const querySnapshot = await db.collection("social_handles").get();
    res.json(toSnapshotArray(querySnapshot));
  } catch (error) {
    console.error("Get social handles error:", error);
    res.status(500).json({ error: error.message || "Failed to get social handles" });
  }
});

// Create social handle (Admin)
router.post("/social-handles/create", async (req, res) => {
  try {
    const { name, platform, handle, url, type } = req.body;

    if (!name || !platform) {
      return res.status(400).json({ error: "Name and platform required" });
    }

    const docRef = await db.collection("social_handles").add({
      name,
      platform,
      handle: handle || "",
      url: url || "",
      type: type || "main",
    });

    res.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Create social handle error:", error);
    res.status(500).json({ error: error.message || "Failed to create social handle" });
  }
});

// ==================== COMPANION ROUTES ====================

// Get all advisors
router.get("/companion/advisors", async (req, res) => {
  try {
    const querySnapshot = await db.collection("advisors").orderBy("order", "asc").get();
    res.json(toSnapshotArray(querySnapshot));
  } catch (error) {
    console.error("Get advisors error:", error);
    res.status(500).json({ error: error.message || "Failed to get advisors" });
  }
});

// Get all FAQ
router.get("/companion/faq", async (req, res) => {
  try {
    const querySnapshot = await db.collection("faq").orderBy("order", "asc").get();
    res.json(toSnapshotArray(querySnapshot));
  } catch (error) {
    console.error("Get FAQ error:", error);
    res.status(500).json({ error: error.message || "Failed to get FAQ" });
  }
});

// Post question/topic to companion
router.post("/companion/question", async (req, res) => {
  try {
    const { studentName, email, category, title, content, anonymous } = req.body;

    if (!studentName && !anonymous) {
      return res.status(400).json({ error: "Name required if not anonymous" });
    }
    if (!category || !title || !content) {
      return res.status(400).json({ error: "Category, title, and content required" });
    }

    const docRef = await db.collection("companion_topics").add({
      studentName: anonymous ? "Anonymous" : studentName,
      email,
      category,
      title,
      content,
      preview: content.substring(0, 100),
      replies: 0,
      createdAt: serverTimestamp(),
      anonymous: anonymous || false,
    });

    res.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Post question error:", error);
    res.status(500).json({ error: error.message || "Failed to post question" });
  }
});

// Get all companion topics
router.get("/companion/topics", async (req, res) => {
  try {
    const querySnapshot = await db.collection("companion_topics").orderBy("createdAt", "desc").get();
    res.json(toSnapshotArray(querySnapshot));
  } catch (error) {
    console.error("Get topics error:", error);
    res.status(500).json({ error: error.message || "Failed to get topics" });
  }
});

module.exports = router;
