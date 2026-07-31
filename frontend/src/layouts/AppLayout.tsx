import { useState, type MouseEvent, type KeyboardEvent } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import Stack from '@mui/material/Stack';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SearchIcon from '@mui/icons-material/Search';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';

import { DRAWER_WIDTH, NAV_GROUPS } from '../constants/nav';
import { useThemeMode } from '../contexts/ThemeModeContext';
import { useAuth } from '../contexts/AuthContext';

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const { mode, toggleMode } = useThemeMode();
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const appName = import.meta.env.VITE_APP_NAME || 'ForgeFlo';

  const handleUserMenuOpen = (event: MouseEvent<HTMLElement>) => setUserMenuAnchor(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
    navigate('/login', { replace: true });
  };

  const submitSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '?';
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasPermission(item.permission ?? '')),
  })).filter((group) => group.items.length > 0);
  const canUseSearch = hasPermission('reports:read') || hasPermission('sales:read');
  const canViewNotifications = hasPermission('notifications:read');
  const canViewSettings = hasPermission('settings:read');

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: { md: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : 0}px)` },
          ml: { md: drawerOpen ? `${DRAWER_WIDTH}px` : 0 },
          transition: (theme) =>
            theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton edge="start" onClick={() => setDrawerOpen((o) => !o)} size="small">
            {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>

          {canUseSearch && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'action.hover',
                borderRadius: 1,
                px: 1.5,
                py: 0.5,
                flexGrow: 1,
                maxWidth: 420,
              }}
            >
              <SearchIcon fontSize="small" color="action" />
              <InputBase
                placeholder="Search materials, orders, drawings…"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={submitSearch}
                sx={{ fontSize: '0.82rem', width: '100%' }}
              />
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              <IconButton onClick={toggleMode} size="small">
                {mode === 'light' ? <Brightness4Icon fontSize="small" /> : <Brightness7Icon fontSize="small" />}
              </IconButton>
            </Tooltip>
            {canViewNotifications && (
              <Tooltip title="Notifications">
                <IconButton size="small" onClick={() => navigate('/admin/notifications')}>
                  <Badge color="error" variant="dot">
                    <NotificationsOutlinedIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Account">
              <IconButton onClick={handleUserMenuOpen} size="small" sx={{ ml: 0.5 }}>
                <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', bgcolor: 'secondary.main' }}>
                  {initials}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Stack>

          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {user?.fullName || user?.firstName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            {canViewSettings && (
              <MenuItem
                onClick={() => {
                  handleUserMenuClose();
                  navigate('/settings');
                }}
              >
                <ListItemIcon>
                  <PersonOutlineIcon fontSize="small" />
                </ListItemIcon>
                Profile & Settings
              </MenuItem>
            )}
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': {
            width: drawerOpen ? DRAWER_WIDTH : 0,
            overflowX: 'hidden',
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
          },
        }}
      >
        <Toolbar sx={{ gap: 1, px: 2 }}>
          <PrecisionManufacturingIcon />
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {appName}
          </Typography>
        </Toolbar>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ overflowY: 'auto', overflowX: 'hidden', flexGrow: 1, pb: 2 }}>
          {visibleGroups.map((group, idx) => (
            <List
              key={group.label || idx}
              dense
              subheader={
                group.label ? (
                  <ListSubheader
                    component="div"
                    sx={{
                      bgcolor: 'transparent',
                      color: 'rgba(220,230,242,0.55)',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      lineHeight: '2.2rem',
                    }}
                  >
                    {group.label}
                  </ListSubheader>
                ) : undefined
              }
            >
              {group.items.map((item) => {
                const selected = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                const Icon = item.icon;
                return (
                  <ListItemButton
                    key={item.path}
                    selected={selected}
                    onClick={() => navigate(item.path)}
                    sx={{
                      mx: 1,
                      my: 0.25,
                      borderRadius: 1,
                      color: 'rgba(220,230,242,0.85)',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: '#fff',
                        '&:hover': { bgcolor: 'primary.dark' },
                      },
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
                      <Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: selected ? 700 : 500 }}>
                      {item.label}
                    </ListItemText>
                  </ListItemButton>
                );
              })}
            </List>
          ))}
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          width: { md: `calc(100% - ${drawerOpen ? DRAWER_WIDTH : 0}px)` },
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default AppLayout;
