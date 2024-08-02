'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import '../app/styles.css';
import { firestore } from '@/firebase';  
import { Box, Button, Modal, Stack, TextField, Typography, AppBar, Toolbar,
         InputBase, Paper, Table, TableBody, TableCell, TableContainer,
          TableHead, TableRow, ThemeProvider, createTheme } from '@mui/material';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc } from 'firebase/firestore';
import { styled, alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1D2B1D',
    },
    background: {
      default: '#EFE6D4',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: '#3B523B',
          color: '#F1F1F0',
          borderRadius: '10px',
          '&:hover': {
            backgroundColor: '#1D2B1D',
          },
        },
      },
    },
  },
  typography: {
    fontFamily: '"Roboto", sans-serif',
  },
});

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [expDate, setExpDate] = useState('');
  const [mfgDate, setMfgDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationResult, setClassificationResult] = useState('');
  const [image, setImage] = useState(null);
  const [classification, setClassification] = useState('');
  const [cameraImage, setCameraImage] = useState(null);

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'Inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
  };

  const addItem = async (item, quantity = 1, expDate = '', mfgDate = '', classification = '') => {
    const docRef = doc(collection(firestore, 'Inventory'), item);
    const docSnap = await getDoc(docRef);
  
    const data = {
      Quantity: docSnap.exists() ? docSnap.data().Quantity + quantity : quantity,
    };
  
    if (expDate) data.EXP = expDate;
    if (mfgDate) data.MFG = mfgDate;
    if (classification) data.Classification = classification;
  
    await setDoc(docRef, data, { merge: true });
    await updateInventory();
  };
  

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'Inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { Quantity } = docSnap.data();
      if (Quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { Quantity: Quantity - 1 });
      }
    }
    await updateInventory();
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const fetchRecipes = async () => {
    const items = inventory.map((item) => item.name).join(', ');

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: `Suggest a recipe using the following ingredients: ${items}`
          }
        ],
        max_tokens: 100,
      }, {
        headers: {
          'Authorization': `Bearer YOUR_OPENAI_API_KEY`,
          'Content-Type': 'application/json'
        },
      });

      // Extract and set the recipes
      const recipes = response.data.choices.map(choice => choice.message.content.trim());
      setRecipes(recipes);

    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      video.addEventListener('loadeddata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          setCameraImage(blob);
        });
      });
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  };

  const classifyImage = async () => {
    if (!image && !cameraImage) return;

    const file = image || cameraImage;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('https://openrouter.ai/models/meta-llama/llama-3.1-8b-instruct%3Afree/api', formData, {
        headers: {
          'Authorization': `Bearer YOUR_META_LLAMA_API_KEY`,
          'Content-Type': 'multipart/form-data'
        },
      });

      setClassification(response.data.classification);
    } catch (error) {
      console.error('Error classifying image:', error);
    }
  };

  useEffect(() => {
    updateInventory();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="flex-start"
        alignItems="center"
        gap={2}
        p={2}
        sx={{ 
          position: 'absolute', 
          
          backgroundImage: 'url("/background-image.jpeg")', // Update with your image path
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundRepeat: 'no-repeat' 
        }} 
      >
        <AppBar position="static" sx={{ backgroundColor: '#1D2B1D', color: '#F1F1F0', width: '100%' }}>
          <Toolbar>
            <Image src="/Logo.png" alt="Logo" width={60} height={45} />
            <Typography variant="h5" noWrap component="div" sx={{ flexGrow: 1, ml: 1 }}>
              PANTRY TRACKER
            </Typography>
            <Search>
              <SearchIconWrapper>
                <SearchIcon sx={{ color: '#F1F1F0' }} />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search…"
                inputProps={{ 'aria-label': 'search' }}
                onChange={handleSearch}
              />
            </Search>
          </Toolbar>
        </AppBar>

        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
          p={2}
          sx={{ overflow: 'auto', maxHeight: '80vh' }}
        >
          <Box display="flex" justifyContent="space-between" width="100%" maxWidth="800px" gap={2}>
            <Button variant="contained" onClick={handleOpen} sx={{ mb: 2 }}>
              Add New Item
            </Button>
            <Button variant="contained" onClick={fetchRecipes} sx={{ mb: 2 }}>
              Suggest Recipes
            </Button>
          </Box>

          <Modal open={open} onClose={handleClose}>
            <Box
              position="absolute"
              top="50%"
              left="50%"
              width={400}
              bgcolor="white"
              border="2px solid #000"
              boxShadow={24}
              p={4}
              display="flex"
              flexDirection="column"
              gap={3}
              sx={{
                transform: 'translate(-50%,-50%)',
              }}
            >
              <Typography variant="h6">Add Item</Typography>
              <Stack width="100%" direction="column" spacing={2}>
                <TextField
                  variant="outlined"
                  fullWidth
                  label="Item Name"
                  value={itemName}
                  onChange={(e) => {
                    setItemName(e.target.value);
                  }}
                />
                <Stack direction="row" spacing={2}>
                  <input
                    type="file"
                    accept="image/*"
                    id="upload"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="upload">
                    <Button variant="contained" component="span" sx={{ backgroundColor: '#B0B0B0' }}>
                      Choose Image
                    </Button>
                  </label>
                  <Button variant="contained" onClick={handleCameraCapture} sx={{ backgroundColor: '#B0B0B0' }}>
                    Upload Image
                  </Button>
                </Stack>
                <Button variant="contained" onClick={classifyImage} sx={{ mb: 2, backgroundColor: '#B0B0B0' }}>
                  Classify Image
                </Button>
                <TextField
                  variant="outlined"
                  type="number"
                  label="Quantity"
                  value={itemQuantity}
                  onChange={(e) => {
                    setItemQuantity(Number(e.target.value));
                  }}
                />
                <Stack width="100%" direction="row" spacing={2}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    label="EXP Date"
                    value={expDate}
                    onChange={(e) => {
                      setExpDate(e.target.value);
                    }}
                  />
                  <TextField
                    variant="outlined"
                    fullWidth
                    label="MFG Date"
                    value={mfgDate}
                    onChange={(e) => {
                      setMfgDate(e.target.value);
                    }}
                  />
                </Stack>
                {classification && (
                  <Typography variant="h6">Classification: {classification}</Typography>
                )}
                <Button
                  variant="contained"
                  onClick={() => {
                    addItem(itemName, itemQuantity, expDate, mfgDate, classification);
                    setItemName('');
                    setItemQuantity(1); 
                    setExpDate(''); 
                    setMfgDate(''); 
                    setImage(null); 
                    setCameraImage(null); 
                    setClassification(''); 
                    handleClose();
                  }}
                >
                  Add
                </Button>
              </Stack>
            </Box>
          </Modal>

          <Paper elevation={3} sx={{ width: '100%', maxWidth: '800px', backgroundColor: '#F1F1F0' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#1D2B1D', fontWeight: 'bold' }}>Item</TableCell>
                    <TableCell align="right" sx={{ color: '#1D2B1D', fontWeight: 'bold' }}>Quantity</TableCell>
                    <TableCell align="right" sx={{ color: '#1D2B1D', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
                    <TableRow key={row.name}>
                      <TableCell component="th" scope="row" sx={{ color: '#1D2B1D' }}>
                        {row.name}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#1D2B1D' }}>{row.Quantity}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={2} justifyContent="flex-end"> {/* Align buttons to the right */}
                          <Button
                            variant="contained" 
                            onClick={() => {
                              addItem(row.name, 1);
                            }}
                          >
                            Add
                          </Button>
                          <Button
                            variant="contained" 
                            onClick={() => {
                              removeItem(row.name);
                            }}
                          >
                            Remove
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '20px',
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: '#F1F1F0',
  borderRadius: '20px',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '12ch',
      '&:focus': {
        width: '20ch',
      },
    },
  },
}));
