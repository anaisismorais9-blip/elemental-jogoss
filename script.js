const W = 960;
const H = 640;
const CHUNK = 512;
const VIEW_CHUNKS = 2;

const PLAYER_SPEED = 200;
const PLAYER_MAX_HP = 120;
const PLAYER_MAX_ENERGY = 100;
const ENERGY_REGEN = 10;
const ATTACK_CD = 380;
const SPECIAL_CD = 2800;
const MAX_ENEMIES = 14;

const ELEMENT_COLORS = { fire: 0xff4400, water: 0x00aaff, earth: 0x88cc44 };
const ELEMENT_ICONS = { fire: '🔥', water: '💧', earth: '🌍' };

const GAME_CONFIG = {
    width: W,
    height: H,
    backgroundColor: 0x1a2a1a,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};const ITEMS = {
    wood:      { name: 'Madeira',       icon: '🪵', color: 0x8B5A2B, stack: 99 },
    stone:     { name: 'Pedra',         icon: '🪨', color: 0x888888, stack: 99 },
    herb:      { name: 'Erva',          icon: '🌿', color: 0x44aa44, stack: 50 },
    berry:     { name: 'Fruta',         icon: '🫐', color: 0xaa44ff, stack: 30 },
    meat:      { name: 'Carne',         icon: '🥩', color: 0xcc4444, stack: 20 },
    essence:   { name: 'Essência',      icon: '✨', color: 0xffdd44, stack: 50 },
    crystal_f: { name: 'Cristal Fogo',  icon: '🔴', color: 0xff4400, stack: 20 },
    crystal_w: { name: 'Cristal Água',  icon: '🔵', color: 0x00aaff, stack: 20 },
    crystal_e: { name: 'Cristal Terra', icon: '🟢', color: 0x88cc44, stack: 20 },
    potion:    { name: 'Poção',         icon: '🧪', color: 0xff66aa, stack: 10 },
    elixir:    { name: 'Elixir',        icon: '🧉', color: 0x66ffaa, stack: 5 },
    sword:     { name: 'Espada',        icon: '⚔️', color: 0xccccdd, stack: 1 },
    amulet:    { name: 'Amuleto',       icon: '🔮', color: 0xaa66ff, stack: 1 },
    key:       { name: 'Chave do Boss', icon: '🔑', color: 0xffcc00, stack: 1 }
};

const RECIPES = [
    { result: 'potion', amount: 1, cost: { herb: 2, berry: 1 }, name: 'Poção de Cura' },
    { result: 'elixir', amount: 1, cost: { herb: 3, crystal_w: 1, essence: 1 }, name: 'Elixir Energético' },
    { result: 'sword',  amount: 1, cost: { wood: 5, stone: 8, crystal_e: 2 }, name: 'Espada de Pedra' },
    { result: 'amulet', amount: 1, cost: { crystal_f: 2, crystal_w: 2, crystal_e: 2, essence: 5 }, name: 'Amuleto Elemental' },
    { result: 'key',    amount: 1, cost: { crystal_f: 3, crystal_w: 3, crystal_e: 3, essence: 10 }, name: 'Chave do Boss' }
];const Elements = {
    fire: {
        name: 'Fogo', icon: '🔥', color: 0xff4400, particleColor: 0xffaa00,
        attack: { damage: 20, range: 100, speed: 340, knockback: 130, type: 'projectile' },
        special: { name: 'Explosão', cost: 32, damage: 45, radius: 120 }
    },
    water: {
        name: 'Água', icon: '💧', color: 0x00aaff, particleColor: 0x88ddff,
        attack: { damage: 14, range: 110, speed: 300, knockback: 90, type: 'projectile', slow: 0.45, slowDuration: 2200 },
        special: { name: 'Cura', cost: 28, heal: 40 }
    },
    earth: {
        name: 'Terra', icon: '🌍', color: 0x88cc44, particleColor: 0xaadd66,
        attack: { damage: 17, range: 80, speed: 0, knockback: 160, type: 'melee' },
        special: { name: 'Muralha', cost: 36, shield: 50 }
    }
};

function getElementData(key) {
    return Elements[key] || Elements.fire;
}class Inventory {
    constructor() {
        this.slots = {};
        this.selected = null;
        Object.keys(ITEMS).forEach(k => this.slots[k] = 0);
    }

    add(key, amount = 1) {
        if (!ITEMS[key]) return false;
        this.slots[key] = Math.min(ITEMS[key].stack, (this.slots[key] || 0) + amount);
        if (!this.selected) this.selected = key;
        return true;
    }

    has(key, amount = 1) {
        return (this.slots[key] || 0) >= amount;
    }

    remove(key, amount = 1) {
        if (!this.has(key, amount)) return false;
        this.slots[key] -= amount;
        if (this.slots[key] <= 0 && this.selected === key) {
            this.selected = Object.keys(this.slots).find(k => this.slots[k] > 0) || null;
        }
        return true;
    }

    hasIngredients(cost) {
        return Object.entries(cost).every(([k, v]) => this.has(k, v));
    }

    consumeIngredients(cost) {
        if (!this.hasIngredients(cost)) return false;
        Object.entries(cost).forEach(([k, v]) => this.remove(k, v));
        return true;
    }

    getList() {
        return Object.entries(this.slots)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => ({ key: k, ...ITEMS[k], amount: v }));
    }
}
