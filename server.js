import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors'; // Import the CORS middleware

const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON request bodies

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve a response for the root URL
app.get('/', (req, res) => {
  res.send('Welcome to the 3D Gallery API!');
});

// Endpoint to update the object.json file
app.post('/update-object', (req, res) => {
  const updatedData = req.body;

  // Path to the object.json file
  const filePath = path.join(__dirname, 'src/assets/object.json');

  // Write the updated data to the file
  fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), (err) => {
    if (err) {
      console.error('Error writing to file:', err);
      return res.status(500).send('Failed to update the file.');
    }
    res.send('File updated successfully.');
  });
});

app.post('/update-enviroment', (req, res) => {
  const updatedData = req.body;

  // Path to the enviroment.json file
  const filePath = path.join(__dirname, 'src/assets/enviroment.json');

  // Write the updated data to the file
  fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), (err) => {
    if (err) {
      console.error('Error writing to file:', err);
      return res.status(500).send('Failed to update the file.');
    }
    res.send('File updated successfully.');
  });
});

// Ignore requests for favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.post('/update-image-meta', (req, res) => {
  const { id, alt, title, index } = req.body;
  const filePath = path.join(__dirname, 'src/assets/object.json');

  // Read the current object.json
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).send('Failed to read the file.');
    }

    let json;
    try {
      json = JSON.parse(data);
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      return res.status(500).send('Failed to parse JSON.');
    }

    // Update in images array
    if (Array.isArray(json.images)) {
      json.images = json.images.map(img => {
        if (img.id === id) {
          const updatedImg = { ...img };
          if (alt !== undefined) updatedImg.alt = alt;
          if (title !== undefined) updatedImg.title = title;
          if (index !== undefined) updatedImg.index = index;
          return updatedImg;
        }
        return img;
      });
    }

    // Update in objects array (for image instances)
    if (Array.isArray(json.objects)) {
      json.objects = json.objects.map(obj => {
        if (obj.type === 'image' && obj.id === id) {
          const updatedObj = { ...obj };
          if (alt !== undefined) updatedObj.alt = alt;
          if (title !== undefined) updatedObj.title = title;
          if (index !== undefined) updatedObj.index = index;
          return updatedObj;
        }
        return obj;
      });
    }

    // Write back to file
    fs.writeFile(filePath, JSON.stringify(json, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Error writing to file:', writeErr);
        return res.status(500).send('Failed to update the file.');
      }
      res.send('Image metadata updated successfully.');
    });
  });
});

app.post('/update-enviroment', (req, res) => {
  const updatedData = req.body;

  // Path to the enviroment.json file
  const filePath = path.join(__dirname, 'src/assets/enviroment.json');

  // Write the updated data to the file
  fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), (err) => {
    if (err) {
      console.error('Error writing to file:', err);
      return res.status(500).send('Failed to update the file.');
    }
    res.send('File updated successfully.');
  });
});

app.post('/add-image', (req, res) => {
  const { id, src, alt, title } = req.body;
  const filePath = path.join(__dirname, 'src/assets/object.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return res.status(500).send('Failed to read the file.');
    }

    let json;
    try {
      json = JSON.parse(data);
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      return res.status(500).send('Failed to parse JSON.');
    }

    // Add to images array if not already present
    if (!json.images) json.images = [];
    if (!json.images.find(img => img.id === id)) {
      json.images.push({ id, src, alt, title });
    }

    fs.writeFile(filePath, JSON.stringify(json, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Error writing to file:', writeErr);
        return res.status(500).send('Failed to update the file.');
      }
      res.send('Image added successfully.');
    });
  });
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});