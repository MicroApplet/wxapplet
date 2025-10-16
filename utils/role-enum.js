// 用户角色枚举定义
const RoleCode = {
  // 基础用户角色
  TOURIST: {
    code: 'tourist',
    bit: 1 << 0,
    desc: '游客'
  },
  AUTHENTICATED: {
    code: 'authenticated',
    bit: 1 << 1,
    desc: '登录用户'
  },
  PHONE: {
    code: 'phone',
    bit: 1 << 2,
    desc: '手机号用户'
  },
  WECHAT_USER: {
    code: 'wechat',
    bit: 1 << 3,
    desc: '微信用户'
  },
  ID_CARD_USER: {
    code: 'id-card',
    bit: 1 << 4,
    desc: '实名证件用户'
  },
  BANK_CARD_USER: {
    code: 'bank-card',
    bit: 1 << 7,
    desc: '银行卡用户'
  },

  // 员工角色（50位以上）
  EMPLOYEE: {
    code: 'employee',
    bit: 1 << 50,
    desc: '员工'
  },
  CMS: {
    code: 'cms:user',
    bit: 1 << 51,
    desc: '后管用户'
  },
  NURSE: {
    code: 'nurse',
    bit: 1 << 52,
    desc: '护工'
  },
  DOCTOR: {
    code: 'doctor',
    bit: 1 << 53,
    desc: '医师'
  },

  // 管理员角色
  SYSTEM: {
    code: 'system',
    bit: 1 << 63,
    desc: '系统管理员'
  },
  ROOT: {
    code: 'root',
    bit: Number.MAX_SAFE_INTEGER & ~(1 << 1), // 去除登录位
    desc: '超级管理员'
  }
};

/**
 * 角色判断工具类
 */
const RoleUtil = {
  /**
   * 检查源角色是否包含目标角色
   * @param {Object|Number} source - 源角色对象或角色位图
   * @param {Object|Number} target - 目标角色对象或角色位图
   * @returns {boolean} - 是否包含目标角色
   */
  contains(source, target) {
    if (!source || !target) {
      return false;
    }

    // 获取源角色位图
    const sourceBit = typeof source === 'number' ? source : source.bit;
    // 获取目标角色位图
    const targetBit = typeof target === 'number' ? target : target.bit;

    return (sourceBit & targetBit) === targetBit;
  },

  /**
   * 检查用户是否为普通用户（手机号用户或实名证件用户）
   * @param {Number} roleBit - 用户角色位图
   * @returns {boolean} - 是否为普通用户
   */
  isNormalUser(roleBit) {
    return this.contains(roleBit, RoleCode.PHONE) || this.contains(roleBit, RoleCode.ID_CARD_USER);
  },

  /**
   * 检查用户是否为专业用户（护工或医师）
   * @param {Number} roleBit - 用户角色位图
   * @returns {boolean} - 是否为专业用户
   */
  isProfessionalUser(roleBit) {
    return this.contains(roleBit, RoleCode.NURSE) || this.contains(roleBit, RoleCode.DOCTOR);
  },

  /**
   * 检查用户是否为员工
   * @param {Number} roleBit - 用户角色位图
   * @returns {boolean} - 是否为员工
   */
  isEmployee(roleBit) {
    return this.contains(roleBit, RoleCode.EMPLOYEE);
  },

  /**
   * 检查用户是否为管理员
   * @param {Number} roleBit - 用户角色位图
   * @returns {boolean} - 是否为管理员
   */
  isAdmin(roleBit) {
    return this.contains(roleBit, RoleCode.CMS) ||
           this.contains(roleBit, RoleCode.SYSTEM) ||
           this.contains(roleBit, RoleCode.ROOT);
  },

  /**
   * 获取用户角色描述
   * @param {Number} roleBit - 用户角色位图
   * @returns {Array} - 角色描述数组
   */
  getUserRoleDescriptions(roleBit) {
    if (!roleBit) {
      return ['未知用户'];
    }

    const descriptions = [];

    Object.values(RoleCode).forEach(role => {
      if (this.contains(roleBit, role)) {
        descriptions.push(role.desc);
      }
    });

    return descriptions.length > 0 ? descriptions : ['未知用户'];
  }
};

module.exports = {
  RoleCode,
  RoleUtil
};
