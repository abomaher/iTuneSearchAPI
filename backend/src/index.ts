import express from "express";
import mongoose from "mongoose";
import { searchAndSave } from "./services/searchResultService.js";
import cors from "cors";

const app = express();
const port = 3008;

app.use(express.json());
app.use(cors());

mongoose
  .connect("mongodb+srv://project8abdulhakim_db_user:mNOdW9YgpVObFjTG@cluster0.fcfihkg.mongodb.net/search?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("Connected"))
  .catch((err) => console.log("Can not connected!", err));

// Search endpoint
app.get('/search/:searchWord', async (req, res) => {
  try {
    const { searchWord } = req.params;

    if (!searchWord) {
      return res.status(400).json({
        success: false,
        error: 'searchWord parameter is required'
      });
    }

    const result = await searchAndSave(searchWord);
    res.json(result);
    
  } catch (error) {
    console.error('Search endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at: http://localhost:${port}`);
});