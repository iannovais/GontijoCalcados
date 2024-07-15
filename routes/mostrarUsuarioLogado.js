const express = require('express');
const router = express.Router();

// Rota GET para obter funcionários do banco de dados ProductEase
router.get('/mostrarUsuarioLogado', (req, res) => {
 
        const nome = req.session.user.name;

        if (req.session.user.profile_picture == null ){
            var foto = req.session.user.picture;
        } else {
            var foto = req.session.user.profile_picture;

        }
        const results = {nome, foto}
        
        res.json(results);

});

module.exports = router;
