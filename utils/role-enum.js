// 用户角色枚举定义
// 用户角色枚举定义
const RoleCode = {
  // 基础用户角色
  TOURIST: {
    code: 'tourist',
    bit: BigInt(1) << BigInt(0),
    desc: '游客'
  },
  AUTHENTICATED: {
    code: 'authenticated',
    bit: BigInt(1) << BigInt(1),
    desc: '登录用户'
  },
  PHONE: {
    code: 'phone',
    bit: BigInt(1) << BigInt(2),
    desc: '手机号用户'
  },
  WECHAT_USER: {
    code: 'wechat',
    bit: BigInt(1) << BigInt(3),
    desc: '微信用户'
  },
  ID_CARD_USER: {
    code: 'id-card',
    bit: BigInt(1) << BigInt(4),
    desc: '实名证件用户'
  },
  BANK_CARD_USER: {
    code: 'bank-card',
    bit: BigInt(1) << BigInt(7),
    desc: '银行卡用户'
  },

  // 员工角色（50位以上）
  EMPLOYEE: {
    code: 'employee',
    bit: BigInt(1) << BigInt(50),
    desc: '员工'
  },
  CMS: {
    code: 'cms:user',
    bit: BigInt(1) << BigInt(51),
    desc: '后管用户'
  },
  NURSE: {
    code: 'nurse',
    bit: BigInt(1) << BigInt(52),
    desc: '护工'
  },
  DOCTOR: {
    code: 'doctor',
    bit: BigInt(1) << BigInt(53),
    desc: '医师'
  },

  // 管理员角色
  SYSTEM: {
    code: 'system',
    bit: BigInt(1) << BigInt(63),
    desc: '系统管理员'
  },
  ROOT: {
    code: 'root',
    bit: BigInt('9223372036854775807') & ~(BigInt(1) << BigInt(1)), // 去除登录位，使用BigInt表示Java中的Long.MAX_VALUE
    desc: '超级管理员'
  }
};

/**
 * 角色判断工具类
 */
const RoleUtil = {
  /**
   * 检查源角色是否包含目标角色
   * @param {Object|Number|BigInt} source - 源角色对象或角色位图
   * @param {Object|Number|BigInt} target - 目标角色对象或角色位图
   * @returns {boolean} - 是否包含目标角色
   */
  contains(source, target) {
    if (!source || !target) {
      return false;
    }

    // 获取源角色位图，确保转换为BigInt
    const sourceBit = typeof source === 'object' ? BigInt(source.bit) : BigInt(source);
    // 获取目标角色位图，确保转换为BigInt
    const targetBit = typeof target === 'object' ? BigInt(target.bit) : BigInt(target);

    return (sourceBit & targetBit) === targetBit;
  },

  /**
   * 检查用户是否处于登录态
   * @param {Number|BigInt} roleBit - 用户角色位图
   * @returns {boolean} - 是否为登录态
   */
  isAuthenticated(roleBit) {
    return this.contains(roleBit, RoleCode.AUTHENTICATED);
  },

  /**
   * 检查用户是否为普通用户（手机号用户或实名证件用户，且处于登录态）
   * @param {Number|BigInt} roleBit - 用户角色位图
   * @returns {boolean} - 是否为普通用户
   */
  isNormalUser(roleBit) {
    return this.isAuthenticated(roleBit) &&
           (this.contains(roleBit, RoleCode.PHONE) || this.contains(roleBit, RoleCode.ID_CARD_USER));
  },

  /**
   * 检查用户是否为专业用户（护工或医师，且处于登录态）
   * @param {Number|BigInt} roleBit - 用户角色位图
   * @returns {boolean} - 是否为专业用户
   */
  isProfessionalUser(roleBit) {
    return this.isAuthenticated(roleBit) &&
           (this.contains(roleBit, RoleCode.NURSE) || this.contains(roleBit, RoleCode.DOCTOR));
  },

  /**
   * 检查用户是否为员工（且处于登录态）
   * @param {Number|BigInt} roleBit - 用户角色位图
   * @returns {boolean} - 是否为员工
   */
  isEmployee(roleBit) {
    return this.isAuthenticated(roleBit) && this.contains(roleBit, RoleCode.EMPLOYEE);
  },

  /**
   * 检查用户是否为管理员（且处于登录态）
   * @param {Number|BigInt} roleBit - 用户角色位图
   * @returns {boolean} - 是否为管理员
   */
  isAdmin(roleBit) {
    return this.isAuthenticated(roleBit) &&
           (this.contains(roleBit, RoleCode.CMS) ||
            this.contains(roleBit, RoleCode.SYSTEM) ||
            this.contains(roleBit, RoleCode.ROOT));
  },

  /**
   * 获取用户角色描述
   * @param {Number|BigInt} roleBit - 用户角色位图
   * @returns {Array} - 角色描述数组
   */
  getUserRoleDescriptions(roleBit) {
    if (!roleBit) {
      return ['未知用户'];
    }

    const descriptions = [];

    // 总是显示登录用户状态
    if (this.isAuthenticated(roleBit)) {
      descriptions.push('已登录用户');
    }

    Object.values(RoleCode).forEach(role => {
      // 跳过登录用户角色，因为我们已经单独处理了
      if (role.code === 'authenticated') {
        return;
      }

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
