import type { ThemeConfig } from 'antd'

export const theme: ThemeConfig = {
  token: {
    // 主色调
    colorPrimary: '#FF8FB1',
    colorPrimaryHover: '#FFB5CC',
    colorPrimaryActive: '#E87A9E',
    colorPrimaryBg: '#FFF0F5',
    colorPrimaryBgHover: '#FFE4EC',

    // 背景色
    colorBgBase: '#F8F8FA',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorBgLayout: '#F8F8FA',
    colorBgSpotlight: '#F8F8FA',

    // 文字色
    colorText: '#222222',
    colorTextSecondary: '#666666',
    colorTextTertiary: '#999999',
    colorTextQuaternary: '#BBBBBB',

    // 边框
    colorBorder: '#E8E8E8',
    colorBorderSecondary: '#F0F0F0',

    // 圆角
    borderRadius: 8,
    borderRadiusLG: 16,
    borderRadiusSM: 4,
    borderRadiusXS: 2,

    // 字体
    fontFamily: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    fontSizeHeading1: 28,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,

    // 阴影
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.08)',

    // 动画
    motionDurationSlow: '0.3s',
    motionDurationMid: '0.2s',
    motionDurationFast: '0.1s',
    motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 36,
      paddingContentHorizontal: 16,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 36,
      paddingInline: 12,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 36,
    },
    Card: {
      borderRadiusLG: 16,
      paddingLG: 16,
    },
    Modal: {
      borderRadiusLG: 16,
    },
    Rate: {
      starColor: '#FFD700',
      starSize: 14,
    },
    Tag: {
      borderRadiusSM: 4,
    },
    Table: {
      borderRadius: 8,
    },
    Menu: {
      itemBorderRadius: 8,
      subMenuItemBorderRadius: 8,
    },
  },
}
