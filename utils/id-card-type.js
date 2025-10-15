// 证件类型枚举
const IdCardType = {
  ResidentIdentityCard: {
    code: '01',
    enName: 'ResidentIdentityCard',
    cnName: '居民身份证',
    sensitiveLeft: 6,
    sensitiveRight: 4
  },
  HouseholdRegister: {
    code: '02',
    enName: 'HouseholdRegister',
    cnName: '户口簿',
    sensitiveLeft: 6,
    sensitiveRight: 4
  },
  DriverLicense: {
    code: '03',
    enName: 'DriverLicense',
    cnName: '驾驶证',
    sensitiveLeft: 6,
    sensitiveRight: 4
  },
  SocialSecurityCard: {
    code: '04',
    enName: 'SocialSecurityCard',
    cnName: '社会保障卡',
    sensitiveLeft: 6,
    sensitiveRight: 4
  },
  MilitaryID: {
    code: '05',
    enName: 'MilitaryID',
    cnName: '军官证',
    sensitiveLeft: 1,
    sensitiveRight: 1
  },
  PoliceOfficerID: {
    code: '06',
    enName: 'PoliceOfficerID',
    cnName: '警官证',
    sensitiveLeft: 1,
    sensitiveRight: 1
  },
  OfficerID: {
    code: '07',
    enName: 'OfficerID',
    cnName: '公务员证',
    sensitiveLeft: 1,
    sensitiveRight: 1
  },
  HongKongMacaoPass: {
    code: '08',
    enName: 'HongKongMacaoPass',
    cnName: '港澳通行证',
    sensitiveLeft: 3,
    sensitiveRight: 3
  },
  TaiwanPass: {
    code: '09',
    enName: 'TaiwanPass',
    cnName: '台湾通行证',
    sensitiveLeft: 3,
    sensitiveRight: 3
  },
  BorderPass: {
    code: '10',
    enName: 'BorderPass',
    cnName: '边境通行证',
    sensitiveLeft: 3,
    sensitiveRight: 3
  },
  SeamanBook: {
    code: '11',
    enName: 'SeamanBook',
    cnName: '海员证',
    sensitiveLeft: 3,
    sensitiveRight: 3
  },
  LawyerLicense: {
    code: '12',
    enName: 'LawyerLicense',
    cnName: '律师执业证',
    sensitiveLeft: 3,
    sensitiveRight: 3
  },
  ForResCard: {
    code: '13',
    enName: 'ForResCard',
    cnName: '外国人居住证',
    sensitiveLeft: 3,
    sensitiveRight: 3
  },
  Passport: {
    code: '99',
    enName: 'Passport',
    cnName: '护照',
    sensitiveLeft: 6,
    sensitiveRight: 4
  },
  
  // 获取所有证件类型列表
  getAllTypes: function() {
    return Object.values(this).filter(item => typeof item === 'object');
  },
  
  // 根据代码获取证件类型
  getById: function(code) {
    return this.getAllTypes().find(item => item.code === code);
  },
  
  // 根据代码获取证件类型中文名
  getCnNameById: function(code) {
    const type = this.getById(code);
    return type ? type.cnName : '';
  },
  
  // 对证件号码进行脱敏处理
  maskIdCardNumber: function(code, idNumber) {
    const type = this.getById(code);
    if (!type || !idNumber) return idNumber;
    
    const left = idNumber.substring(0, type.sensitiveLeft);
    const right = idNumber.substring(idNumber.length - type.sensitiveRight);
    const middle = '*'.repeat(idNumber.length - type.sensitiveLeft - type.sensitiveRight);
    
    return left + middle + right;
  }
};

module.exports = IdCardType;