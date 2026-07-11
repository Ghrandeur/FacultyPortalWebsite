// New Features Routes: Newsletter, Marketplace, Departments, Parliamentarians, Social Handles, Companion
// Add this to backend/server.js or include in a separate routes file

const express = require("express");
const router = express.Router();
const { db, admin } = require("../config/firebase");
const { sendSubscriptionConfirmation, sendNewsletterToAll } = require("../config/email");

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

async function deleteCompanionTopicAndReplies(topicId) {
  const topicRef = db.collection("companion_topics").doc(topicId);
  const repliesSnapshot = await db.collection("companion_replies").where("topicId", "==", topicId).get();
  const batch = db.batch();

  batch.delete(topicRef);
  repliesSnapshot.forEach((replyDoc) => {
    batch.delete(replyDoc.ref);
  });

  await batch.commit();
}

// ==================== NEWSLETTER ROUTES ====================

// Subscribe to newsletter
router.post("/newsletter/subscribe", async (req, res) => {
  try {
    const { regNo, department, email } = req.body;
    console.log('Newsletter subscribe request:', { regNo, department, email });

    if (!regNo || !department || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingSnapshot = await db.collection("newsletter_subscribers").where("email", "==", email).get();

    if (!existingSnapshot.empty) {
      console.log('Newsletter subscribe: already exists', email);
      return res.json({
        success: true,
        message: "Subscription already exists",
        emailConfirmation: true
      });
    }

    const docRef = await db.collection("newsletter_subscribers").add({
      regNo,
      department,
      email,
      subscribedAt: serverTimestamp(),
      active: true,
    });

    const emailResult = { success: false, error: "Email delivery is being processed in the background" };
    void sendSubscriptionConfirmation(email, regNo)
      .then((result) => {
        console.log("Newsletter confirmation email result for", email, result);
      })
      .catch((emailError) => {
        console.warn("Newsletter confirmation email failed, but subscription was saved:", emailError && emailError.message ? emailError.message : emailError);
      });

    res.json({
      success: true,
      id: docRef.id,
      message: "Subscription successful",
      emailConfirmation: false,
      emailResult
    });
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

    // Send newsletter to all active subscribers
    const newsletterData = {
      id: docRef.id,
      title,
      content,
      category: category || "General",
      preview: preview || content.substring(0, 150),
    };

    const emailResult = await sendNewsletterToAll(newsletterData, db);

    res.json({ 
      success: true, 
      id: docRef.id,
      emailDistribution: emailResult
    });
  } catch (error) {
    console.error("Create newsletter error:", error);
    res.status(500).json({ error: error.message || "Failed to create newsletter" });
  }
});

// Get single newsletter
router.get("/newsletter/:id", async (req, res) => {
  try {
    const doc = await db.collection("newsletters").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Newsletter not found" });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Get newsletter error:", error);
    res.status(500).json({ error: error.message || "Failed to get newsletter" });
  }
});

// Update newsletter (Admin)
router.put("/newsletter/:id", async (req, res) => {
  try {
    const { title, content, category, preview } = req.body;
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (preview !== undefined) updateData.preview = preview;
    
    await db.collection("newsletters").doc(req.params.id).update(updateData);
    res.json({ success: true, message: "Newsletter updated" });
  } catch (error) {
    console.error("Update newsletter error:", error);
    res.status(500).json({ error: error.message || "Failed to update newsletter" });
  }
});

// Delete newsletter (Admin)
router.delete("/newsletter/:id", async (req, res) => {
  try {
    await db.collection("newsletters").doc(req.params.id).delete();
    res.json({ success: true, message: "Newsletter deleted" });
  } catch (error) {
    console.error("Delete newsletter error:", error);
    res.status(500).json({ error: error.message || "Failed to delete newsletter" });
  }
});

// Get all newsletter subscribers (Admin only)
router.get("/newsletter/subscribers/list", async (req, res) => {
  try {
    const subscribersSnapshot = await db.collection("newsletter_subscribers").get();
    const subscribers = [];
    const activeCount = 0;

    subscribersSnapshot.forEach((doc) => {
      subscribers.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    const active = subscribers.filter(s => s.active).length;
    const inactive = subscribers.filter(s => !s.active).length;

    res.json({
      success: true,
      total: subscribers.length,
      active,
      inactive,
      subscribers,
    });
  } catch (error) {
    console.error("Get subscribers error:", error);
    res.status(500).json({ error: error.message || "Failed to get subscribers" });
  }
});

// Unsubscribe from newsletter
router.post("/newsletter/unsubscribe", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const subscribersSnapshot = await db.collection("newsletter_subscribers")
      .where("email", "==", email)
      .get();

    if (subscribersSnapshot.empty) {
      return res.status(404).json({ error: "Subscriber not found" });
    }

    // Mark as inactive instead of deleting
    const batch = admin.firestore().batch();
    subscribersSnapshot.forEach((doc) => {
      batch.update(doc.ref, { active: false });
    });

    await batch.commit();
    res.json({ success: true, message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    res.status(500).json({ error: error.message || "Failed to unsubscribe" });
  }
});

// Test send subscription confirmation (for admin/testing)
router.post('/newsletter/test-send', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    const result = await sendSubscriptionConfirmation(email, name || 'Test User');
    res.json({ success: true, result });
  } catch (err) {
    console.error('Test send error:', err);
    res.status(500).json({ success: false, error: err && err.message ? err.message : String(err) });
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

// Get single marketplace item
router.get("/marketplace/:id", async (req, res) => {
  try {
    const doc = await db.collection("marketplace_items").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Get marketplace item error:", error);
    res.status(500).json({ error: error.message || "Failed to get item" });
  }
});

// Update marketplace item (Admin)
router.put("/marketplace/:id", async (req, res) => {
  try {
    const { name, category, price, description, contactPhone, contactWhatsApp } = req.body;
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (description !== undefined) updateData.description = description;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (contactWhatsApp !== undefined) updateData.contactWhatsApp = contactWhatsApp;
    
    await db.collection("marketplace_items").doc(req.params.id).update(updateData);
    res.json({ success: true, message: "Item updated" });
  } catch (error) {
    console.error("Update marketplace item error:", error);
    res.status(500).json({ error: error.message || "Failed to update item" });
  }
});

// Delete marketplace item (Admin)
router.delete("/marketplace/:id", async (req, res) => {
  try {
    await db.collection("marketplace_items").doc(req.params.id).delete();
    res.json({ success: true, message: "Item deleted" });
  } catch (error) {
    console.error("Delete marketplace item error:", error);
    res.status(500).json({ error: error.message || "Failed to delete item" });
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
    const { name, description, hod, president, contact, email, location, website, programs, achievements, order } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: "Name and description required" });
    }

    const docRef = await db.collection("departments").add({
      name,
      description,
      hod: hod || "N/A",
      president: president || "N/A",
      contact: contact || "N/A",
      email: email || "",
      location: location || "N/A",
      website: website || "",
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

// Get single department
router.get("/departments/:id", async (req, res) => {
  try {
    const doc = await db.collection("departments").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Department not found" });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Get department error:", error);
    res.status(500).json({ error: error.message || "Failed to get department" });
  }
});

// Update department (Admin)
router.put("/departments/:id", async (req, res) => {
  try {
    const { name, description, hod, president, contact, email, location, website, programs, achievements, order } = req.body;
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (hod !== undefined) updateData.hod = hod;
    if (president !== undefined) updateData.president = president;
    if (contact !== undefined) updateData.contact = contact;
    if (email !== undefined) updateData.email = email;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (programs !== undefined) updateData.programs = programs;
    if (achievements !== undefined) updateData.achievements = achievements;
    if (order !== undefined) updateData.order = order;
    
    await db.collection("departments").doc(req.params.id).update(updateData);
    res.json({ success: true, message: "Department updated" });
  } catch (error) {
    console.error("Update department error:", error);
    res.status(500).json({ error: error.message || "Failed to update department" });
  }
});

// Delete department (Admin)
router.delete("/departments/:id", async (req, res) => {
  try {
    await db.collection("departments").doc(req.params.id).delete();
    res.json({ success: true, message: "Department deleted" });
  } catch (error) {
    console.error("Delete department error:", error);
    res.status(500).json({ error: error.message || "Failed to delete department" });
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

// Get single parliamentarian
router.get("/parliamentarians/:id", async (req, res) => {
  try {
    const doc = await db.collection("parliamentarians").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Parliamentarian not found" });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Get parliamentarian error:", error);
    res.status(500).json({ error: error.message || "Failed to get parliamentarian" });
  }
});

// Update parliamentarian (Admin)
router.put("/parliamentarians/:id", async (req, res) => {
  try {
    const { name, position, department, bio, portfolio, email, phone, achievements, order } = req.body;
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (position !== undefined) updateData.position = position;
    if (department !== undefined) updateData.department = department;
    if (bio !== undefined) updateData.bio = bio;
    if (portfolio !== undefined) updateData.portfolio = portfolio;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (achievements !== undefined) updateData.achievements = achievements;
    if (order !== undefined) updateData.order = order;
    
    await db.collection("parliamentarians").doc(req.params.id).update(updateData);
    res.json({ success: true, message: "Parliamentarian updated" });
  } catch (error) {
    console.error("Update parliamentarian error:", error);
    res.status(500).json({ error: error.message || "Failed to update parliamentarian" });
  }
});

// Delete parliamentarian (Admin)
router.delete("/parliamentarians/:id", async (req, res) => {
  try {
    await db.collection("parliamentarians").doc(req.params.id).delete();
    res.json({ success: true, message: "Parliamentarian deleted" });
  } catch (error) {
    console.error("Delete parliamentarian error:", error);
    res.status(500).json({ error: error.message || "Failed to delete parliamentarian" });
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

// Get single social handle
router.get("/social-handles/:id", async (req, res) => {
  try {
    const doc = await db.collection("social_handles").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Social handle not found" });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Get social handle error:", error);
    res.status(500).json({ error: error.message || "Failed to get social handle" });
  }
});

// Update social handle (Admin)
router.put("/social-handles/:id", async (req, res) => {
  try {
    const { name, platform, handle, url, type } = req.body;
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (platform !== undefined) updateData.platform = platform;
    if (handle !== undefined) updateData.handle = handle;
    if (url !== undefined) updateData.url = url;
    if (type !== undefined) updateData.type = type;
    
    await db.collection("social_handles").doc(req.params.id).update(updateData);
    res.json({ success: true, message: "Social handle updated" });
  } catch (error) {
    console.error("Update social handle error:", error);
    res.status(500).json({ error: error.message || "Failed to update social handle" });
  }
});

// Delete social handle (Admin)
router.delete("/social-handles/:id", async (req, res) => {
  try {
    await db.collection("social_handles").doc(req.params.id).delete();
    res.json({ success: true, message: "Social handle deleted" });
  } catch (error) {
    console.error("Delete social handle error:", error);
    res.status(500).json({ error: error.message || "Failed to delete social handle" });
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

// Get single companion topic
router.get("/companion/topics/:id", async (req, res) => {
  try {
    const doc = await db.collection("companion_topics").doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Topic not found" });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Get topic error:", error);
    res.status(500).json({ error: error.message || "Failed to get topic" });
  }
});

// Delete companion topic (Admin - for moderation)
router.delete("/companion/topics/:id", async (req, res) => {
  try {
    await deleteCompanionTopicAndReplies(req.params.id);
    res.json({ success: true, message: "Topic deleted" });
  } catch (error) {
    console.error("Delete topic error:", error);
    res.status(500).json({ error: error.message || "Failed to delete topic" });
  }
});

module.exports = router;
