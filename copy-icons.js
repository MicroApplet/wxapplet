const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 源目录和目标目录
const sourceDir = path.join(__dirname, 'node_modules', '@tabler', 'icons-png', 'icons', 'outline');
const targetDir = path.join(__dirname, 'icon');

// 图标列表和对应的颜色
const icons = [
  { name: 'home', activeName: 'home_active' },
  { name: 'login', activeName: 'login_active' },
  { name: 'user', activeName: 'user_active' },
  { name: 'video', activeName: 'video_active' },
  { name: 'file-text', activeName: 'file-text_active' },
  { name: 'activity', activeName: 'activity_active' }
];

// 颜色配置
const colors = {
  normal: '#999999', // app.json中的color
  active: '#1aad19'  // app.json中的selectedColor
};

// 图标尺寸配置（微信小程序tabBar推荐尺寸）
const iconSize = 40;

// 确保目标目录存在
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 处理图标
async function processIcons() {
  for (const icon of icons) {
    const sourcePath = path.join(sourceDir, `${icon.name}.png`);
    const targetNormalPath = path.join(targetDir, `${icon.name}.png`);
    const targetActivePath = path.join(targetDir, `${icon.activeName}.png`);

    try {
      // 检查源文件是否存在
      if (!fs.existsSync(sourcePath)) {
        console.error(`源文件不存在: ${sourcePath}`);
        continue;
      }

      // 复制普通图标（转换颜色并调整尺寸）
      await sharp(sourcePath)
        .resize(iconSize, iconSize)
        .tint(colors.normal)
        .toFile(targetNormalPath);

      // 创建激活状态的图标（转换颜色并调整尺寸）
      await sharp(sourcePath)
        .resize(iconSize, iconSize)
        .tint(colors.active)
        .toFile(targetActivePath);

      console.log(`已复制并处理图标: ${icon.name} 和 ${icon.activeName}`);
    } catch (error) {
      console.error(`处理图标 ${icon.name} 时出错:`, error);
    }
  }

  console.log('所有图标处理完成！');
}

// 运行脚本
processIcons();
