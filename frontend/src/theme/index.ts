import { createTheme, type ThemeOptions, type PaletteMode } from '@mui/material/styles';

const industrialBlue = '#0B3A6E';
const industrialBlueLight = '#154C8C';
const industrialBlueDark = '#082A50';
const accentAmber = '#C77700';

const slate = {
  50: '#F4F6F8',
  100: '#E7EBEF',
  200: '#D3DAE1',
  300: '#B4BFC9',
  400: '#8C99A6',
  500: '#697684',
  600: '#526071',
  700: '#3E4A59',
  800: '#2B3542',
  900: '#1B222B',
};

function buildTheme(mode: PaletteMode): ThemeOptions {
  const isLight = mode === 'light';

  return {
    palette: {
      mode,
      primary: {
        main: industrialBlue,
        light: industrialBlueLight,
        dark: industrialBlueDark,
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: accentAmber,
        contrastText: '#FFFFFF',
      },
      background: {
        default: isLight ? '#F2F4F7' : '#12181F',
        paper: isLight ? '#FFFFFF' : '#1A2029',
      },
      text: {
        primary: isLight ? '#1B222B' : '#E6EAEF',
        secondary: isLight ? '#526071' : '#9AA6B2',
      },
      divider: isLight ? 'rgba(27, 34, 43, 0.10)' : 'rgba(230, 234, 239, 0.10)',
      success: { main: '#1E7D4C' },
      warning: { main: '#B4790A' },
      error: { main: '#B23B3B' },
      info: { main: '#2A6FAD' },
      grey: slate as never,
    },
    shape: {
      borderRadius: 6,
    },
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      fontSize: 13,
      h1: { fontSize: '2rem', fontWeight: 600 },
      h2: { fontSize: '1.65rem', fontWeight: 600 },
      h3: { fontSize: '1.35rem', fontWeight: 600 },
      h4: { fontSize: '1.15rem', fontWeight: 600 },
      h5: { fontSize: '1.02rem', fontWeight: 600 },
      h6: { fontSize: '0.95rem', fontWeight: 600 },
      subtitle1: { fontSize: '0.85rem', fontWeight: 500 },
      subtitle2: { fontSize: '0.78rem', fontWeight: 500 },
      body1: { fontSize: '0.85rem' },
      body2: { fontSize: '0.8rem' },
      button: { fontSize: '0.8rem', fontWeight: 600, textTransform: 'none' as const },
      caption: { fontSize: '0.7rem' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: `${slate[400]} transparent`,
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 2 },
        styleOverrides: {
          root: {
            backgroundColor: isLight ? '#FFFFFF' : '#161C24',
            color: isLight ? '#1B222B' : '#E6EAEF',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isLight ? '#0F2E52' : '#0D1420',
            color: '#DCE6F2',
            borderRight: 'none',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 6, paddingTop: 6, paddingBottom: 6 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: '6px 12px',
            fontSize: '0.78rem',
          },
          head: {
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            fontSize: '0.68rem',
            letterSpacing: '0.04em',
            color: isLight ? slate[600] : slate[300],
            backgroundColor: isLight ? slate[50] : '#1E2632',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, fontSize: '0.7rem' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${isLight ? 'rgba(27,34,43,0.08)' : 'rgba(230,234,239,0.08)'}`,
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
      },
      MuiFormControl: {
        defaultProps: { size: 'small' },
      },
      MuiButtonBase: {
        defaultProps: { disableRipple: false },
      },
      MuiTooltip: {
        defaultProps: { arrow: true },
      },
    },
  };
}

export function getAppTheme(mode: PaletteMode) {
  return createTheme(buildTheme(mode));
}

export default getAppTheme;
