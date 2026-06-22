import MaintenanceTask from "../models/MaintenanceTask.model.js";

export const listMaintenanceTasks = async (req, res) => {
  try {
    const tasks = await MaintenanceTask.find({ school: req.user.school })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch maintenance tasks" });
  }
};

export const createMaintenanceTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;
    if (!title) return res.status(400).json({ success: false, message: "Title is required" });

    const task = await MaintenanceTask.create({
      title,
      description,
      priority,
      dueDate: dueDate || null,
      school: req.user.school,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create maintenance task" });
  }
};

export const updateMaintenanceTask = async (req, res) => {
  try {
    const task = await MaintenanceTask.findOneAndUpdate(
      { _id: req.params.id, school: req.user.school },
      { $set: req.body },
      { new: true }
    );
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update maintenance task" });
  }
};

export const deleteMaintenanceTask = async (req, res) => {
  try {
    const task = await MaintenanceTask.findOneAndDelete({ _id: req.params.id, school: req.user.school });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete maintenance task" });
  }
};
