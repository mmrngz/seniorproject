import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const Header = ({ isLoggedIn, onLogout }) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          BIST Hisse Tahmin Sistemi
        </Typography>
        <Box>
          <Button color="inherit" component={Link} to="/">
            Ana Sayfa
          </Button>
          <Button color="inherit" component={Link} to="/all-stocks">
            Tüm Hisseler
          </Button>
          <Button color="inherit" component={Link} to="/potential-risers">
            Potansiyel Yükseliş
          </Button>
          {isLoggedIn ? (
            <>
              <Button color="inherit" component={Link} to="/dashboard">
                Dashboard
              </Button>
              <Button color="inherit" onClick={onLogout}>
                Çıkış Yap
              </Button>
            </>
          ) : (
            <Button color="inherit" component={Link} to="/login">
              Giriş Yap
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 