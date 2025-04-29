const { Platform } = require('../models');
const PlatformService = require('../services/PlatformService');
const catchAsync = require('../utils/catchAsync');


// Получение всех платформ
exports.getPlatforms = catchAsync(async (req, res) => {
  try {
    const platforms = await PlatformService.getPlatforms();
    res.status(200).json(platforms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve accounts' });
  }
})

// Создание новой платформы
exports.create = catchAsync(async (req, res) => {
  try {
    const { name } = req.body;
    const platform = await PlatformService.create({ name });

    res.status(201).json({ message: "Платформа добавлена", platform });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create platform' });
  }
})

// Удаление платформы по ID
exports.delete = catchAsync(async (req, res) => {
  try {
    const { id } = req.params;
    const success = await PlatformService.delete(id);
    
    if (!success) return res.status(404).json({ error: 'platform not found' });

    res.status(200).json({ message: "Платформа удалена" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete platform' });
  }
})

