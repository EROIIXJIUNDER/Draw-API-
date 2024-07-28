const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const indexPath = path.join(__dirname, 'tmp');
const badWords = ["asmit"];

app.get('/lado', (req, res) => {
  res.sendFile(indexPath);
});

app.get('/generate', async (req, res) => {
  const prompt = req.query.prompt;

  if (!prompt) {
    return res.status(400).send("Please provide a prompt.");
  }

  const words = prompt.split(/[\s,]+/);
  const bannedWord = words.find(word => badWords.includes(word.toLowerCase()));
  if (bannedWord) {
    return res.status(400).send(`Sorry, but you are not allowed to use the word "${bannedWord}".`);
  }

  const baseURL = 'https://api.creartai.com/api/v1/text2image';

  const options = {
    method: 'POST',
    url: baseURL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: new URLSearchParams({
      prompt: prompt,
      negative_prompt: ',malformed hands,malformed fingers,malformed faces,malformed body parts,mutated body parts,malfromed eyes,mutated fingers,mutated hands,realistic,worst quality, low quality, blurry, pixelated, extra limb, extra fingers, bad hand, text, name, letters, out of frame, lowres, text, error, cropped, jpeg artifacts, ugly, duplicate, morbid, mutilated, out of frame, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, username,',
      aspect_ratio: '3x3',
      num_outputs: '',
      num_inference_steps: '',
      controlnet_conditioning_scale: 0.5,
      guidance_scale: '5.5',
      scheduler: '',
      seed: ''
    })
  };

  try {
    const response = await axios(options);
    const imageData = response.data.image_base64;
    const imageBuffer = Buffer.from(imageData, 'base64');
    const tmpDir = path.join(__dirname, 'tmp');
    const imagePath = path.join(tmpDir, `${Date.now()}.jpg`);

    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }

    fs.writeFileSync(imagePath, imageBuffer);

    res.sendFile(imagePath, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Failed to send the image.");
      }
      
      fs.unlinkSync(imagePath);
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to generate the image. Please try again later.");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
