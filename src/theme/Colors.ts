export const commonColors = {
  PRIMARY_COLOR: '#0A84FF', // High-energy brand blue
  SECONDARY_COLOR: '#5AC8FA', // Sky blue accent
  ACCENT_COLOR: '#5856D6', // Elegant purple accent
  WHITE_COLOR: '#FFFFFF',
  BLACK_COLOR: '#0A0C10',
  SUCCESS_COLOR: '#34C759',
  WARNING_COLOR: '#FF9500',
  DANGER_COLOR: '#FF3B30',
};

export const lightColors = {
  background: '#F8F9FC',
  cardBackground: '#FFFFFF',
  text: '#1C1C1E',
  textMuted: '#8E8E93',
  border: '#C7C7CC',
  bgLight: '#F2F2F7',
};

export const darkColors = {
  background: '#0B0D13', // Deep premium dark background
  cardBackground: '#161922', // Slate card background
  text: '#FFFFFF',
  textMuted: '#98A2B3', // Soft slate gray
  border: '#2A2F3D', // Muted dark border
  bgLight: '#1E222F', // Slate light layout background
};

export const colors = {
  ...commonColors,
  light: lightColors,
  dark: darkColors,
};
