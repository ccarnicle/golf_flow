import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useCurrentFlowUser } from '@onflow/kit';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#0a0a0a',
  borderBottom: `2px solid ${theme.palette.secondary.main}`,
  boxShadow: `0 0 10px ${theme.palette.secondary.main}`,
  height: '64px',
  width: '480px',
  margin: '0 auto',
  borderRadius: '12px',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    maxWidth: '480px',
  },
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  fontFamily: 'Orbitron, sans-serif',
  color: '#ffffff',
  flexGrow: 1,
}));

const WalletButton = styled(Button)(({ theme }) => ({
  fontFamily: 'JetBrains Mono, monospace',
  color: '#ffffff',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    boxShadow: `0 0 10px ${theme.palette.primary.main}`,
  },
}));

const NavBar = () => {
  const { user, authenticate, unauthenticate } = useCurrentFlowUser();

  return (
    <StyledAppBar position="static">
      <Toolbar>
        <StyledTypography variant="h6">
          Home Run Heroes
        </StyledTypography>
        <WalletButton 
          color = "primary" 
          variant="outlined" 
          onClick={() => user.loggedIn ? unauthenticate() : authenticate()}
        >
          {user.loggedIn && user.addr ? `${user.addr.slice(0, 6)}...${user.addr.slice(-4)}` : 'Connect Wallet'}
        </WalletButton>
      </Toolbar>
    </StyledAppBar>
  );
};

export default NavBar; 