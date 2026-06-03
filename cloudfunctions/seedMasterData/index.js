const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const USERS = [
  { _id: 'user-student', username: 'student', password: '123456', role: 'student', displayName: '学生', status: 'active' },
  { _id: 'user-driver1', username: 'driver1', password: '123456', role: 'driver', displayName: '司机1', driverBusId: 'S1', driverBusName: '校巴1号', status: 'active' },
  { _id: 'user-driver2', username: 'driver2', password: '123456', role: 'driver', displayName: '司机2', driverBusId: 'S2', driverBusName: '校巴2号', status: 'active' },
  { _id: 'user-driver3', username: 'driver3', password: '123456', role: 'driver', displayName: '司机3', driverBusId: 'S3', driverBusName: '校巴3号', status: 'active' },
  { _id: 'user-driver4', username: 'driver4', password: '123456', role: 'driver', displayName: '司机4', driverBusId: 'S4', driverBusName: '校巴4号', status: 'active' },
  { _id: 'user-driver5', username: 'driver5', password: '123456', role: 'driver', displayName: '司机5', driverBusId: 'S5', driverBusName: '校巴5号', status: 'active' },
  { _id: 'user-driver6', username: 'driver6', password: '123456', role: 'driver', displayName: '司机6', driverBusId: 'S6', driverBusName: '校巴6号', status: 'active' },
  { _id: 'user-driver7', username: 'driver7', password: '123456', role: 'driver', displayName: '司机7', driverBusId: 'S7', driverBusName: '校巴7号', status: 'active' },
  { _id: 'user-driver8', username: 'driver8', password: '123456', role: 'driver', displayName: '司机8', driverBusId: 'S8', driverBusName: '校巴8号', status: 'active' },
  { _id: 'user-admin', username: 'admin', password: '123456', role: 'admin', displayName: '管理员', status: 'active' }
]

const BUSES = [
  { _id: 'S1', busName: '校巴1号', lineId: 'line1', lineName: '一号线', direction: 'forward', capacity: 40, defaultSpeed: 0.12, status: 'active' },
  { _id: 'S2', busName: '校巴2号', lineId: 'line1', lineName: '一号线', direction: 'backward', capacity: 40, defaultSpeed: 0.11, status: 'active' },
  { _id: 'S3', busName: '校巴3号', lineId: 'line2', lineName: '二号线', direction: 'forward', capacity: 40, defaultSpeed: 0.10, status: 'active' },
  { _id: 'S4', busName: '校巴4号', lineId: 'line2', lineName: '二号线', direction: 'backward', capacity: 40, defaultSpeed: 0.09, status: 'active' },
  { _id: 'S5', busName: '校巴5号', lineId: 'line3', lineName: '三号线', direction: 'forward', capacity: 40, defaultSpeed: 0.10, status: 'active' },
  { _id: 'S6', busName: '校巴6号', lineId: 'line3', lineName: '三号线', direction: 'backward', capacity: 40, defaultSpeed: 0.11, status: 'active' },
  { _id: 'S7', busName: '校巴7号', lineId: 'line4', lineName: '四号线', direction: 'forward', capacity: 40, defaultSpeed: 0.14, status: 'active' },
  { _id: 'S8', busName: '校巴8号', lineId: 'line4', lineName: '四号线', direction: 'backward', capacity: 40, defaultSpeed: 0.12, status: 'active' }
]

const ROUTES = [
  { _id: 'line1', lineName: '一号线', color: '#2563EBCC', stations: ['(北区)西南门站', '(北区)一号门站', '中国银行站', '明华小区站', '青山湖大道站', '(南区)东门站', '青山湖大道(地铁)站', '(南区)南门站', '谢家村(地铁)站', '卫生站站', '上海北路站', '(北区)一号门站(返程)', '(北区)西南门站(终点)'], status: 'active' },
  { _id: 'line2', lineName: '二号线', color: '#F97316CC', stations: ['国威路(地铁)站', '青湖村公寓站', '上海北路北站', '青湖大厦站', '欢乐街站', '青湖夜市站', '南昌中学北门站', '青山湖大道站', '南昌中学东门站', '南昌中学东南门站', '火炬广场(地铁)站', '国威路(地铁)站(返程)'], status: 'active' },
  { _id: 'line3', lineName: '三号线', color: '#22C55ECC', stations: ['国威路(地铁)站', '(北区)二号门站', '天虹站', '农贸市场站', '江大南路南站', '江西水利电力大学站', '彭家桥(地铁)站', '普瑞眼科站', '梦时代站', '谢家村(地铁)站', '工商银行站', '520Park站', '699文化创意园站', '南昌市十七中站', '北京银行站', '玉河站', '彭桥路站', '少春中学站', '培英学院站', '金域名都站', '体育公园站', '湖滨公园站', '国威路(地铁)站(返程)'], status: 'active' },
  { _id: 'line4', lineName: '四号线', color: '#A855F7CC', stations: ['国威路(地铁)站', '火炬广场(地铁)站', '农业银行站', '休闲公园站', '梁万(地铁)站', '泰豪科技园站', '人民政府站', '艺术中心站', '南洋花园站', '万象汇站', '高新大道(地铁)站', '肿瘤医院站', '南昌师范学院站', '江西管理职业学院站', '特殊教育学校站', '公安局站', '天御国际站', '(北区)二号门站', '国威路(地铁)站(返程)'], status: 'active' }
]

const STATIONS = [
  { _id: 'station-guowei', stationName: '国威路(地铁)站', latitude: 28.687174, longitude: 115.941528, aliases: ['国威路(地铁)站(返程)'], status: 'active' },
  { _id: 'station-west-south', stationName: '(北区)西南门站', latitude: 28.681771, longitude: 115.935563, aliases: ['(北区)西南门站(终点)'], status: 'active' },
  { _id: 'station-gate1', stationName: '(北区)一号门站', latitude: 28.681774, longitude: 115.937272, aliases: ['(北区)一号门站(返程)'], status: 'active' },
  { _id: 'station-bank', stationName: '中国银行站', latitude: 28.681674, longitude: 115.94134, aliases: [], status: 'active' },
  { _id: 'station-minghua', stationName: '明华小区站', latitude: 28.681718, longitude: 115.945882, aliases: [], status: 'active' },
  { _id: 'station-qshd', stationName: '青山湖大道站', latitude: 28.681719, longitude: 115.948821, aliases: [], status: 'active' },
  { _id: 'station-east-gate', stationName: '(南区)东门站', latitude: 28.678345, longitude: 115.948715, aliases: [], status: 'active' },
  { _id: 'station-qshd-metro', stationName: '青山湖大道(地铁)站', latitude: 28.67438, longitude: 115.948847, aliases: [], status: 'active' },
  { _id: 'station-south-gate', stationName: '(南区)南门站', latitude: 28.674341, longitude: 115.944534, aliases: [], status: 'active' },
  { _id: 'station-xiejiacun', stationName: '谢家村(地铁)站', latitude: 28.674293, longitude: 115.940778, aliases: [], status: 'active' },
  { _id: 'station-weisheng', stationName: '卫生站站', latitude: 28.677902, longitude: 115.940651, aliases: [], status: 'active' },
  { _id: 'station-shanghai', stationName: '上海北路站', latitude: 28.679955, longitude: 115.940609, aliases: [], status: 'active' },
  { _id: 'station-qhcgy', stationName: '青湖村公寓站', latitude: 28.688452, longitude: 115.94072, aliases: [], status: 'active' },
  { _id: 'station-shanghai-north', stationName: '上海北路北站', latitude: 28.690278, longitude: 115.940747, aliases: [], status: 'active' },
  { _id: 'station-qhds', stationName: '青湖大厦站', latitude: 28.692304, longitude: 115.942095, aliases: [], status: 'active' },
  { _id: 'station-huanle', stationName: '欢乐街站', latitude: 28.6914, longitude: 115.944122, aliases: [], status: 'active' },
  { _id: 'station-night', stationName: '青湖夜市站', latitude: 28.694105, longitude: 115.944385, aliases: [], status: 'active' },
  { _id: 'station-middle-north', stationName: '南昌中学北门站', latitude: 28.694244, longitude: 115.945702, aliases: [], status: 'active' },
  { _id: 'station-middle-east', stationName: '南昌中学东门站', latitude: 28.692234, longitude: 115.947897, aliases: [], status: 'active' },
  { _id: 'station-middle-southeast', stationName: '南昌中学东南门站', latitude: 28.691007, longitude: 115.947663, aliases: [], status: 'active' },
  { _id: 'station-huoju', stationName: '火炬广场(地铁)站', latitude: 28.687987, longitude: 115.947922, aliases: [], status: 'active' },
  { _id: 'station-gate2', stationName: '(北区)二号门站', latitude: 28.682915, longitude: 115.940516, aliases: [], status: 'active' },
  { _id: 'station-tianhong', stationName: '天虹站', latitude: 28.68168, longitude: 115.937267, aliases: [], status: 'active' },
  { _id: 'station-market', stationName: '农贸市场站', latitude: 28.679086, longitude: 115.937177, aliases: [], status: 'active' },
  { _id: 'station-jiangda', stationName: '江大南路南站', latitude: 28.676092, longitude: 115.937059, aliases: [], status: 'active' },
  { _id: 'station-waterpower', stationName: '江西水利电力大学站', latitude: 28.676115, longitude: 115.935497, aliases: [], status: 'active' },
  { _id: 'station-pengjiaqiao', stationName: '彭家桥(地铁)站', latitude: 28.674355, longitude: 115.933712, aliases: [], status: 'active' },
  { _id: 'station-purui', stationName: '普瑞眼科站', latitude: 28.674385, longitude: 115.936302, aliases: [], status: 'active' },
  { _id: 'station-mengshidai', stationName: '梦时代站', latitude: 28.674406, longitude: 115.940158, aliases: [], status: 'active' },
  { _id: 'station-gongshang', stationName: '工商银行站', latitude: 28.670054, longitude: 115.940669, aliases: [], status: 'active' },
  { _id: 'station-520park', stationName: '520Park站', latitude: 28.667984, longitude: 115.940659, aliases: [], status: 'active' },
  { _id: 'station-699', stationName: '699文化创意园站', latitude: 28.665918, longitude: 115.940674, aliases: [], status: 'active' },
  { _id: 'station-no17', stationName: '南昌市十七中站', latitude: 28.664742, longitude: 115.940674, aliases: [], status: 'active' },
  { _id: 'station-bank-beijing', stationName: '北京银行站', latitude: 28.662911, longitude: 115.936953, aliases: [], status: 'active' },
  { _id: 'station-yuhe', stationName: '玉河站', latitude: 28.664097, longitude: 115.93512, aliases: [], status: 'active' },
  { _id: 'station-pengqiao', stationName: '彭桥路站', latitude: 28.668996, longitude: 115.934674, aliases: [], status: 'active' },
  { _id: 'station-shaochun', stationName: '少春中学站', latitude: 28.66957, longitude: 115.934338, aliases: [], status: 'active' },
  { _id: 'station-peiying', stationName: '培英学院站', latitude: 28.670838, longitude: 115.933593, aliases: [], status: 'active' },
  { _id: 'station-jinyu', stationName: '金域名都站', latitude: 28.677059, longitude: 115.927373, aliases: [], status: 'active' },
  { _id: 'station-sports', stationName: '体育公园站', latitude: 28.680365, longitude: 115.926874, aliases: [], status: 'active' },
  { _id: 'station-lake', stationName: '湖滨公园站', latitude: 28.684814, longitude: 115.926292, aliases: [], status: 'active' },
  { _id: 'station-agriculture', stationName: '农业银行站', latitude: 28.688902, longitude: 115.953533, aliases: [], status: 'active' },
  { _id: 'station-leisure', stationName: '休闲��园站', latitude: 28.689182, longitude: 115.954733, aliases: [], status: 'active' },
  { _id: 'station-liangwan', stationName: '梁万(地铁)站', latitude: 28.690271, longitude: 115.960594, aliases: [], status: 'active' },
  { _id: 'station-taihao', stationName: '泰豪科技园站', latitude: 28.687647, longitude: 115.960375, aliases: [], status: 'active' },
  { _id: 'station-government', stationName: '人民政府站', latitude: 28.683378, longitude: 115.960532, aliases: [], status: 'active' },
  { _id: 'station-art', stationName: '艺术中心站', latitude: 28.680835, longitude: 115.960502, aliases: [], status: 'active' },
  { _id: 'station-nanyang', stationName: '南洋花园站', latitude: 28.677065, longitude: 115.960495, aliases: [], status: 'active' },
  { _id: 'station-wanxiang', stationName: '万象汇站', latitude: 28.675692, longitude: 115.960417, aliases: [], status: 'active' },
  { _id: 'station-gaoxin', stationName: '高新大道(地铁)站', latitude: 28.674423, longitude: 115.960429, aliases: [], status: 'active' },
  { _id: 'station-cancer', stationName: '肿瘤医院站', latitude: 28.674403, longitude: 115.953989, aliases: [], status: 'active' },
  { _id: 'station-normal', stationName: '南昌师范学院站', latitude: 28.679183, longitude: 115.952611, aliases: [], status: 'active' },
  { _id: 'station-management', stationName: '江西管理职业学院站', latitude: 28.680965, longitude: 115.952687, aliases: [], status: 'active' },
  { _id: 'station-special', stationName: '特殊教育学校站', latitude: 28.681809, longitude: 115.952065, aliases: [], status: 'active' },
  { _id: 'station-police', stationName: '公安局站', latitude: 28.681811, longitude: 115.945989, aliases: [], status: 'active' },
  { _id: 'station-tianyu', stationName: '天御国际站', latitude: 28.681822, longitude: 115.94052, aliases: [], status: 'active' }
]

async function upsertDocs(collectionName, docs) {
  const now = Date.now()
  const tasks = docs.map(doc => {
    const { _id, ...rest } = doc
    return db.collection(collectionName).doc(_id).set({
      data: {
        ...rest,
        createdAt: rest.createdAt || now,
        updatedAt: now
      }
    })
  })

  const chunkSize = 10
  for (let i = 0; i < tasks.length; i += chunkSize) {
    await Promise.all(tasks.slice(i, i + chunkSize))
  }
}

const SEED_MAP = {
  users: USERS,
  buses: BUSES,
  routes: ROUTES,
  stations: STATIONS
}

exports.main = async (event) => {
  const collection = event && event.collection

  if (collection) {
    const docs = SEED_MAP[collection]
    if (!docs) {
      return {
        success: false,
        message: '未知集合',
        available: Object.keys(SEED_MAP)
      }
    }

    await upsertDocs(collection, docs)
    return {
      success: true,
      collection,
      count: docs.length
    }
  }

  return {
    success: false,
    message: '请按集合分批初始化',
    available: Object.keys(SEED_MAP),
    example: { collection: 'users' }
  }
}
