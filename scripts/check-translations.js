const fs = require('fs');
const path = require('path');

// Fonction pour charger un fichier JSON
function loadJSON(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Fonction pour obtenir toutes les clés d'un objet (récursivement)
function getAllKeys(obj, prefix = '') {
    let keys = new Set();
    for (const key in obj) {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            const subKeys = getAllKeys(obj[key], newPrefix);
            subKeys.forEach(k => keys.add(k));
        } else {
            keys.add(newPrefix);
        }
    }
    return keys;
}

// Fonction pour comparer deux ensembles de clés
function compareSets(set1, set2, label1, label2) {
    const missingInSet2 = Array.from(set1).filter(key => !set2.has(key));
    if (missingInSet2.length > 0) {
        console.log(`\nClés présentes dans ${label1} mais manquantes dans ${label2}:`);
        missingInSet2.forEach(key => console.log(`- ${key}`));
    }
}

// Fonction principale
function checkTranslations() {
    const localesPath = path.join(__dirname, '../FrontEnd/public/locales');
    const files = ['admin.json', 'auth.json', 'common.json', 'features.json'];
    
    files.forEach(file => {
        console.log(`\n=== Vérification de ${file} ===`);
        
        const enPath = path.join(localesPath, 'en', file);
        const frPath = path.join(localesPath, 'fr', file);
        
        const enJson = loadJSON(enPath);
        const frJson = loadJSON(frPath);
        
        const enKeys = getAllKeys(enJson);
        const frKeys = getAllKeys(frJson);
        
        compareSets(enKeys, frKeys, 'EN', 'FR');
        compareSets(frKeys, enKeys, 'FR', 'EN');
        
        if (enKeys.size === frKeys.size && Array.from(enKeys).every(key => frKeys.has(key))) {
            console.log(`✅ Toutes les clés sont synchronisées`);
        }
    });
}

checkTranslations();
