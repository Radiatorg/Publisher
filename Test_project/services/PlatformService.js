// services/userService.js
const db = require("../models");
const PlatformObj = db.Platform;

// Получение всех платформ 
exports.getPlatforms = async() =>{
  return await PlatformObj.findAll();
}

exports.getPlatformByName = async(name) =>{
  return await PlatformObj.findOne({ where: { name } });
}

// Добавление платформы
exports.create = async(name) => {
  return await PlatformObj.create({ name });
}

// Удаление платформы
exports.delete = async(id) => {
  const platform = await PlatformObj.findByPk(id);
  if (!platform) return null;

  await platform.destroy();
  return true;
}


