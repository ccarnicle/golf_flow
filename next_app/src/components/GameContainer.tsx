import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material';
import { ReactNode, useEffect } from 'react';
import { useRevealWager } from '@/lib/flow/hooks/useRevealWager';
import { useCurrentFlowUser } from '@onflow/kit';
import { EventBus } from '@/game/EventBus';

const StyledGameContainer = styled(Box)(({ theme }) => ({
  width: '480px',
  height: '640px',
  position: 'relative',
  backgroundColor: '#0a0a0a',
  border: `2px solid ${theme.palette.primary.main}`,
  boxShadow: `0 0 20px ${theme.palette.primary.main}`,
  borderRadius: '4px',
  overflow: 'hidden',
  transition: 'all 0.3s ease-in-out',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    boxShadow: `0 0 30px ${theme.palette.primary.main}`,
  },
  '& .game-wrapper': {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '& .game-container-wrapper': {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '& #game-container': {
    width: '100%',
    height: '100%',
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
    height: 'auto',
    aspectRatio: '3/4',
    maxWidth: '480px',
  },
}));

interface GameContainerProps {
  children: ReactNode;
}

const GameContainer = ({ children }: GameContainerProps) => {
  const theme = useTheme();
  const { revealWager } = useRevealWager();
  const { user } = useCurrentFlowUser();

  useEffect(() => {
    const handleSwingBat = () => {
      if (user?.addr) {
        revealWager(user.addr);
      }
    };

    EventBus.on('swing-bat-clicked', handleSwingBat);

    return () => {
      EventBus.off('swing-bat-clicked', handleSwingBat);
    };
  }, [user, revealWager]);

  return (
    <StyledGameContainer>
      {children}
    </StyledGameContainer>
  );
};

export default GameContainer; 