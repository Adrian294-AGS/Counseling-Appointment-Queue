const express = require("express");
const { body, param, validationResult } = require("express-validator");
const AppointmentModel = require("../models/appointment");
const { authenticate, authorize } = require("../middleware/auth");
const logger = require("../middleware/logger");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("student", "intake_staff"),
  [
    body("studentId")
      .matches(/^S-\d{5}$/)
      .withMessage("Invalid student ID format"),
    body("reasonCategory").isIn(["Academic", "Personal", "Career"]),
    body("requestedTime").isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, reasonCategory, requestedTime } = req.body;

    try {
      const appointmentId = await AppointmentModel.create({
        studentId,
        reasonCategory,
        requestedTime,
      });

      await AppointmentModel.recordAudit({
        userId: req.user.id,
        action: "CREATE",
        resourceType: "appointment",
        resourceId: appointmentId,
        details: { studentId, reasonCategory },
      });

      logger.info("Appointment request processed", {
        appointmentId,
        role: req.user.role,
      });

      const appointment = await AppointmentModel.findById(appointmentId);
      res.status(201).json(appointment);
    } catch (err) {
      logger.error("Create appointment error", { error: err.message });
      res.status(500).json({ error: "Failed to create appointment" });
    }
  },
);

router.get("/", authenticate, async (req, res) => {
  try {
    let appointments;

    if (req.user.role === "student") {
      appointments = await AppointmentModel.findByStudentId(req.user.studentId);
    } else {
      appointments = await AppointmentModel.findAll({
        status: req.query.status,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0,
      });
    }

    res.json(appointments);
  } catch (err) {
    logger.error("List appointments error", { error: err.message });
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

router.get(
  "/manual-review",
  authenticate,
  authorize("intake_staff", "counselor"),
  async (req, res) => {
    try {
      const appointments = await AppointmentModel.findAll({
        status: "permanent_failure_manual_review",
      });
      res.json(appointments);
    } catch (err) {
      logger.error("Manual review fetch error", { error: err.message });
      res.status(500).json({ error: "Failed to fetch manual review queue" });
    }
  },
);

router.get("/:id", authenticate, [param("id").isInt()], async (req, res) => {
  try {
    const appointment = await AppointmentModel.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (
      req.user.role === "student" &&
      appointment.student_id !== req.user.studentId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(appointment);
  } catch (err) {
    logger.error("Get appointment error", { error: err.message });
    res.status(500).json({ error: "Failed to fetch appointment" });
  }
});

router.patch(
  "/:id",
  authenticate,
  [
    param("id").isInt(),
    body("status").optional().isIn(["confirmed", "rescheduled", "cancelled"]),
    body("requestedTime").optional().isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const appointment = await AppointmentModel.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      if (
        req.user.role === "student" &&
        appointment.student_id !== req.user.studentId
      ) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updates = {};
      if (req.body.status) updates.status = req.body.status;
      if (req.body.requestedTime)
        updates.requested_time = req.body.requestedTime;

      await AppointmentModel.update(req.params.id, updates);

      await AppointmentModel.recordAudit({
        userId: req.user.id,
        action: "UPDATE",
        resourceType: "appointment",
        resourceId: parseInt(req.params.id),
        details: updates,
      });

      const updated = await AppointmentModel.findById(req.params.id);
      res.json(updated);
    } catch (err) {
      logger.error("Update appointment error", { error: err.message });
      res.status(500).json({ error: "Failed to update appointment" });
    }
  },
);

module.exports = router;
