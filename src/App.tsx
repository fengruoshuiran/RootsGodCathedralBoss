import { useState, useEffect } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import './App.css';

type CellType = 'start' | 'end' | 'red' | 'blue' | 'black' | 'switch' | 'path' | 'portal1' | 'portal2';

interface Level {
  id: number;
  name: string;
  grid: CellType[][];
}

const App = () => {
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [playerPosition, setPlayerPosition] = useState<[number, number]>([0, 0]);
  const [playerColor, setPlayerColor] = useState<'red' | 'blue'>('red');
  const [levels, setLevels] = useState<Level[]>([]);

  // Load levels from files
  useEffect(() => {
    const loadLevels = async () => {
      try {
        // Load all level files
        const levelFiles = ['level1.txt', 'level2.txt', 'level3.txt', 'level4.txt'];
        const loadedLevels: Level[] = [];
        
        for (let i = 0; i < levelFiles.length; i++) {
          const response = await fetch(`${process.env.PUBLIC_URL}/levels/${levelFiles[i]}`);
          const text = await response.text();
          const grid = parseLevelFile(text);
          
          loadedLevels.push({
            id: i + 1,
            name: `Level ${i + 1}`,
            grid: grid
          });
        }
        
        setLevels(loadedLevels);
        if (loadedLevels.length > 0) {
          const startPos = findStartPosition(loadedLevels[0].grid);
          setPlayerPosition(startPos);
        }
      } catch (error) {
        console.error('Failed to load levels:', error);
      }
    };

    loadLevels();
  }, []);

  const parseLevelFile = (text: string): CellType[][] => {
    const lines = text.trim().split('\n').filter(line => line.trim().length > 0);
    return lines.map(line => {
      // Remove any trailing whitespace or carriage returns
      const cleanLine = line.replace(/\r$/, '').trim();
      return cleanLine.split('').map(char => {
        switch(char) {
          case 'S': return 'start';
          case 'E': return 'end';
          case '#': return 'black';
          case 'R': return 'red';
          case 'B': return 'blue';
          case 'T': return 'switch';
          case '@': return 'portal1';
          case 'O': return 'portal2';
          case '.': return 'path';
          default: return 'path'; // Default to path for unknown chars
        }
      });
    });
  };

  const findStartPosition = (grid: CellType[][]): [number, number] => {
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (grid[i][j] === 'start') {
          return [i, j];
        }
      }
    }
    return [0, 0];
  };

  const handleCellClick = (row: number, col: number) => {
    const currentGrid = levels[currentLevel]?.grid || [];
    if (!currentGrid.length) return;

    const targetCell = currentGrid[row][col];
    
    // Check if move is valid
    if (targetCell === 'black') return;
    if (targetCell === 'red' && playerColor !== 'red') return;
    if (targetCell === 'blue' && playerColor !== 'blue') return;

    // Handle portal teleport
    if (targetCell === 'portal1' || targetCell === 'portal2') {
      // Find all portals of same type
      const portals = [];
      for (let i = 0; i < currentGrid.length; i++) {
        for (let j = 0; j < currentGrid[i].length; j++) {
          if (currentGrid[i][j] === targetCell && (i !== row || j !== col)) {
            portals.push([i, j]);
          }
        }
      }
      // If found another portal, teleport to random one
      if (portals.length > 0) {
        const [newRow, newCol] = portals[Math.floor(Math.random() * portals.length)];
        setPlayerPosition([newRow, newCol]);
        return;
      }
    }

    // Handle switch cell
    if (targetCell === 'switch') {
      setPlayerColor(prev => prev === 'red' ? 'blue' : 'red');
    }

    // Check if reached end
    if (targetCell === 'end') {
      alert('Level completed!');
      if (currentLevel < levels.length - 1) {
        setCurrentLevel(prev => prev + 1);
        const startPos = findStartPosition(levels[currentLevel + 1].grid);
        setPlayerPosition(startPos);
      }
      return;
    }

    setPlayerPosition([row, col]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const [row, col] = playerPosition;
    const currentGrid = levels[currentLevel]?.grid || [];
    
    if (!currentGrid.length) return;

    let newRow = row;
    let newCol = col;

    switch (e.key.toLowerCase()) {
      case 'w':
        newRow = Math.max(0, row - 1);
        break;
      case 's':
        newRow = Math.min(currentGrid.length - 1, row + 1);
        break;
      case 'a':
        newCol = Math.max(0, col - 1);
        break;
      case 'd':
        newCol = Math.min(currentGrid[0].length - 1, col + 1);
        break;
      default:
        return;
    }

    handleCellClick(newRow, newCol);
  };

  const getCellColor = (cellType: CellType) => {
    const isRedPlayer = playerColor === 'red';
    switch (cellType) {
      case 'start': return 'rgba(200, 180, 0, 1)'; // 降低明度的黄色
      case 'end': return '#00C853'; // 降低明度的绿色
      case 'red': return isRedPlayer ? 'rgba(200, 60, 60, 0.3)' : '#E53935';
      case 'blue': return isRedPlayer ? '#2979FF' : 'rgba(60, 120, 220, 0.3)';
      case 'black': return '#424242';
      case 'switch': return 'rgba(189, 46, 221, 0.5)'; // 降低明度的紫色
      case 'path': return 'rgba(80, 180, 20, 0.3)'; // 降低明度的绿色路径
      case 'portal1': return 'rgba(255, 165, 0, 0.5)'; // 橙色半透明传送门
      case 'portal2': return 'rgba(0, 255, 255, 0.5)'; // 青色半透明传送门
      default: return 'rgba(100, 221, 23, 0.3)';
    }
  };

  const loadLevel = (levelId: number) => {
    const levelIndex = levels.findIndex(l => l.id === levelId);
    if (levelIndex >= 0) {
      setCurrentLevel(levelIndex);
      const startPos = findStartPosition(levels[levelIndex].grid);
      setPlayerPosition(startPos);
    }
  };

  return (
    <Container maxWidth="xl" className="App" onKeyDown={handleKeyDown} tabIndex={0}>
      <Typography variant="h3" gutterBottom sx={{ mb: 4 }}>
        Roots God Cathedral Boss
      </Typography>
      
      <div className="game-container">
        <div className="level-selector">
          <Box sx={{ bgcolor: '#1E1E1E', p: 2, borderRadius: 2, border: '1px solid #333' }}>
            <Typography variant="h5" gutterBottom>
              Levels
            </Typography>
            {levels.map(level => (
              <Button 
                key={level.id} 
                variant="contained" 
                fullWidth 
                sx={{ mb: 1 }}
                onClick={() => loadLevel(level.id)}
              >
                {level.name}
              </Button>
            ))}
          </Box>
          <Box sx={{ mt: 2, p: 2, bgcolor: '#1E1E1E', borderRadius: 2, border: '1px solid #333' }}>
            <Typography>Current Color: </Typography>
            <Box 
              sx={{ 
                width: 50, 
                height: 50, 
                bgcolor: playerColor === 'red' ? '#FF5252' : '#448AFF',
                borderRadius: '50%',
                mt: 1,
                boxShadow: '0 0 8px rgba(0,0,0,0.3)'
              }} 
            />
          </Box>
        </div>
        
        <div className="game-board">
          <Box sx={{ bgcolor: '#1E1E1E', p: 2, borderRadius: 2, border: '1px solid #333' }}>
            {levels[currentLevel] && (
              <div className="grid-container">
                {levels[currentLevel].grid.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid-row">
                    {row.map((cell, colIndex) => (
                      <motion.div
                        key={`${rowIndex}-${colIndex}`}
                        whileHover={{ scale: 1.05 }}
                        style={{ margin: 1 }}
                      >
                        <Box
                          sx={{
                            width: 30,
                            height: 30,
                            bgcolor: getCellColor(cell),
                            borderRadius: 0.5,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'relative',
                            boxShadow: cell === 'black' ? '0 0 0 1px #616161' : 'none',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                        >
                          {playerPosition[0] === rowIndex && playerPosition[1] === colIndex && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            className="player"
                            style={{
                              backgroundColor: playerColor === 'red' ? '#FF5252' : '#448AFF',
                              boxShadow: `0 0 8px ${playerColor === 'red' ? '#FF5252' : '#448AFF'}`
                            }}
                          />
                          )}
                        </Box>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </Box>
        </div>
      </div>
    </Container>
  );
};

export default App;
