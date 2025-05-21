import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Menu,
  MenuItem,
  Divider,
  useTheme,
  Avatar,
  Badge,
  Tooltip,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  useMediaQuery,
  InputBase,
  alpha,
  Chip,
  Fade
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon,
  BarChart as BarChartIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  Favorite as FavoriteIcon,
  ExitToApp as ExitToAppIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Login as LoginIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const Header = ({ isLoggedIn, onLogout, darkMode, toggleDarkMode }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  
  // Kullanıcı bilgilerini localStorage'dan al
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [isLoggedIn]);
  
  // Çıkış işlemi
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    if (onLogout) onLogout();
    navigate('/login');
    handleMenuClose();
  };
  
  // Sayfada kaydırma durumunu izle
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Ana menü açma/kapama
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Mobil menü açma/kapama
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Aktif sayfa kontrolü
  const isActivePage = (path) => {
    return location.pathname === path;
  };
  
  // Ana menü öğeleri
  const menuItems = [
    { text: 'Hisse Tarama', icon: <BarChartIcon />, path: '/all-stocks' },
    { text: 'Potansiyel Yükseliş', icon: <TrendingUpIcon />, path: '/potential-risers' },
    { text: 'Tahmin Geçmişi', icon: <HistoryIcon />, path: '/prediction-history' },
    { text: 'Analiz', icon: <AssessmentIcon />, path: '/dashboard' }
  ];

  // Kullanıcı menü içeriği - giriş durumuna göre değişir
  const userMenuContent = () => {
    if (user) {
      // Giriş yapmış kullanıcı için
      return (
        <>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Merhaba, {user.display_name || user.username || 'Kullanıcı'}!
            </Typography>
            <Typography variant="body2" color="text.secondary">{user.email}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <MenuItem component={Link} to="/dashboard">
            <ListItemIcon>
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Gösterge Paneli</ListItemText>
          </MenuItem>
          <MenuItem component={Link} to="/favorites">
            <ListItemIcon>
              <FavoriteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Favori Hisselerim</ListItemText>
          </MenuItem>
          <MenuItem component={Link} to="/settings">
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ayarlar</ListItemText>
          </MenuItem>
          <Divider sx={{ my: 1 }} />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <ExitToAppIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Çıkış Yap</ListItemText>
          </MenuItem>
        </>
      );
    } else {
      // Giriş yapmamış kullanıcı için
      return (
        <>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1" fontWeight="bold">Merhaba, Misafir Kullanıcı!</Typography>
            <Typography variant="body2" color="text.secondary">guest@example.com</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <MenuItem component={Link} to="/login">
            <ListItemIcon>
              <LoginIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Giriş Yap</ListItemText>
          </MenuItem>
        </>
      );
    }
  };

  // Kullanıcı avatar baş harfleri
  const getInitials = () => {
    if (user && user.display_name) {
      return user.display_name.charAt(0).toUpperCase();
    } else if (user && user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'G'; // Misafir için
  };

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={scrolled ? 2 : 0}
        sx={{ 
          backgroundColor: scrolled 
            ? (theme.palette.mode === 'dark' ? 'rgba(19, 23, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)')
            : (theme.palette.mode === 'dark' ? 'transparent' : 'transparent'),
          borderBottom: scrolled
            ? 'none'
            : `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        <Container maxWidth={false} disableGutters>
          <Toolbar sx={{ minHeight: '48px !important', px: { xs: 0.5, sm: 1 }, justifyContent: 'space-between' }}>
            {/* Logo ve Marka */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isMobile && (
                <IconButton 
                  color="inherit" 
                  edge="start" 
                  onClick={toggleMobileMenu} 
                  sx={{ mr: 0.5 }}
                  size="small"
                >
                  <MenuIcon fontSize="small" />
                </IconButton>
              )}
              
              <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <TrendingUpIcon 
                  sx={{ 
                    mr: 0.5, 
                    fontSize: '24px',
                    color: theme.palette.primary.main,
                    filter: 'drop-shadow(0 0 3px rgba(41, 98, 255, 0.5))'
                  }} 
                />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    color: theme.palette.text.primary,
                    display: { xs: 'none', sm: 'block' },
                    letterSpacing: '-0.5px',
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(90deg, #ffffff, #91a7ff)'
                      : 'linear-gradient(90deg, #252525, #2962FF)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: theme.palette.mode === 'dark' 
                      ? '0 0 25px rgba(255, 255, 255, 0.15)' 
                      : '0 0 25px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  BIST <span style={{ fontWeight: 400 }}>Tahmin</span>
                </Typography>
              </Link>
            </Box>
            
            {/* Masaüstü Gezinme */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                {menuItems.map((item) => (
                  <Button 
                    key={item.path}
                    component={Link} 
                    to={item.path} 
                    sx={{ 
                      color: isActivePage(item.path) 
                        ? theme.palette.primary.main 
                        : theme.palette.text.primary,
                      fontWeight: isActivePage(item.path) ? 600 : 500,
                      textTransform: 'none',
                      fontSize: '0.875rem',
                      mx: 0.5,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      position: 'relative',
                      backgroundColor: isActivePage(item.path) 
                        ? (theme.palette.mode === 'dark' ? 'rgba(41, 98, 255, 0.1)' : 'rgba(41, 98, 255, 0.05)')
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.03)'
                      },
                      '&::after': isActivePage(item.path) ? {
                        content: '""',
                        position: 'absolute',
                        bottom: '4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '16px',
                        height: '2px',
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: '4px',
                      } : {}
                    }}
                    startIcon={React.cloneElement(item.icon, {
                      fontSize: 'small',
                      sx: { color: isActivePage(item.path) ? theme.palette.primary.main : 'inherit' }
                    })}
                  >
                    {item.text}
                  </Button>
                ))}
              </Box>
            )}
            
            <Box sx={{ flexGrow: 1 }} />
            
            {/* Arama, Bildirimler ve Kullanıcı */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 0.5 } }}>
              {/* Arama */}
              <Box 
                sx={{ 
                  position: 'relative',
                  borderRadius: '12px',
                  backgroundColor: searchFocused 
                    ? (theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.1) : alpha(theme.palette.common.black, 0.05))
                    : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.common.white, 0.08) 
                      : alpha(theme.palette.common.black, 0.03),
                  },
                  width: searchFocused ? '200px' : '160px',
                  maxWidth: { xs: '160px', md: searchFocused ? '200px' : '160px' },
                  mr: 1
                }}
              >
                <Box 
                  sx={{ 
                    padding: '4px 8px', 
                    height: '36px', 
                    position: 'absolute', 
                    pointerEvents: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  <SearchIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                </Box>
                <InputBase
                  placeholder="Ara (Ctrl+K)"
                  sx={{
                    color: 'inherit',
                    width: '100%',
                    '& .MuiInputBase-input': {
                      padding: '8px 8px 8px 36px',
                      transition: 'width 0.2s',
                      fontSize: '0.875rem',
                    },
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </Box>
              
              {/* Tema Değiştirme */}
              <Tooltip title={darkMode ? "Açık Temaya Geç" : "Koyu Temaya Geç"}>
                <IconButton 
                  onClick={toggleDarkMode} 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.04)',
                    borderRadius: '10px',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(0, 0, 0, 0.08)',
                    }
                  }}
                >
                  {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              
              {/* Bildirimler - sadece giriş yapmış kullanıcılar için gösterilir */}
              {user && (
                <Tooltip title="Bildirimler">
                  <IconButton 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.04)',
                      borderRadius: '10px',
                      ml: 1,
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(0, 0, 0, 0.08)',
                      }
                    }}
                  >
                    <Badge
                      badgeContent={3}
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.6rem',
                          height: '16px',
                          minWidth: '16px',
                          padding: '0 4px',
                        }
                      }}
                    >
                      <NotificationsIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
              )}
              
              {/* Giriş yapma/Kullanıcı bilgisi butonu */}
              <Box sx={{ ml: { xs: 1, md: 2 } }}>
                {user ? (
                  // Kullanıcı giriş yapmışsa avatar göster
                  <Button
                    onClick={handleMenuOpen}
                    color="inherit"
                    sx={{
                      borderRadius: '24px',
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.04)',
                      padding: '4px 4px 4px 12px',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(0, 0, 0, 0.08)',
                      }
                    }}
                    endIcon={<KeyboardArrowDownIcon fontSize="small" />}
                  >
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: '0.875rem',
                        ml: 0.5,
                        bgcolor: theme.palette.primary.main
                      }}
                    >
                      {getInitials()}
                    </Avatar>
                  </Button>
                ) : (
                  // Kullanıcı giriş yapmamışsa "Giriş Yap" butonu göster
                  <Button
                    component={Link}
                    to="/login"
                    variant="contained"
                    size="small"
                    startIcon={<LoginIcon />}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      py: 0.7,
                      px: 2
                    }}
                  >
                    Giriş Yap
                  </Button>
                )}
                
                {/* Kullanıcı Menüsü */}
                <Menu
                  anchorEl={menuAnchorEl}
                  open={Boolean(menuAnchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    elevation: 3,
                    sx: {
                      mt: 1.5,
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                      '&:before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: 0,
                      },
                      '& .MuiMenuItem-root': {
                        px: 2,
                        py: 1.5,
                        my: 0.5,
                        borderRadius: 1,
                        mx: 0.5,
                      }
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  disableAutoFocusItem
                >
                  {userMenuContent()}
                </Menu>
              </Box>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      
      {/* Mobil Menü (Drawer) */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
        PaperProps={{
          sx: {
            width: '85%',
            maxWidth: '300px',
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(20, 25, 35, 0.97)' 
              : 'rgba(255, 255, 255, 0.97)',
            backdropFilter: 'blur(10px)',
            borderRight: `1px solid ${
              theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.05)'
            }`,
            boxShadow: theme.palette.mode === 'dark' 
              ? '4px 0 24px rgba(0, 0, 0, 0.4)' 
              : '4px 0 24px rgba(0, 0, 0, 0.1)',
            padding: theme.spacing(2)
          }
        }}
      >
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <TrendingUpIcon 
              sx={{ 
                mr: 1, 
                fontSize: '28px',
                color: theme.palette.primary.main 
              }} 
            />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700, 
                color: theme.palette.text.primary,
                letterSpacing: '-0.5px'
              }}
            >
              BIST Tahmin
            </Typography>
          </Link>
          <IconButton onClick={toggleMobileMenu}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <List sx={{ px: 0 }}>
          {menuItems.map((item) => (
            <ListItem 
              key={item.path}
              button 
              component={Link} 
              to={item.path}
              onClick={toggleMobileMenu}
              selected={isActivePage(item.path)}
              sx={{ 
                borderRadius: 2,
                mb: 1,
                backgroundColor: isActivePage(item.path) 
                  ? (theme.palette.mode === 'dark' ? 'rgba(41, 98, 255, 0.1)' : 'rgba(41, 98, 255, 0.05)')
                  : 'transparent',
                '&.Mui-selected': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(41, 98, 255, 0.1)' : 'rgba(41, 98, 255, 0.05)',
                },
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: isActivePage(item.path) ? theme.palette.primary.main : theme.palette.text.primary }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontWeight: isActivePage(item.path) ? 600 : 500,
                  color: isActivePage(item.path) ? theme.palette.primary.main : theme.palette.text.primary
                }} 
              />
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle2" color="text.secondary" sx={{ ml: 2, mb: 2 }}>
          KULLANICI
        </Typography>
            
        <List>
          {user ? (
            // Kullanıcı giriş yapmışsa
            <>
              <ListItem button component={Link} to="/dashboard" onClick={toggleMobileMenu}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <DashboardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Gösterge Paneli" />
              </ListItem>
              <ListItem button component={Link} to="/favorites" onClick={toggleMobileMenu}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <FavoriteIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Favori Hisselerim" />
              </ListItem>
              <ListItem button component={Link} to="/settings" onClick={toggleMobileMenu}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Ayarlar" />
              </ListItem>
              <Divider sx={{ my: 1 }} />
              <ListItem button onClick={() => { handleLogout(); toggleMobileMenu(); }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <ExitToAppIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Çıkış Yap" />
              </ListItem>
            </>
          ) : (
            // Kullanıcı giriş yapmamışsa
            <ListItem button component={Link} to="/login" onClick={toggleMobileMenu}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LoginIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Giriş Yap" />
            </ListItem>
          )}
        </List>
      </Drawer>
    </>
  );
};

export default Header; 