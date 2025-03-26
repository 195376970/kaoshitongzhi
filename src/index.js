const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

// 创建Express应用
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 设置静态文件目录
app.use(express.static(path.join(__dirname, '../public')));

// 首页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 存储部门状态信息
let departmentsData = [];
// 自动刷新状态
let autoRefreshEnabled = true;
// 记录状态变化时间
let statusChangeTime = {};

// 定义硬编码的招生单位数据
const knownDepartments = [
  { code: '001', name: '电气信息工程学院', contact: '芦老师', phone: '0371-86601602' },
  { code: '002', name: '材料与化学工程学院', contact: '田老师', phone: '0371-86608695' },
  { code: '003', name: '食品与生物工程学院', contact: '李老师', phone: '0371-86608672' },
  { code: '004', name: '机电工程学院', contact: '吕老师', phone: '0371-86601652' },
  { code: '005', name: '计算机科学与技术学院', contact: '孙老师', phone: '0371-86608807' },
  { code: '006', name: '经济与管理学院', contact: '冯老师崔老师', phone: '0371-86608837' },
  { code: '007', name: '艺术设计学院', contact: '黄老师', phone: '0371-86601689' },
  { code: '008', name: '马克思主义学院', contact: '李老师', phone: '0371-86608879' },
  { code: '009', name: '外国语学院', contact: '卢老师', phone: '0371-86601292' },
  { code: '010', name: '数学与信息科学学院', contact: '曹老师', phone: '0371-86601865' },
  { code: '011', name: '电子信息学院', contact: '翟老师', phone: '0371-86608910' },
  { code: '012', name: '政法学院', contact: '孙老师', phone: '0371-86608927' },
  { code: '013', name: '建筑环境工程学院', contact: '赵老师', phone: '0371-86608898' },
  { code: '014', name: '能源与动力工程学院', contact: '王老师', phone: '0371-86608939' },
  { code: '015', name: '体育学院', contact: '石老师', phone: '0371-86608985' },
  { code: '016', name: '软件学院', contact: '张老师', phone: '0371-86608857' },
  { code: '017', name: '烟草科学与工程学院', contact: '邢老师', phone: '0371-86608357' },
  { code: '018', name: '新能源学院', contact: '曹老师', phone: '0371-86608367' },
  { code: '019', name: '环境污染治理与生态修复河南省协同创新中心', contact: '田老师', phone: '0371-86608695' },
  { code: '020', name: '食品生产与安全河南省协同创新中心', contact: '孙老师', phone: '13673378236' },
  { code: '021', name: '智能隧道掘进装备河南省协同创新中心', contact: '房老师', phone: '15890655201' },
  { code: '022', name: '新能源汽车河南省协同创新中心', contact: '曹老师', phone: '0371-86608367' },
  { code: '023', name: '中原食品实验室', contact: '李老师', phone: '0371-86608672' }
];

// 定义爬取函数
async function scrapeWebsite() {
  try {
    console.log('开始抓取网页数据...');
    const targetUrl = 'https://yjsc.zzuli.edu.cn/2025/0325/c2878a330869/page.htm';
    const response = await axios.get(targetUrl);
    const $ = cheerio.load(response.data);
    
    // 收集所有链接，特别是可以点击的招生单位链接
    const allLinks = {};
    
    // 查找页面中所有的链接
    $('a').each((i, element) => {
      const link = $(element);
      const href = link.attr('href');
      const text = link.text().trim();
      
      // 仅收集包含特定模式的链接（如各学院的复试通知）
      if (href && (href.includes('/c2881a') || href.includes('/page.htm'))) {
        allLinks[text] = href;
        console.log(`找到链接: ${text} -> ${href}`);
      }
    });
    
    // 创建结果数组
    const currentDepartments = [];
    
    // 遍历已知的招生单位，检查它们是否有可点击的链接
    knownDepartments.forEach(dept => {
      let isClickable = false;
      let url = '';
      
      // 检查该单位名称是否有精确的链接匹配
      if (allLinks[dept.name]) {
        isClickable = true;
        url = allLinks[dept.name];
      } else {
        // 检查部分匹配（如简称或包含关系）
        for (const [text, linkUrl] of Object.entries(allLinks)) {
          // 检查链接文本是否包含部门名称或部门名称包含链接文本
          if (text.includes(dept.name) || dept.name.includes(text)) {
            isClickable = true;
            url = linkUrl;
            console.log(`部分匹配成功: ${dept.name} 匹配到 ${text}`);
            break;
          }
        }
      }
      
      // 如果URL是相对路径，转换为绝对路径
      if (url && !url.startsWith('http')) {
        url = new URL(url, targetUrl).href;
      }
      
      // 添加到结果数组
      currentDepartments.push({
        code: dept.code,
        name: dept.name,
        contact: dept.contact,
        phone: dept.phone,
        clickable: isClickable,
        url: url,
        changeTime: statusChangeTime[dept.name] || '-'
      });
    });
    
    // 检查状态变化并记录时间
    if (departmentsData.length > 0) {
      currentDepartments.forEach(dept => {
        const oldDept = departmentsData.find(d => d.name === dept.name);
        if (oldDept && oldDept.clickable !== dept.clickable) {
          // 状态发生变化，记录时间
          const now = new Date().toLocaleString();
          statusChangeTime[dept.name] = now;
          dept.changeTime = now;
          console.log(`部门 "${dept.name}" 状态变为: ${dept.clickable ? '可点击' : '不可点击'}`);
        }
      });
    } else {
      // 首次加载，不记录变化
      console.log('首次加载数据');
    }
    
    console.log(`找到 ${currentDepartments.length} 个招生单位，其中 ${currentDepartments.filter(d => d.clickable).length} 个可点击`);
    
    // 更新部门数据
    departmentsData = currentDepartments;
    
    return {
      departments: departmentsData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('抓取失败:', error.message);
    console.error(error.stack);
    return {
      departments: departmentsData, // 返回上次的数据
      timestamp: new Date().toISOString(),
      error: '数据抓取失败'
    };
  }
}

// 初始化WebSocket连接
io.on('connection', (socket) => {
  console.log('新的客户端连接');
  
  // 发送当前数据给新连接的客户端
  if (departmentsData.length > 0) {
    socket.emit('statusUpdate', { 
      departments: departmentsData,
      timestamp: new Date().toISOString()
    });
  } else {
    // 首次连接，立即抓取数据
    scrapeWebsite().then(data => {
      io.emit('statusUpdate', data);
    });
  }
  
  // 监听手动刷新请求
  socket.on('requestRefresh', async () => {
    console.log('收到手动刷新请求');
    const data = await scrapeWebsite();
    io.emit('statusUpdate', data);
  });
  
  // 监听自动刷新状态变更
  socket.on('setAutoRefresh', (enabled) => {
    autoRefreshEnabled = enabled;
    console.log('自动刷新状态变更为:', enabled);
  });
  
  // 客户端断开连接
  socket.on('disconnect', () => {
    console.log('客户端断开连接');
  });
});

// 自动刷新定时器
const startAutoRefresh = () => {
  setInterval(async () => {
    if (autoRefreshEnabled) {
      console.log('执行自动刷新...');
      const data = await scrapeWebsite();
      io.emit('statusUpdate', data);
    }
  }, 30000); // 30秒刷新一次
};

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器已启动，端口: ${PORT}`);
  console.log(`请访问 http://localhost:${PORT}`);
  
  // 启动时先抓取一次数据
  scrapeWebsite().then(data => {
    console.log(`初始化数据完成，发现 ${data.departments.length} 个招生单位`);
  });
  
  // 启动自动刷新
  startAutoRefresh();
});