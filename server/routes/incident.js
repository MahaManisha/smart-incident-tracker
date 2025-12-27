const express = require("express");
const router = express.Router();
const Incident = require("../models/Incident");
const { verifyToken, authorizeRoles } = require("../utils/auth");

// Create Incident (Reporter only)
router.post("/", verifyToken, authorizeRoles("REPORTER"), async (req, res) => {
  try {
    const { title, description, severity, slaDue } = req.body;
    const incident = await Incident.create({
      title,
      description,
      severity,
      reporter: req.user.id,
      slaDue
    });
    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all incidents (Admin sees all, Responder sees assigned)
router.get("/", verifyToken, async (req, res) => {
  try {
    let incidents;
    if (req.user.role === "ADMIN") {
      incidents = await Incident.find().populate("reporter responder teamId");
    } else if (req.user.role === "RESPONDER") {
      incidents = await Incident.find({ responder: req.user.id }).populate("reporter responder teamId");
    } else {
      incidents = await Incident.find({ reporter: req.user.id }).populate("reporter responder teamId");
    }
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update incident status (Responder only)
router.put("/:id", verifyToken, authorizeRoles("RESPONDER"), async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });

    const { status, responder } = req.body;
    if (status) incident.status = status;
    if (responder) incident.responder = responder;
    await incident.save();

    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
