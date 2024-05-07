const monsters = {
    goblin: { health: 50, damage: 5, reward: 10 },
    orc: { health: 100, damage: 10, reward: 20 },
    dragon: { health: 200, damage: 20, reward: 50, boss: true }, // Добавление босса
    skeleton: { health: 40, damage: 7, reward: 30 }
};

const itemsInfo = {
    sword: { category: 'Weapon', price: 100, damage: 15 },
    axe: { category: 'Weapon', price: 150, damage: 20 },
    dagger: { category: 'Weapon', price: 80, damage: 10 },
    shield: { category: 'Armor', price: 120, armor: 10 },
    helmet: { category: 'Armor', price: 80, armor: 5 },
    bodyarmor: { category: 'Armor', price: 200, armor: 20 },
    healing: { category: 'Potion', price: 30, effect: 'heal', value: 25 },
    strength: { category: 'Potion', price: 50, effect: 'boost', value: 5, duration: 300 },
    speed: { category: 'Potion', price: 50, effect: 'evasion', chance: 25, duration: 300 }
};

document.addEventListener('DOMContentLoaded', function() {
    populateMonsters();
    updateInventoryDisplay();
    restoreGame();
});

function updatePlayerStats() {
    let stats = JSON.parse(localStorage.getItem('playerStats')) || { health: 100, attack: 10, armor: 0, buffs: [] };
    const inventory = JSON.parse(localStorage.getItem('inventory')) || {};
    stats.attack = 10; // Reset to base attack
    stats.armor = 0; // Reset to base armor
    Object.keys(inventory).forEach(item => {
        if (itemsInfo[item] && inventory[item] > 0) {
            if (itemsInfo[item].damage) {
                stats.attack += itemsInfo[item].damage * inventory[item];
            }
            if (itemsInfo[item].armor) {
                stats.armor += itemsInfo[item].armor * inventory[item] * 0.75; // Apply armor reduction factor
            }
        }
    });
    localStorage.setItem('playerStats', JSON.stringify(stats));
    document.getElementById('playerStatsDisplay').textContent = `Health: ${stats.health}, Attack: ${stats.attack}, Armor: ${stats.armor.toFixed(2)}, Buffs: ${stats.buffs.join(", ")}`;
}

function populateMonsters() {
    const monsterSelect = document.getElementById('monsterSelect');
    monsterSelect.innerHTML = '';
    Object.keys(monsters).forEach(monster => {
        const option = document.createElement('option');
        option.value = monster;
        option.textContent = monster.charAt(0).toUpperCase() + monster.slice(1);
        monsterSelect.appendChild(option);
    });
    restoreMonsterSelection();
}

function fightMonster() {
    const monsterName = document.getElementById('monsterSelect').value;
    const monster = {...monsters[monsterName]};
    const playerStats = JSON.parse(localStorage.getItem('playerStats')) || { health: 100, attack: 10, armor: 0, buffs: [] };

    let fightOutcome = `Fighting ${monsterName}...<br>`;
    let evasionChance = playerStats.buffs.includes('evasion') ? 25 : 0; // Check for evasion buff

    while (monster.health > 0 && playerStats.health > 0) {
        if (!(monster.boss && Math.random() < evasionChance / 100)) { // Apply evasion
            playerStats.health -= Math.max(0, monster.damage - playerStats.armor);
        }
        monster.health -= playerStats.attack;

        fightOutcome += `${monsterName} hits you for ${Math.max(0, monster.damage - playerStats.armor)}. You hit ${monsterName} for ${playerStats.attack}.<br>`;

        if (playerStats.health <= 0) {
            alert('You have died! Game will restart.');
            resetGameData();
            return;
        }

        if (monster.health <= 0) {
            updateCurrency(monster.reward);
            fightOutcome += `You defeated ${monsterName}! You earn ${monster.reward} currency.<br>`;
            break;
        }
    }

    document.getElementById('fightLog').innerHTML = fightOutcome;
    updatePlayerStats();
}

function resetGameData() {
    localStorage.clear();
    location.reload();
}

function toggleHelp() {
    const helpBlock = document.getElementById('help');
    helpBlock.style.display = helpBlock.style.display === 'none' ? 'block' : 'none';
}

function buyItem() {
    const itemName = document.getElementById('itemName').value.toLowerCase();
    const itemCategory = document.getElementById('itemCategory').value;
    const itemQuantity = parseInt(document.getElementById('itemQuantity').value, 10);
    const item = itemsInfo[itemName];

    if (item && item.category === itemCategory && item.price * itemQuantity <= getPlayerCurrency()) {
        updateCurrency(-item.price * itemQuantity);
        updateInventory(itemName, itemQuantity);
        document.getElementById('errorDisplay').textContent = '';
        updatePlayerStats(); // Update stats with new items
    } else {
        document.getElementById('errorDisplay').textContent = 'Error: Invalid item name or insufficient currency.';
        document.getElementById('errorDisplay').style.color = 'red';
    }
}

function updateInventory(itemName, quantity) {
    const inventory = JSON.parse(localStorage.getItem('inventory')) || {};
    inventory[itemName] = (inventory[itemName] || 0) + quantity;
    localStorage.setItem('inventory', JSON.stringify(inventory));
    updateInventoryDisplay();
}

function updateInventoryDisplay() {
    const inventory = JSON.parse(localStorage.getItem('inventory')) || {};
    const inventoryList = document.getElementById('inventoryList');
    inventoryList.innerHTML = '<h3>Your Inventory:</h3>';
    Object.keys(inventory).forEach(item => {
        const div = document.createElement('div');
        div.textContent = `${item}: ${inventory[item]} `;
        const sellButton = document.createElement('button');
        sellButton.textContent = 'Sell';
        sellButton.onclick = function() { sellItem(item); };
        div.appendChild(sellButton);
        inventoryList.appendChild(div);
    });
}

function sellItem(itemName) {
    const inventory = JSON.parse(localStorage.getItem('inventory'));
    if (inventory[itemName] > 0) {
        inventory[itemName]--;
        if (inventory[itemName] === 0) {
            delete inventory[itemName];
        }
        localStorage.setItem('inventory', JSON.stringify(inventory));
        updateInventoryDisplay();
        updatePlayerStats(); // Update stats after selling item
    }
}

function getPlayerCurrency() {
    return parseInt(document.getElementById('currencyDisplay').textContent.replace('Currency: ', ''), 10);
}

function updateCurrency(amount) {
    const currentCurrency = getPlayerCurrency();
    document.getElementById('currencyDisplay').textContent = 'Currency: ' + (currentCurrency + amount);
}
