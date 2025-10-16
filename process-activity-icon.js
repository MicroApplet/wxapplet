const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 源文件和目标文件路径
const sourceIcon = path.join(__dirname, 'icon', 'activity.png');
const targetIcon = path.join(__dirname, 'icon', 'activity_green.png');

// 目标颜色（绿色）和尺寸
const targetColor = '#1aad19'; // 绿色
const iconSize = 40; // 目标尺寸

// 处理图标函数
async function processActivityIcon() {
  try {
    // 检查源文件是否存在
    if (!fs.existsSync(sourceIcon)) {
      console.error(`源文件不存在: ${sourceIcon}`);
      return;
    }

    // 使用sharp处理图标：调整尺寸并改变颜色
    await sharp(sourceIcon)
      .resize(iconSize, iconSize)
      .tint(targetColor)
      .toFile(targetIcon);

    console.log(`成功将activity图标处理为绿色并调整尺寸至${iconSize}x${iconSize}像素！`);
    console.log(`处理后的图标已保存至: ${targetIcon}`);

    // 验证处理后的图标信息
    const info = await sharp(targetIcon).metadata();
    console.log(`处理后的图标尺寸: ${info.width}x${info.height}像素`);

  } catch (error) {
    console.error(`处理图标时出错:`, error);
  }
}

// 运行脚本
processActivityIcon();