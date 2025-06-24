import { Box, Typography, Paper, Link } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  width: '480px',
  backgroundColor: '#0a0a0a',
  border: '2px solid #ff00ff',
  boxShadow: '0 0 20px #ff00ff',
  padding: theme.spacing(3),
  color: '#ffffff',
  [theme.breakpoints.down('md')]: {
    width: '100%',
    maxWidth: '480px',
  },
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  fontFamily: 'Inter, sans-serif',
  marginBottom: theme.spacing(2),
  '&.title': {
    fontFamily: 'Orbitron, sans-serif',
    color: '#00ffff',
    marginBottom: theme.spacing(3),
  },
}));

const InstructionsPanel = () => {
  return (
    <StyledPaper elevation={3}>
      <StyledTypography variant="h5" className="title">
        How to Play
      </StyledTypography>
      <StyledTypography variant="body1">
        1. Connect Flow wallet to Play
      </StyledTypography>
      <StyledTypography variant="body1">
        2. Get Testnet flow from the{' '}
        <Link
          href="https://faucet.flow.com/fund-account"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: '#00ffff' }}
        >
          Flow Faucet
        </Link>
      </StyledTypography>
      <StyledTypography variant="body1">
        3. Go to the ticket counter and buy tickets to play!
      </StyledTypography>
      <StyledTypography variant="body2" sx={{ color: '#888888', mt: 2 }}>
        Powered by Flow Blockchain
      </StyledTypography>
    </StyledPaper>
  );
};

export default InstructionsPanel; 