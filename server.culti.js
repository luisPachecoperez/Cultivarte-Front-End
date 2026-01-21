const express = require('express');
const path = require('path');

const app = express();
console.log("inicio");

// Ruta real del build Angular
const distFolder = path.join(__dirname, 'dist');

// 1) Servir estáticos con prefix /v1/culti
app.use('/v1/culti/', express.static(distFolder, {
  maxAge: '1h'
}));

// 2) Catch-all SOLO para rutas bajo /v1/culti/*
app.get('/v1/culti/{*splat}', (req, res) => {
  res.sendFile(path.join(distFolder, 'index.html')); 
});


// 3) (Opcional) redirigir raíz al calendario
app.get('/', (req, res) => {
  return res.redirect('/v1/culti/calendar');
});

const PORT =  8001;
app.listen(PORT, () => {
  console.log(`CultiApp SPA ejecutándose`);
});