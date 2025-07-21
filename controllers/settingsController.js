
const Settings = require('../models/Settings');

exports.getSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId; // Set by your authMiddleware ✅

        if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID missing in token' });
    }

    // Fetch settings for the authenticated tenant
    const settings = await Settings.findOne({ tenantId });

    if (!settings) {
      return res.status(404).json({ error: 'Settings not found for this tenant' });
    }

    return res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Server error fetching settings' });
  }
};
