// 证件类型枚举
const IdCardType = {
  ResidentIdentityCard: {
    code: '01',
    enName: 'ResidentIdentityCard',
    cnName: '居民身份证'
  },
  HouseholdRegister: {
    code: '02',
    enName: 'HouseholdRegister',
    cnName: '户口簿'
  },
  DriverLicense: {
    code: '03',
    enName: 'DriverLicense',
    cnName: '驾驶证'
  },
  SocialSecurityCard: {
    code: '04',
    enName: 'SocialSecurityCard',
    cnName: '社会保障卡'
  },
  MilitaryID: {
    code: '05',
    enName: 'MilitaryID',
    cnName: '军官证'
  },
  PoliceOfficerID: {
    code: '06',
    enName: 'PoliceOfficerID',
    cnName: '警官证'
  },
  OfficerID: {
    code: '07',
    enName: 'OfficerID',
    cnName: '公务员证'
  },
  HongKongMacaoPass: {
    code: '08',
    enName: 'HongKongMacaoPass',
    cnName: '港澳通行证'
  },
  TaiwanPass: {
    code: '09',
    enName: 'TaiwanPass',
    cnName: '台湾通行证'
  },
  BorderPass: {
    code: '10',
    enName: 'BorderPass',
    cnName: '边境通行证'
  },
  SeamanBook: {
    code: '11',
    enName: 'SeamanBook',
    cnName: '海员证'
  },
  LawyerLicense: {
    code: '12',
    enName: 'LawyerLicense',
    cnName: '律师执业证'
  },
  ForResCard: {
    code: '13',
    enName: 'ForResCard',
    cnName: '外国人居住证'
  },
  Passport: {
    code: '99',
    enName: 'Passport',
    cnName: '护照'
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
  }
};

module.exports = IdCardType;