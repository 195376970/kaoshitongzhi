# 考试通知监控系统

![技术栈](https://img.shields.io/badge/技术栈-Node.js_|_Express_|_WebSocket-blue)
![状态](https://img.shields.io/badge/状态-已完成-success)

## 项目介绍

作为毕业设计项目，我开发了这个监控系统，用于实时监测郑州轻工业大学研究生招生网站的通知信息更新。在考研复试期间，需要经常查看各学院的通知，这个系统可以自动监控并及时提醒，避免错过重要信息。

## 功能特点

- **实时监控**: 定时抓取招生网站信息，检测指定院系的通知更新
- **即时提醒**: 当检测到新通知时，通过桌面通知和声音提醒用户
- **状态展示**: 清晰展示各院系通知状态，直观了解最新情况
- **历史记录**: 记录状态变更历史，便于追溯通知发布时间
- **模拟测试**: 内置测试功能，方便验证系统是否正常工作

## 技术栈

- **前端**: HTML5, CSS3, JavaScript
- **后端**: Node.js, Express
- **实时通信**: Socket.IO
- **数据获取**: Axios, Cheerio

## 项目结构

```
kaoshitongzhi/
├── public/              // 前端静态文件
│   └── index.html       // 主页面
├── src/
│   └── index.js         // 后端主程序
├── package.json         // 项目配置
└── README.md            // 项目说明
```

## 核心代码片段

```javascript
// 使用cheerio解析网页内容
const $ = cheerio.load(response.data);
const links = $('a');

// 提取所有可能的招生通知链接
links.each((index, element) => {
  const linkText = $(element).text().trim();
  const href = $(element).attr('href');
  
  if (linkText && href) {
    allLinks.push({
      text: linkText,
      url: href
    });
  }
});
```

## 开发过程中的挑战与收获

### 挑战
1. **网页解析**: 学习如何使用Cheerio库解析HTML页面
2. **WebSocket应用**: 第一次使用Socket.IO实现实时通信
3. **前后端结合**: 将Node.js后端与前端页面有效连接

### 收获
1. 掌握了基本的Web爬虫技术
2. 理解了实时通信的原理和实现方法
3. 提升了JavaScript全栈开发能力
4. 学会了如何设计简单但实用的用户界面

## 如何运行

```bash
# 安装依赖
npm install

# 启动服务
npm start
```

启动后访问 `http://localhost:3000` 即可使用系统。

## 未来计划

作为一个初学者项目，还有很多可以改进的地方：

- 添加用户登录功能，支持个性化设置
- 优化爬虫算法，提高信息获取准确率
- 增加邮件通知功能
- 改进UI设计，提升用户体验

## 致谢

感谢学校老师在毕业设计过程中的指导，以及同学们的宝贵建议。通过这个项目，我不仅解决了自己的实际需求，也学习了很多网站开发的知识。

---

**开发者**: [您的姓名] - 计算机科学与技术专业应届毕业生