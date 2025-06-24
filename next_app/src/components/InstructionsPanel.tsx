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
      <div>
        <StyledTypography variant="body1">
          4. Depending on your bat NFT and your randomly generated swing you
          earn a &quot;Swing Score&quot;. Your swing score pays out based on the
          following:
        </StyledTypography>
        <Box sx={{ pl: 4, mt: 1, color: '#dddddd' }}>
          <Typography variant="body2">
            <strong>Jackpot (Score 100+):</strong> 20x Payout
          </Typography>
          <Typography variant="body2">
            <strong>Major Win (Score 98-99):</strong> 8.5x Payout
          </Typography>
          <Typography variant="body2">
            <strong>Standard Win (Score 90-97):</strong> 2x Payout
          </Typography>
          <Typography variant="body2">
            <strong>Refund (Score 60-89):</strong> 1x Payout
          </Typography>
          <Typography variant="body2">
            <strong>Partial Loss (Score 30-59):</strong> 0.4x Payout
          </Typography>
          <Typography variant="body2">
            <strong>Total Loss (Score &lt; 30):</strong> No Payout
          </Typography>
        </Box>
      </div>
      <StyledTypography variant="body2" sx={{ color: '#888888', mt: 2 }}>
        Powered by Flow Blockchain
      </StyledTypography>
    </StyledPaper>
  );
};

export default InstructionsPanel; 