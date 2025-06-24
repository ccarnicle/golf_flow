import { Box, Container, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import NavBar from './NavBar';
import GameContainer from './GameContainer';
import InstructionsPanel from './InstructionsPanel';
import { ReactNode, useEffect } from 'react';
import { useCurrentFlowUser } from '@onflow/kit';
import { EventBus } from '@/game/EventBus';

const StyledContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: '#0a0a0a',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user } = useCurrentFlowUser();
  const theme = useTheme();

  useEffect(() => {
    // Emit wallet connection status to Phaser game
    EventBus.emit('wallet-connection-status', user?.loggedIn ?? false);

    const handleMainMenuReady = () => {
      EventBus.emit('wallet-connection-status', user?.loggedIn ?? false);
    };
    EventBus.on('main-menu-ready', handleMainMenuReady);

    return () => {
      EventBus.off('main-menu-ready', handleMainMenuReady);
    };
  }, [user]);

  return (
    <StyledContainer maxWidth={false}>
      <NavBar />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing(3),
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}
      >
        <GameContainer>
          {children}
        </GameContainer>
        <InstructionsPanel />
      </Box>
    </StyledContainer>
  );
};

export default AppLayout; 