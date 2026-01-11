// app.js
(() => {
  // ---------- IndexedDB Store ----------
  const DB_NAME = "VotingApp";
  const DB_VERSION = 1;
  const STORE = "sessions";
  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
    });
    return dbPromise;
  }

  function idbReq(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getAllSessions() {
    const db = await openDB();
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const all = await idbReq(store.getAll());
    return (all || []).sort((a, b) => b.createdAt - a.createdAt);
  }

  async function putSession(session) {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    await idbReq(store.put(session));
  }

  async function addSession(session) {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    await idbReq(store.add(session));
  }

  async function deleteSessionFromDB(sessionId) {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    await idbReq(store.delete(sessionId));
  }

  async function getSessionFromDB(sessionId) {
    const db = await openDB();
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    return await idbReq(store.get(sessionId));
  }

  // ---------- State ----------
  let sessions = [];
  let loading = true;

  let view = { type: "dashboard" }; // {type:'dashboard'} | {type:'session', sessionId}
  let createModalOpen = false;
  let settingsModalOpen = false;

  // ---------- Templates ----------
  const tplSessionCard = document.getElementById("tpl-session-card");
  const tplChoiceRow = document.getElementById("tpl-choice-row");
  const tplCreateChoiceEditorRow = document.getElementById("tpl-create-choice-editor-row");
  const tplSettingsChoiceRow = document.getElementById("tpl-settings-choice-row");
  const tplEmojiItem = document.getElementById("tpl-emoji-item");


  // ---------- Elements ----------
  const loadingView = document.getElementById("loadingView");
  const dashboardView = document.getElementById("dashboardView");
  const sessionView = document.getElementById("sessionView");

  const sessionsListEl = document.getElementById("sessionsList");
  const dashboardEmptyEl = document.getElementById("dashboardEmpty");

  const appBackBtn = document.getElementById("appBackBtn");
  const newSessionBtn = document.getElementById("newSessionBtn");
  const dashboardNewBtn = document.getElementById("dashboardNewBtn");
  const emptyCreateBtn = document.getElementById("emptyCreateBtn");

  const sessionBackBtn = document.getElementById("sessionBackBtn");
  const openSettingsBtn = document.getElementById("openSettingsBtn");
  const sessionSettingsBtn = document.getElementById("sessionSettingsBtn");

  const sessionNameEl = document.getElementById("sessionName");
  const sessionMetaEl = document.getElementById("sessionMeta");
  const choicesListEl = document.getElementById("choicesList");
  const appSubtitleEl = document.getElementById("appSubtitle");

  // Create modal
  const createModal = document.getElementById("createModal");
  const createForm = document.getElementById("createForm");
  const createNameInput = document.getElementById("createName");
  const createChoicesEl = document.getElementById("createChoices");
  const addCreateChoiceBtn = document.getElementById("addCreateChoiceBtn");
  const createSubmitBtn = document.getElementById("createSubmitBtn");

  // Settings modal
  const settingsModal = document.getElementById("settingsModal");
  const settingsChoicesList = document.getElementById("settingsChoicesList");
  const toggleAddChoiceBtn = document.getElementById("toggleAddChoiceBtn");
  const addChoiceForm = document.getElementById("addChoiceForm");
  const addChoiceEmojiBtn = document.getElementById("addChoiceEmojiBtn");
  const addChoiceTitle = document.getElementById("addChoiceTitle");
  const addChoiceNotes = document.getElementById("addChoiceNotes");
  const cancelAddChoiceBtn = document.getElementById("cancelAddChoiceBtn");
  const deleteSessionBtn = document.getElementById("deleteSessionBtn");

  // Emoji picker
  const emojiOverlay = document.getElementById("emojiOverlay");
  const emojiPicker = document.getElementById("emojiPicker");
  const emojiSearchInput = document.getElementById("emojiSearchInput");
  const emojiGrid = document.getElementById("emojiGrid");
  const emojiEmpty = document.getElementById("emojiEmpty");

  // ---------- Emoji Data (subset; behavior same, list can be expanded) ----------
  // Emoji data with searchable keywords - NO FACES OR PEOPLE
  const EMOJI_DATA = [
    // Hearts & Symbols
    {
      emoji: '❤️',
      keywords: ['heart', 'love', 'red'],
    },
    {
      emoji: '🧡',
      keywords: ['orange', 'heart', 'love'],
    },
    {
      emoji: '💛',
      keywords: ['yellow', 'heart', 'love'],
    },
    {
      emoji: '💚',
      keywords: ['green', 'heart', 'love'],
    },
    {
      emoji: '💙',
      keywords: ['blue', 'heart', 'love'],
    },
    {
      emoji: '💜',
      keywords: ['purple', 'heart', 'love'],
    },
    {
      emoji: '🖤',
      keywords: ['black', 'heart', 'love'],
    },
    {
      emoji: '🤍',
      keywords: ['white', 'heart', 'love'],
    },
    {
      emoji: '🤎',
      keywords: ['brown', 'heart', 'love'],
    },
    {
      emoji: '💔',
      keywords: ['broken', 'heart', 'sad'],
    },
    {
      emoji: '❤️‍🔥',
      keywords: ['heart', 'fire', 'passion'],
    },
    {
      emoji: '❤️‍🩹',
      keywords: ['mending', 'heart', 'healing'],
    },
    {
      emoji: '💕',
      keywords: ['two', 'hearts', 'love'],
    },
    {
      emoji: '💞',
      keywords: ['revolving', 'hearts', 'love'],
    },
    {
      emoji: '💓',
      keywords: ['beating', 'heart', 'love'],
    },
    {
      emoji: '💗',
      keywords: ['growing', 'heart', 'love'],
    },
    {
      emoji: '💖',
      keywords: ['sparkling', 'heart', 'love'],
    },
    {
      emoji: '💘',
      keywords: ['cupid', 'arrow', 'heart', 'love'],
    },
    {
      emoji: '💝',
      keywords: ['heart', 'gift', 'love'],
    },
    {
      emoji: '💟',
      keywords: ['heart', 'decoration'],
    },
    {
      emoji: '☮️',
      keywords: ['peace', 'symbol'],
    },
    {
      emoji: '☪️',
      keywords: ['star', 'crescent', 'islam'],
    },
    {
      emoji: '🕉',
      keywords: ['om', 'hindu'],
    },
    {
      emoji: '⭐',
      keywords: ['star', 'favorite'],
    },
    {
      emoji: '🌟',
      keywords: ['glowing', 'star', 'sparkle'],
    },
    {
      emoji: '✨',
      keywords: ['sparkles', 'shine', 'magic'],
    },
    {
      emoji: '⚡',
      keywords: ['lightning', 'bolt', 'zap', 'electric'],
    },
    {
      emoji: '🔥',
      keywords: ['fire', 'hot', 'flame', 'lit'],
    },
    {
      emoji: '💥',
      keywords: ['boom', 'explosion', 'bang'],
    },
    {
      emoji: '💫',
      keywords: ['dizzy', 'star'],
    },
    {
      emoji: '💦',
      keywords: ['sweat', 'water', 'drops'],
    },
    // Weather & Nature
    {
      emoji: '☀️',
      keywords: ['sun', 'sunny', 'bright'],
    },
    {
      emoji: '🌤',
      keywords: ['sun', 'cloud', 'partly'],
    },
    {
      emoji: '⛅',
      keywords: ['sun', 'behind', 'cloud'],
    },
    {
      emoji: '🌥',
      keywords: ['cloud', 'sun'],
    },
    {
      emoji: '☁️',
      keywords: ['cloud', 'cloudy'],
    },
    {
      emoji: '🌦',
      keywords: ['sun', 'rain', 'cloud'],
    },
    {
      emoji: '🌧',
      keywords: ['rain', 'cloud'],
    },
    {
      emoji: '⛈',
      keywords: ['thunder', 'cloud', 'lightning'],
    },
    {
      emoji: '🌩',
      keywords: ['cloud', 'lightning'],
    },
    {
      emoji: '🌨',
      keywords: ['snow', 'cloud'],
    },
    {
      emoji: '❄️',
      keywords: ['snowflake', 'snow', 'cold'],
    },
    {
      emoji: '💨',
      keywords: ['dash', 'wind', 'fast'],
    },
    {
      emoji: '🌪',
      keywords: ['tornado', 'cyclone'],
    },
    {
      emoji: '🌈',
      keywords: ['rainbow', 'pride'],
    },
    {
      emoji: '☔',
      keywords: ['umbrella', 'rain'],
    },
    {
      emoji: '💧',
      keywords: ['droplet', 'water'],
    },
    {
      emoji: '🌊',
      keywords: ['wave', 'water', 'ocean'],
    },
    // Fruits & Vegetables
    {
      emoji: '🍎',
      keywords: ['apple', 'red', 'fruit'],
    },
    {
      emoji: '🍊',
      keywords: ['orange', 'fruit'],
    },
    {
      emoji: '🍋',
      keywords: ['lemon', 'fruit'],
    },
    {
      emoji: '🍌',
      keywords: ['banana', 'fruit'],
    },
    {
      emoji: '🍉',
      keywords: ['watermelon', 'fruit'],
    },
    {
      emoji: '🍇',
      keywords: ['grapes', 'fruit'],
    },
    {
      emoji: '🍓',
      keywords: ['strawberry', 'fruit'],
    },
    {
      emoji: '🫐',
      keywords: ['blueberries', 'fruit'],
    },
    {
      emoji: '🍈',
      keywords: ['melon', 'fruit'],
    },
    {
      emoji: '🍒',
      keywords: ['cherries', 'fruit'],
    },
    {
      emoji: '🍑',
      keywords: ['peach', 'fruit'],
    },
    {
      emoji: '🥭',
      keywords: ['mango', 'fruit'],
    },
    {
      emoji: '🍍',
      keywords: ['pineapple', 'fruit'],
    },
    {
      emoji: '🥥',
      keywords: ['coconut', 'fruit'],
    },
    {
      emoji: '🥝',
      keywords: ['kiwi', 'fruit'],
    },
    {
      emoji: '🍅',
      keywords: ['tomato', 'vegetable'],
    },
    {
      emoji: '🍆',
      keywords: ['eggplant', 'vegetable'],
    },
    {
      emoji: '🥑',
      keywords: ['avocado', 'fruit'],
    },
    {
      emoji: '🥦',
      keywords: ['broccoli', 'vegetable'],
    },
    {
      emoji: '🥬',
      keywords: ['leafy', 'green', 'vegetable'],
    },
    {
      emoji: '🥒',
      keywords: ['cucumber', 'vegetable'],
    },
    {
      emoji: '🌶',
      keywords: ['pepper', 'hot', 'spicy'],
    },
    {
      emoji: '🫑',
      keywords: ['bell', 'pepper', 'vegetable'],
    },
    {
      emoji: '🌽',
      keywords: ['corn', 'vegetable'],
    },
    {
      emoji: '🥕',
      keywords: ['carrot', 'vegetable'],
    },
    {
      emoji: '🫒',
      keywords: ['olive', 'fruit'],
    },
    {
      emoji: '🧄',
      keywords: ['garlic', 'vegetable'],
    },
    {
      emoji: '🧅',
      keywords: ['onion', 'vegetable'],
    },
    {
      emoji: '🥔',
      keywords: ['potato', 'vegetable'],
    },
    {
      emoji: '🍠',
      keywords: ['sweet', 'potato'],
    },
    // Bread & Dairy
    {
      emoji: '🥐',
      keywords: ['croissant', 'bread'],
    },
    {
      emoji: '🥯',
      keywords: ['bagel', 'bread'],
    },
    {
      emoji: '🍞',
      keywords: ['bread', 'loaf'],
    },
    {
      emoji: '🥖',
      keywords: ['baguette', 'bread', 'french'],
    },
    {
      emoji: '🥨',
      keywords: ['pretzel', 'bread'],
    },
    {
      emoji: '🧀',
      keywords: ['cheese'],
    },
    {
      emoji: '🥚',
      keywords: ['egg'],
    },
    {
      emoji: '🍳',
      keywords: ['cooking', 'egg', 'fried'],
    },
    {
      emoji: '🧈',
      keywords: ['butter'],
    },
    // Prepared Foods
    {
      emoji: '🥞',
      keywords: ['pancakes', 'breakfast'],
    },
    {
      emoji: '🧇',
      keywords: ['waffle', 'breakfast'],
    },
    {
      emoji: '🥩',
      keywords: ['meat', 'steak'],
    },
    {
      emoji: '🍗',
      keywords: ['poultry', 'leg', 'chicken'],
    },
    {
      emoji: '🍖',
      keywords: ['meat', 'bone'],
    },
    {
      emoji: '🦴',
      keywords: ['bone'],
    },
    {
      emoji: '🌭',
      keywords: ['hot', 'dog'],
    },
    {
      emoji: '🍔',
      keywords: ['burger', 'hamburger'],
    },
    {
      emoji: '🍟',
      keywords: ['fries', 'french'],
    },
    {
      emoji: '🍕',
      keywords: ['pizza', 'slice'],
    },
    {
      emoji: '🫓',
      keywords: ['flatbread'],
    },
    {
      emoji: '🥪',
      keywords: ['sandwich'],
    },
    {
      emoji: '🥙',
      keywords: ['stuffed', 'flatbread', 'pita'],
    },
    {
      emoji: '🧆',
      keywords: ['falafel'],
    },
    {
      emoji: '🌮',
      keywords: ['taco', 'mexican'],
    },
    {
      emoji: '🌯',
      keywords: ['burrito', 'mexican'],
    },
    {
      emoji: '🫔',
      keywords: ['tamale', 'mexican'],
    },
    {
      emoji: '🥗',
      keywords: ['salad', 'green'],
    },
    {
      emoji: '🥘',
      keywords: ['paella', 'pan', 'food'],
    },
    {
      emoji: '🫕',
      keywords: ['fondue', 'cheese'],
    },
    {
      emoji: '🥫',
      keywords: ['canned', 'food'],
    },
    {
      emoji: '🍝',
      keywords: ['spaghetti', 'pasta'],
    },
    {
      emoji: '🍜',
      keywords: ['ramen', 'noodles'],
    },
    {
      emoji: '🍲',
      keywords: ['pot', 'food', 'stew'],
    },
    {
      emoji: '🍛',
      keywords: ['curry', 'rice'],
    },
    {
      emoji: '🍣',
      keywords: ['sushi', 'japanese'],
    },
    {
      emoji: '🍱',
      keywords: ['bento', 'box', 'japanese'],
    },
    {
      emoji: '🥟',
      keywords: ['dumpling', 'chinese'],
    },
    {
      emoji: '🍤',
      keywords: ['shrimp', 'fried', 'seafood'],
    },
    {
      emoji: '🍙',
      keywords: ['rice', 'ball', 'japanese'],
    },
    {
      emoji: '🍚',
      keywords: ['rice', 'cooked'],
    },
    {
      emoji: '🍘',
      keywords: ['rice', 'cracker', 'japanese'],
    },
    {
      emoji: '🍥',
      keywords: ['fish', 'cake', 'japanese'],
    },
    {
      emoji: '🥠',
      keywords: ['fortune', 'cookie'],
    },
    {
      emoji: '🥮',
      keywords: ['moon', 'cake', 'chinese'],
    },
    {
      emoji: '🍢',
      keywords: ['oden', 'japanese'],
    },
    {
      emoji: '🍡',
      keywords: ['dango', 'japanese', 'sweet'],
    },
    // Desserts
    {
      emoji: '🍧',
      keywords: ['shaved', 'ice', 'dessert'],
    },
    {
      emoji: '🍨',
      keywords: ['ice', 'cream'],
    },
    {
      emoji: '🍦',
      keywords: ['soft', 'ice', 'cream'],
    },
    {
      emoji: '🥧',
      keywords: ['pie', 'dessert'],
    },
    {
      emoji: '🧁',
      keywords: ['cupcake', 'dessert'],
    },
    {
      emoji: '🍰',
      keywords: ['cake', 'slice', 'dessert'],
    },
    {
      emoji: '🍮',
      keywords: ['custard', 'pudding', 'dessert'],
    },
    {
      emoji: '🍭',
      keywords: ['lollipop', 'candy'],
    },
    {
      emoji: '🍬',
      keywords: ['candy', 'sweet'],
    },
    {
      emoji: '🍫',
      keywords: ['chocolate', 'bar'],
    },
    {
      emoji: '🍿',
      keywords: ['popcorn', 'movie'],
    },
    {
      emoji: '🍩',
      keywords: ['donut', 'doughnut'],
    },
    {
      emoji: '🍪',
      keywords: ['cookie'],
    },
    {
      emoji: '🌰',
      keywords: ['chestnut', 'nut'],
    },
    {
      emoji: '🥜',
      keywords: ['peanuts', 'nut'],
    },
    {
      emoji: '🍯',
      keywords: ['honey', 'pot'],
    },
    // Drinks
    {
      emoji: '🥛',
      keywords: ['milk', 'glass'],
    },
    {
      emoji: '🍼',
      keywords: ['baby', 'bottle'],
    },
    {
      emoji: '🫖',
      keywords: ['teapot', 'tea'],
    },
    {
      emoji: '☕',
      keywords: ['coffee', 'hot', 'drink'],
    },
    {
      emoji: '🍵',
      keywords: ['tea', 'cup'],
    },
    {
      emoji: '🧃',
      keywords: ['juice', 'box'],
    },
    {
      emoji: '🥤',
      keywords: ['cup', 'straw', 'drink'],
    },
    {
      emoji: '🧋',
      keywords: ['bubble', 'tea', 'boba'],
    },
    {
      emoji: '🧊',
      keywords: ['ice', 'cube'],
    },
    // Sports Equipment (no people)
    {
      emoji: '⚽',
      keywords: ['soccer', 'ball', 'football'],
    },
    {
      emoji: '🏀',
      keywords: ['basketball', 'ball'],
    },
    {
      emoji: '🏈',
      keywords: ['football', 'american'],
    },
    {
      emoji: '⚾',
      keywords: ['baseball', 'ball'],
    },
    {
      emoji: '🥎',
      keywords: ['softball', 'ball'],
    },
    {
      emoji: '🎾',
      keywords: ['tennis', 'ball'],
    },
    {
      emoji: '🏐',
      keywords: ['volleyball', 'ball'],
    },
    {
      emoji: '🏉',
      keywords: ['rugby', 'ball'],
    },
    {
      emoji: '🥏',
      keywords: ['frisbee', 'disc'],
    },
    {
      emoji: '🎱',
      keywords: ['pool', '8', 'ball', 'billiards'],
    },
    {
      emoji: '🪀',
      keywords: ['yo-yo', 'toy'],
    },
    {
      emoji: '🏓',
      keywords: ['ping', 'pong', 'table', 'tennis'],
    },
    {
      emoji: '🏸',
      keywords: ['badminton', 'racquet'],
    },
    {
      emoji: '🏒',
      keywords: ['ice', 'hockey', 'stick'],
    },
    {
      emoji: '🏑',
      keywords: ['field', 'hockey', 'stick'],
    },
    {
      emoji: '🥍',
      keywords: ['lacrosse', 'stick'],
    },
    {
      emoji: '🏏',
      keywords: ['cricket', 'bat'],
    },
    {
      emoji: '🪃',
      keywords: ['boomerang'],
    },
    {
      emoji: '🥅',
      keywords: ['goal', 'net'],
    },
    {
      emoji: '⛳',
      keywords: ['golf', 'flag', 'hole'],
    },
    {
      emoji: '🪁',
      keywords: ['kite', 'fly'],
    },
    {
      emoji: '🏹',
      keywords: ['bow', 'arrow', 'archery'],
    },
    {
      emoji: '🤿',
      keywords: ['diving', 'mask'],
    },
    {
      emoji: '🥊',
      keywords: ['boxing', 'glove'],
    },
    {
      emoji: '🥋',
      keywords: ['martial', 'arts', 'uniform'],
    },
    {
      emoji: '🎽',
      keywords: ['running', 'shirt'],
    },
    {
      emoji: '🛹',
      keywords: ['skateboard'],
    },
    {
      emoji: '🛼',
      keywords: ['roller', 'skate'],
    },
    {
      emoji: '🛷',
      keywords: ['sled'],
    },
    {
      emoji: '⛸',
      keywords: ['ice', 'skate'],
    },
    {
      emoji: '🥌',
      keywords: ['curling', 'stone'],
    },
    {
      emoji: '🎿',
      keywords: ['skis'],
    },
    {
      emoji: '🏂',
      keywords: ['snowboard'],
    },
    {
      emoji: '🪂',
      keywords: ['parachute', 'skydiving'],
    },
    // Entertainment
    {
      emoji: '🎪',
      keywords: ['circus', 'tent'],
    },
    {
      emoji: '🎨',
      keywords: ['art', 'palette', 'painting'],
    },
    {
      emoji: '🎬',
      keywords: ['clapper', 'board', 'movie'],
    },
    {
      emoji: '🎤',
      keywords: ['microphone', 'singing'],
    },
    {
      emoji: '🎧',
      keywords: ['headphones', 'music'],
    },
    {
      emoji: '🎯',
      keywords: ['target', 'dart', 'bullseye'],
    },
    {
      emoji: '🎳',
      keywords: ['bowling', 'ball', 'pins'],
    },
    {
      emoji: '🎮',
      keywords: ['video', 'game', 'controller'],
    },
    {
      emoji: '🎰',
      keywords: ['slot', 'machine', 'casino'],
    },
    {
      emoji: '🧩',
      keywords: ['puzzle', 'piece', 'jigsaw'],
    },
    // Vehicles
    {
      emoji: '🚗',
      keywords: ['car', 'automobile', 'vehicle'],
    },
    {
      emoji: '🚕',
      keywords: ['taxi', 'cab'],
    },
    {
      emoji: '🚙',
      keywords: ['suv', 'car'],
    },
    {
      emoji: '🚌',
      keywords: ['bus'],
    },
    {
      emoji: '🚎',
      keywords: ['trolleybus'],
    },
    {
      emoji: '🏎',
      keywords: ['race', 'car', 'racing'],
    },
    {
      emoji: '🚓',
      keywords: ['police', 'car'],
    },
    {
      emoji: '🚑',
      keywords: ['ambulance'],
    },
    {
      emoji: '🚒',
      keywords: ['fire', 'engine', 'truck'],
    },
    {
      emoji: '🚐',
      keywords: ['minibus', 'van'],
    },
    {
      emoji: '🛻',
      keywords: ['pickup', 'truck'],
    },
    {
      emoji: '🚚',
      keywords: ['delivery', 'truck'],
    },
    {
      emoji: '🚛',
      keywords: ['articulated', 'lorry', 'truck'],
    },
    {
      emoji: '🚜',
      keywords: ['tractor', 'farm'],
    },
    {
      emoji: '🦯',
      keywords: ['probing', 'cane', 'blind'],
    },
    {
      emoji: '🦽',
      keywords: ['manual', 'wheelchair'],
    },
    {
      emoji: '🦼',
      keywords: ['motorized', 'wheelchair'],
    },
    {
      emoji: '🛴',
      keywords: ['scooter', 'kick'],
    },
    {
      emoji: '🚲',
      keywords: ['bicycle', 'bike'],
    },
    {
      emoji: '🛵',
      keywords: ['motor', 'scooter'],
    },
    {
      emoji: '🏍',
      keywords: ['motorcycle'],
    },
    {
      emoji: '🛺',
      keywords: ['auto', 'rickshaw'],
    },
    {
      emoji: '🚨',
      keywords: ['police', 'light', 'siren'],
    },
    {
      emoji: '🚔',
      keywords: ['oncoming', 'police', 'car'],
    },
    {
      emoji: '🚍',
      keywords: ['oncoming', 'bus'],
    },
    {
      emoji: '🚘',
      keywords: ['oncoming', 'car'],
    },
    {
      emoji: '🚖',
      keywords: ['oncoming', 'taxi'],
    },
    {
      emoji: '🚡',
      keywords: ['aerial', 'tramway'],
    },
    {
      emoji: '🚠',
      keywords: ['mountain', 'cableway'],
    },
    {
      emoji: '🚟',
      keywords: ['suspension', 'railway'],
    },
    {
      emoji: '🚃',
      keywords: ['railway', 'car'],
    },
    {
      emoji: '🚋',
      keywords: ['tram', 'car'],
    },
    {
      emoji: '🚞',
      keywords: ['mountain', 'railway'],
    },
    {
      emoji: '🚝',
      keywords: ['monorail'],
    },
    {
      emoji: '🚄',
      keywords: ['high', 'speed', 'train'],
    },
    {
      emoji: '🚅',
      keywords: ['bullet', 'train'],
    },
    {
      emoji: '🚈',
      keywords: ['light', 'rail'],
    },
    {
      emoji: '🚂',
      keywords: ['locomotive', 'steam'],
    },
    {
      emoji: '🚆',
      keywords: ['train'],
    },
    {
      emoji: '🚇',
      keywords: ['metro', 'subway'],
    },
    {
      emoji: '🚊',
      keywords: ['tram'],
    },
    {
      emoji: '🚉',
      keywords: ['station'],
    },
    {
      emoji: '✈️',
      keywords: ['airplane', 'plane', 'flight'],
    },
    {
      emoji: '🛫',
      keywords: ['airplane', 'departure', 'takeoff'],
    },
    {
      emoji: '🛬',
      keywords: ['airplane', 'arrival', 'landing'],
    },
    {
      emoji: '🛩',
      keywords: ['small', 'airplane'],
    },
    {
      emoji: '💺',
      keywords: ['seat', 'airplane'],
    },
    {
      emoji: '🛰',
      keywords: ['satellite', 'space'],
    },
    {
      emoji: '🚀',
      keywords: ['rocket', 'space', 'launch'],
    },
    {
      emoji: '🛸',
      keywords: ['flying', 'saucer', 'ufo', 'alien'],
    },
    {
      emoji: '🚁',
      keywords: ['helicopter'],
    },
    {
      emoji: '🛶',
      keywords: ['canoe', 'boat'],
    },
    {
      emoji: '⛵',
      keywords: ['sailboat', 'boat'],
    },
    {
      emoji: '🚤',
      keywords: ['speedboat', 'boat'],
    },
    {
      emoji: '🛥',
      keywords: ['motor', 'boat'],
    },
    {
      emoji: '🛳',
      keywords: ['passenger', 'ship'],
    },
    {
      emoji: '⛴',
      keywords: ['ferry'],
    },
    {
      emoji: '🚢',
      keywords: ['ship', 'boat'],
    },
    {
      emoji: '⚓',
      keywords: ['anchor', 'ship'],
    },
    {
      emoji: '🪝',
      keywords: ['hook'],
    },
    {
      emoji: '⛽',
      keywords: ['fuel', 'pump', 'gas'],
    },
    {
      emoji: '🚧',
      keywords: ['construction', 'warning'],
    },
    {
      emoji: '🚦',
      keywords: ['traffic', 'light', 'vertical'],
    },
    {
      emoji: '🚥',
      keywords: ['traffic', 'light', 'horizontal'],
    },
    {
      emoji: '🚏',
      keywords: ['bus', 'stop'],
    },
    // Places & Buildings
    {
      emoji: '🗺',
      keywords: ['world', 'map'],
    },
    {
      emoji: '🗼',
      keywords: ['tokyo', 'tower'],
    },
    {
      emoji: '🏰',
      keywords: ['castle', 'european'],
    },
    {
      emoji: '🏯',
      keywords: ['castle', 'japanese'],
    },
    {
      emoji: '🏟',
      keywords: ['stadium'],
    },
    {
      emoji: '🎡',
      keywords: ['ferris', 'wheel'],
    },
    {
      emoji: '🎢',
      keywords: ['roller', 'coaster'],
    },
    {
      emoji: '⛲',
      keywords: ['fountain'],
    },
    {
      emoji: '⛱',
      keywords: ['umbrella', 'beach'],
    },
    {
      emoji: '🏖',
      keywords: ['beach', 'umbrella'],
    },
    {
      emoji: '🏝',
      keywords: ['desert', 'island'],
    },
    {
      emoji: '🏜',
      keywords: ['desert'],
    },
    {
      emoji: '🌋',
      keywords: ['volcano'],
    },
    {
      emoji: '⛰',
      keywords: ['mountain'],
    },
    {
      emoji: '🏔',
      keywords: ['snow', 'capped', 'mountain'],
    },
    {
      emoji: '🗻',
      keywords: ['mount', 'fuji'],
    },
    {
      emoji: '🏕',
      keywords: ['camping'],
    },
    {
      emoji: '⛺',
      keywords: ['tent', 'camping'],
    },
    {
      emoji: '🛖',
      keywords: ['hut'],
    },
    {
      emoji: '🏠',
      keywords: ['house', 'home'],
    },
    {
      emoji: '🏡',
      keywords: ['house', 'garden'],
    },
    {
      emoji: '🏘',
      keywords: ['houses'],
    },
    {
      emoji: '🏚',
      keywords: ['derelict', 'house'],
    },
    {
      emoji: '🏗',
      keywords: ['building', 'construction'],
    },
    {
      emoji: '🏭',
      keywords: ['factory'],
    },
    {
      emoji: '🏢',
      keywords: ['office', 'building'],
    },
    {
      emoji: '🏬',
      keywords: ['department', 'store'],
    },
    {
      emoji: '🏣',
      keywords: ['post', 'office', 'japanese'],
    },
    {
      emoji: '🏤',
      keywords: ['post', 'office', 'european'],
    },
    {
      emoji: '🏥',
      keywords: ['hospital'],
    },
    {
      emoji: '🏦',
      keywords: ['bank'],
    },
    {
      emoji: '🏨',
      keywords: ['hotel'],
    },
    {
      emoji: '🏪',
      keywords: ['convenience', 'store'],
    },
    {
      emoji: '🏫',
      keywords: ['school'],
    },
    {
      emoji: '🏩',
      keywords: ['love', 'hotel'],
    },
    {
      emoji: '💒',
      keywords: ['wedding', 'chapel'],
    },
    {
      emoji: '🏛',
      keywords: ['classical', 'building'],
    },
    {
      emoji: '⛪',
      keywords: ['church'],
    },
    {
      emoji: '🕌',
      keywords: ['mosque'],
    },
    {
      emoji: '🕍',
      keywords: ['synagogue'],
    },
    {
      emoji: '🛕',
      keywords: ['hindu', 'temple'],
    },
    {
      emoji: '🕋',
      keywords: ['kaaba', 'mecca'],
    },
    {
      emoji: '⛩',
      keywords: ['shinto', 'shrine'],
    },
  ]

  // ---------- Utilities ----------
  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    // fallback
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function totalVotes(session) {
    return session.choices.reduce((acc, c) => acc + (c.votes || 0), 0);
  }

  function topChoice(session) {
    if (!session.choices.length) return null;
    return [...session.choices].sort((a, b) => b.votes - a.votes)[0];
  }

  function clampNonNeg(n) {
    return Math.max(0, n);
  }

  // ---------- Emoji Picker ----------
  let emojiTarget = null; // { type: 'button', el: HTMLElement, onSelect: (emoji)=>void }
  function openEmojiPicker(anchorEl, onSelect) {
    emojiTarget = { anchorEl, onSelect };
    emojiSearchInput.value = "";
    renderEmojiGrid("");
    positionEmojiPicker(anchorEl);

    emojiOverlay.classList.remove("hidden");
    emojiPicker.classList.remove("hidden");

    // focus after paint
    setTimeout(() => emojiSearchInput.focus(), 0);
  }

  function closeEmojiPicker() {
    emojiTarget = null;
    emojiOverlay.classList.add("hidden");
    emojiPicker.classList.add("hidden");
    emojiEmpty.classList.add("hidden");
  }

  function positionEmojiPicker(anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const pickerHeight = 340;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const top = (spaceBelow >= pickerHeight || spaceBelow > spaceAbove)
      ? rect.bottom + 8
      : rect.top - pickerHeight - 8;

    const left = Math.min(
      Math.max(10, rect.left),
      window.innerWidth - 330
    );

    emojiPicker.style.top = `${Math.max(10, top)}px`;
    emojiPicker.style.left = `${left}px`;
  }

  function renderEmojiGrid(query) {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? EMOJI_DATA.filter(({ emoji, keywords }) =>
        emoji.includes(q) || keywords.some(k => k.includes(q))
      )
      : EMOJI_DATA;

    if (filtered.length === 0) {
      emojiGrid.replaceChildren();
      emojiEmpty.classList.remove("hidden");
      return;
    }

    emojiEmpty.classList.add("hidden");

    const frag = document.createDocumentFragment();
    for (const item of filtered) {
      const node = tplEmojiItem.content.cloneNode(true);
      const b = node.querySelector(".emoji-item");
      b.textContent = item.emoji;
      b.title = item.emoji;
      b.dataset.emoji = item.emoji;
      frag.appendChild(node);
    }

    emojiGrid.replaceChildren(frag);
  }


  emojiOverlay.addEventListener("click", closeEmojiPicker);
  emojiSearchInput.addEventListener("input", (e) => {
    renderEmojiGrid(e.target.value);
  });
  window.addEventListener("resize", () => {
    if (emojiTarget?.anchorEl) positionEmojiPicker(emojiTarget.anchorEl);
  });
  window.addEventListener("scroll", () => {
    if (emojiTarget?.anchorEl) positionEmojiPicker(emojiTarget.anchorEl);
  }, true);

  // ---------- Modal open/close ----------
  function setCreateModal(open) {
    createModalOpen = open;
    if (open) {
      createModal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      setTimeout(() => createNameInput.focus(), 0);
    } else {
      createModal.classList.add("hidden");
      document.body.style.overflow = "";
    }
  }

  function setSettingsModal(open) {
    settingsModalOpen = open;
    if (open) {
      settingsModal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      renderSettingsModal();
    } else {
      settingsModal.classList.add("hidden");
      document.body.style.overflow = "";
      closeEmojiPicker();
    }
  }

  function setupModalClose(modalEl, closeFn) {
    modalEl.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.dataset && t.dataset.close === "true") closeFn();
    });
    modalEl.querySelectorAll("[data-close='true']").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        closeFn();
      });
    });
  }

  setupModalClose(createModal, () => setCreateModal(false));
  setupModalClose(settingsModal, () => setSettingsModal(false));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!emojiPicker.classList.contains("hidden")) closeEmojiPicker();
      else if (!settingsModal.classList.contains("hidden")) setSettingsModal(false);
      else if (!createModal.classList.contains("hidden")) setCreateModal(false);
    }
  });

  // ---------- Create Session Modal (dynamic choices) ----------
  function defaultCreateChoices() {
    return [
      { emoji: "🆕", title: "", notes: "" },
      { emoji: "🆕", title: "", notes: "" },
    ];
  }

  let createChoices = defaultCreateChoices();

  function renderCreateChoices() {
    const frag = document.createDocumentFragment();

    createChoices.forEach((c, idx) => {
      const node = tplCreateChoiceEditorRow.content.cloneNode(true);
      const row = node.querySelector(".choice-editor");
      row.dataset.idx = String(idx);

      const emojiBtn = node.querySelector(".js-create-emoji");
      emojiBtn.textContent = c.emoji || "🆕";

      const title = node.querySelector(".js-create-title");
      title.value = c.title || "";

      const notes = node.querySelector(".js-create-notes");
      notes.value = c.notes || "";

      const remove = node.querySelector(".js-create-remove");
      remove.style.visibility = (createChoices.length <= 2) ? "hidden" : "";

      frag.appendChild(node);
    });

    createChoicesEl.replaceChildren(frag);
    updateCreateSubmitDisabled();
  }


  function updateCreateSubmitDisabled() {
    const nameOk = (createNameInput.value || "").trim().length > 0;
    const validChoices = createChoices.filter(c => (c.title || "").trim().length > 0);
    createSubmitBtn.disabled = !(nameOk && validChoices.length >= 2);
  }

  createNameInput.addEventListener("input", updateCreateSubmitDisabled);

  addCreateChoiceBtn.addEventListener("click", () => {
    createChoices = [...createChoices, { emoji: "🆕", title: "", notes: "" }];
    renderCreateChoices();
  });

  createForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = (createNameInput.value || "").trim();
    const validChoices = createChoices
      .map(c => ({
        emoji: (c.emoji || "🆕").trim(),
        title: (c.title || "").trim(),
        notes: (c.notes || "").trim()
      }))
      .filter(c => c.title.length > 0);

    if (!name) return;
    if (validChoices.length < 2) return;

    const newSession = {
      id: uuid(),
      name,
      createdAt: Date.now(),
      choices: validChoices.map(c => ({
        id: uuid(),
        title: c.title,
        emoji: c.emoji || "😀",
        notes: c.notes || "",
        votes: 0
      }))
    };

    await addSession(newSession);
    sessions = [newSession, ...sessions];

    // Go to session view
    view = { type: "session", sessionId: newSession.id };
    setCreateModal(false);
    resetCreateModal();
    render();
  });

  function resetCreateModal() {
    createNameInput.value = "";
    createChoices = defaultCreateChoices();
    renderCreateChoices();
  }

  // ---------- App actions ----------
  async function load() {
    loading = true;
    render();
    sessions = await getAllSessions();
    loading = false;
    render();
  }

  function currentSession() {
    if (view.type !== "session") return null;
    return sessions.find(s => s.id === view.sessionId) || null;
  }

  async function updateVote(sessionId, choiceId, inc) {
    // optimistic
    sessions = sessions.map(s => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        choices: s.choices.map(c => {
          if (c.id !== choiceId) return c;
          const next = clampNonNeg((c.votes || 0) + inc);
          return { ...c, votes: next };
        })
      };
    });
    render();

    // persist
    const session = await getSessionFromDB(sessionId);
    if (!session) return;
    const updated = {
      ...session,
      choices: session.choices.map(c => c.id === choiceId
        ? { ...c, votes: clampNonNeg((c.votes || 0) + inc) }
        : c
      )
    };
    await putSession(updated);
  }

  async function addChoiceToSession(sessionId, choice) {
    const newChoice = { ...choice, id: uuid(), votes: 0 };
    sessions = sessions.map(s => s.id === sessionId ? { ...s, choices: [...s.choices, newChoice] } : s);
    render();

    const session = await getSessionFromDB(sessionId);
    if (!session) return;
    session.choices.push(newChoice);
    await putSession(session);
  }

  async function deleteChoiceFromSession(sessionId, choiceId) {
    sessions = sessions.map(s => s.id === sessionId
      ? { ...s, choices: s.choices.filter(c => c.id !== choiceId) }
      : s
    );
    render();

    const session = await getSessionFromDB(sessionId);
    if (!session) return;
    session.choices = session.choices.filter(c => c.id !== choiceId);
    await putSession(session);
  }

  async function deleteSessionById(sessionId) {
    sessions = sessions.filter(s => s.id !== sessionId);
    await deleteSessionFromDB(sessionId);
    render();
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function renderApp() {
    // settings button only active in session view
    sessionSettingsBtn.disabled = view.type !== "session";
    sessionSettingsBtn.onclick = () => {
      if (view.type === "session") setSettingsModal(true);
    };

    // global new session
    newSessionBtn.onclick = () => {
      resetCreateModal();
      setCreateModal(true);
    };

    dashboardNewBtn.onclick = () => {
      resetCreateModal();
      setCreateModal(true);
    };

    emptyCreateBtn.onclick = () => {
      resetCreateModal();
      setCreateModal(true);
    };

    // Loading
    if (loading) {
      loadingView.classList.remove("hidden");
      dashboardView.classList.add("hidden");
      sessionView.classList.add("hidden");
      appSubtitleEl.textContent = "Loading sessions…";
      return;
    }

    loadingView.classList.add("hidden");

    // Keep session view consistent if session was deleted
    if (view.type === "session" && !currentSession()) {
      view = { type: "dashboard" };
    }

    if (view.type === "dashboard") {
      dashboardView.classList.remove("hidden");
      sessionView.classList.add("hidden");
      appSubtitleEl.textContent = "Local-only voting sessions";
      renderDashboard();
      // topbar settings should be disabled already
      return;
    }

    // session
    dashboardView.classList.add("hidden");
    sessionView.classList.remove("hidden");
    renderSession();
  }

  function renderDashboard() {
    if (sessions.length === 0) {
      dashboardEmptyEl.classList.remove("hidden");
      sessionsListEl.replaceChildren();
      return;
    }
    dashboardEmptyEl.classList.add("hidden");

    const frag = document.createDocumentFragment();

    for (const s of sessions) {
      const node = tplSessionCard.content.cloneNode(true);
      const btn = node.querySelector(".session-card");
      btn.dataset.sessionId = s.id;

      node.querySelector(".title").textContent = s.name;

      const tv = totalVotes(s);
      const top = topChoice(s);

      node.querySelector(".votes").textContent = `📊 ${tv} votes`;
      node.querySelector(".choices").textContent = `${s.choices.length} choices`;

      const leadDot = node.querySelector(".lead-dot");
      const lead = node.querySelector(".lead");

      if (tv > 0 && top) {
        leadDot.hidden = false;
        lead.hidden = false;
        lead.textContent = `Leading: ${top.emoji} ${top.title}`;
      } else {
        leadDot.hidden = true;
        lead.hidden = true;
      }

      frag.appendChild(node);
    }

    sessionsListEl.replaceChildren(frag);
  }


  function renderSession() {
    const s = currentSession();
    if (!s) return;

    const tv = totalVotes(s);
    sessionNameEl.textContent = s.name;
    sessionMetaEl.textContent = `${tv} total votes`;
    appSubtitleEl.textContent = s.name;

    sessionBackBtn.onclick = () => {
      view = { type: "dashboard" };
      render();
    };

    openSettingsBtn.onclick = () => setSettingsModal(true);

    // ---- Sort + compute max ----
    const maxVotes = Math.max(1, ...s.choices.map(c => c.votes || 0));
    const sorted = [...s.choices].sort((a, b) => (b.votes || 0) - (a.votes || 0));

    // ---- FLIP: capture old positions BEFORE we reorder ----
    const first = captureRects(choicesListEl, ".choice-row");

    // ---- Build / update / reorder keyed nodes ----
    for (const choice of sorted) {
      const el = ensureChoiceEl(choice);             // creates once, reuses forever
      updateChoiceEl(el, choice, { maxVotes });      // updates text, votes, bar, leader badge
      choicesListEl.appendChild(el);                 // reorders existing nodes by DOM append
    }

    // ---- Exit: remove any nodes that no longer exist in data ----
    const liveIds = new Set(sorted.map(c => c.id));
    for (const [id, el] of choiceEls.entries()) {
      if (!liveIds.has(id)) {
        choiceEls.delete(id);
        animateOut(el).then(() => el.remove());
      }
    }

    // ---- Layout animation: play FLIP AFTER DOM reorder ----
    playFLIP(choicesListEl, ".choice-row", first);

    // ---- Enter: animate only nodes that were newly inserted this render ----
    for (const choice of sorted) {
      if (!first.has(choice.id)) {
        const el = choiceEls.get(choice.id);
        if (el) animateIn(el);
      }
    }
  }


  function renderSettingsModal() {
    const s = currentSession();
    if (!s) return;

    const frag = document.createDocumentFragment();

    for (const c of s.choices) {
      const node = tplSettingsChoiceRow.content.cloneNode(true);
      const row = node.querySelector(".settings-choice-row");
      row.dataset.choiceId = c.id;

      node.querySelector(".settings-choice-emoji").textContent = c.emoji || "😀";
      node.querySelector(".settings-choice-title").textContent = c.title;

      const notes = node.querySelector(".settings-choice-notes");
      if (c.notes) {
        notes.style.display = "";
        notes.textContent = c.notes;
      } else {
        notes.style.display = "none";
        notes.textContent = "";
      }

      frag.appendChild(node);
    }

    settingsChoicesList.replaceChildren(frag);

    // add choice toggle
    toggleAddChoiceBtn.onclick = () => {
      addChoiceForm.classList.toggle("hidden");
      if (!addChoiceForm.classList.contains("hidden")) addChoiceTitle.focus();
    };

    cancelAddChoiceBtn.onclick = () => {
      addChoiceForm.classList.add("hidden");
      addChoiceTitle.value = "";
      addChoiceNotes.value = "";
      addChoiceEmojiBtn.textContent = "🆕";
    };

    addChoiceEmojiBtn.onclick = () => {
      openEmojiPicker(addChoiceEmojiBtn, (emoji) => {
        addChoiceEmojiBtn.textContent = emoji;
      });
    };

    addChoiceForm.onsubmit = async (e) => {
      e.preventDefault();

      const title = (addChoiceTitle.value || "").trim();
      if (!title) return;

      const emoji = (addChoiceEmojiBtn.textContent || "🆕").trim();
      const notesVal = (addChoiceNotes.value || "").trim();

      await addChoiceToSession(s.id, { title, emoji: emoji || "🆕", notes: notesVal });

      addChoiceTitle.value = "";
      addChoiceNotes.value = "";
      addChoiceEmojiBtn.textContent = "🆕";
      addChoiceForm.classList.add("hidden");

      renderSettingsModal();
      render(); // refresh main session view
    };

    deleteSessionBtn.onclick = async () => {
      if (!confirm("Delete this session permanently?")) return;
      const sessionId = s.id;
      setSettingsModal(false);
      await deleteSessionById(sessionId);
      view = { type: "dashboard" };
      render();
    };
  }


  function render() {
    renderApp();
    refreshIcons();
  }

  // ---------- Wire up primary UI ----------
  function wire() {
    // ---------- Top bar buttons ----------
    sessionSettingsBtn.addEventListener("click", () => {
      if (view.type === "session") setSettingsModal(true);
    });

    newSessionBtn.addEventListener("click", () => {
      resetCreateModal();
      setCreateModal(true);
    });

    dashboardNewBtn.addEventListener("click", () => {
      resetCreateModal();
      setCreateModal(true);
    });

    emptyCreateBtn.addEventListener("click", () => {
      resetCreateModal();
      setCreateModal(true);
    });

    // ---------- Dashboard: open session (delegated) ----------
    sessionsListEl.addEventListener("click", (e) => {
      const card = e.target.closest(".session-card");
      if (!card) return;
      view = { type: "session", sessionId: card.dataset.sessionId };
      render();
    });

    // ---------- Session: vote + / - (delegated) ----------
    // choicesListEl.addEventListener("click", (e) => {
    //   const plus = e.target.closest(".vote-plus");
    //   const minus = e.target.closest(".vote-minus");
    //   if (!plus && !minus) return;

    //   const row = e.target.closest(".choice-row");
    //   if (!row) return;

    //   const s = currentSession();
    //   if (!s) return;

    //   const choiceId = row.dataset.choiceId;
    //   updateVote(s.id, choiceId, plus ? 1 : -1);
    // });

    // ---------- Create modal: choices editor (delegated) ----------
    createChoicesEl.addEventListener("click", (e) => {
      const row = e.target.closest(".choice-editor");
      if (!row) return;

      const idx = Number(row.dataset.idx);
      if (!Number.isFinite(idx)) return;

      // Remove choice
      if (e.target.closest(".js-create-remove")) {
        if (createChoices.length <= 2) return;
        createChoices = createChoices.filter((_, i) => i !== idx);
        renderCreateChoices();
        return;
      }

      // Emoji picker
      const emojiBtn = e.target.closest(".js-create-emoji");
      if (emojiBtn) {
        openEmojiPicker(emojiBtn, (emoji) => {
          createChoices[idx].emoji = emoji;
          renderCreateChoices();
        });
      }
    });

    createChoicesEl.addEventListener("input", (e) => {
      const row = e.target.closest(".choice-editor");
      if (!row) return;

      const idx = Number(row.dataset.idx);
      if (!Number.isFinite(idx)) return;

      if (e.target.classList.contains("js-create-title")) {
        createChoices[idx].title = e.target.value;
        updateCreateSubmitDisabled();
      } else if (e.target.classList.contains("js-create-notes")) {
        createChoices[idx].notes = e.target.value;
      }
    });

    // ---------- Settings modal: delete choice (delegated) ----------
    settingsChoicesList.addEventListener("click", async (e) => {
      const delBtn = e.target.closest(".js-settings-delete");
      if (!delBtn) return;

      const row = e.target.closest(".settings-choice-row");
      if (!row) return;

      const s = currentSession();
      if (!s) return;

      const choiceId = row.dataset.choiceId;
      await deleteChoiceFromSession(s.id, choiceId);
      renderSettingsModal();
      render();
    });

    // ---------- Emoji picker: pick emoji (delegated) ----------
    emojiGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".emoji-item");
      if (!btn || !emojiTarget) return;
      emojiTarget.onSelect(btn.dataset.emoji);
      closeEmojiPicker();
    });

    // clicking outside modals closes via data-close wiring

    // initial create modal render
    renderCreateChoices();

    // If user lands on #/app and has no sessions, show dashboard empty state
    // (render handles this)
  }



  const EASE_SPRINGISH = "cubic-bezier(0.2, 0.8, 0.2, 1)";

  function animateIn(el) {
    return el.animate(
      [
        { opacity: 0, transform: "translateY(20px)" },
        { opacity: 1, transform: "translateY(0px)" }
      ],
      { duration: 260, easing: EASE_SPRINGISH, fill: "both" }
    ).finished;
  }

  function animateOut(el) {
    return el.animate(
      [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0, transform: "scale(0.95)" }
      ],
      { duration: 180, easing: "ease-out", fill: "both" }
    ).finished;
  }

  /**
   * 
   * @param {HTMLElement} barEl 
   * @param {number} pct 
   */
  function animateProgressWidth(barEl, pct) {
    const next = pct / 100;
    const prev = parseFloat(barEl.dataset.scale || "0");

    barEl.dataset.scale = String(next);

    barEl.style.transformOrigin = "left center";

    // Kill any prior transform animations that are still affecting the element
    for (const a of barEl.getAnimations()) a.cancel();

    const anim = barEl.animate(
      [{ transform: `scaleX(${prev})` }, { transform: `scaleX(${next})` }],
      { duration: 420, easing: EASE_SPRINGISH, fill: "both" }
    );

    // Make the end state “real” and remove the animation layer
    anim.onfinish = () => {
      anim.commitStyles();
      anim.cancel();
    };
  }


  function captureRects(container, selector) {
    const map = new Map();
    container.querySelectorAll(selector).forEach((el) => {
      map.set(el.dataset.key, el.getBoundingClientRect());
    });
    return map;
  }

  function playFLIP(container, selector, firstRects) {
    container.querySelectorAll(selector).forEach((el) => {
      const key = el.dataset.key;
      const first = firstRects.get(key);
      if (!first) return;

      const last = el.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;

      if (dx === 0 && dy === 0) return;

      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: "translate(0px, 0px)" }
        ],
        { duration: 260, easing: EASE_SPRINGISH }
      );
    });
  }

  const choiceEls = new Map(); // choiceId -> element

  function ensureChoiceEl(choice) {
    let el = choiceEls.get(choice.id);
    if (el) return el;

    // Build once (structure similar to your current DOM)
    el = document.createElement("div");
    el.className = "choice-row";
    el.dataset.key = choice.id;

    el.innerHTML = `
    <div class="choice-bar"></div>
    <div class="choice-inner">
      <div class="choice-emoji"></div>
      <div class="choice-content">
        <div class="choice-title">
          <h3></h3>
          <span class="leader-badge" style="display:none;">LEADER</span>
        </div>
        <div class="choice-notes" style="display:none;"></div>
      </div>
      <div class="vote-controls">
        <button class="vote-btn vote-minus" type="button">−</button>
        <div class="vote-count tabular-nums"></div>
        <button class="vote-btn vote-plus" type="button">+</button>
      </div>
    </div>
  `;

    // Wire handlers once
    el.querySelector(".vote-minus").addEventListener("click", () => {
      const id = el.dataset.key;
      window.__onVote?.(id, -1);
    });
    el.querySelector(".vote-plus").addEventListener("click", () => {
      const id = el.dataset.key;
      window.__onVote?.(id, 1);
    });

    choiceEls.set(choice.id, el);
    return el;
  }

  function updateChoiceEl(el, choice, { maxVotes }) {
    const votes = choice.votes || 0;
    const pct = (votes / maxVotes) * 100;
    const isLeader = votes === maxVotes && votes > 0;

    el.querySelector(".choice-emoji").textContent = choice.emoji || "😀";
    el.querySelector("h3").textContent = choice.title;

    const badge = el.querySelector(".leader-badge");
    badge.style.display = isLeader ? "" : "none";

    const notesEl = el.querySelector(".choice-notes");
    if (choice.notes) {
      notesEl.style.display = "";
      notesEl.textContent = choice.notes;
    } else {
      notesEl.style.display = "none";
    }

    const minus = el.querySelector(".vote-minus");
    minus.disabled = votes === 0;

    el.querySelector(".vote-count").textContent = String(votes);

    const bar = el.querySelector(".choice-bar");
    bar.className = `choice-bar ${isLeader ? "leader" : ""}`;
    animateProgressWidth(bar, pct);
  }

  window.__onVote = (choiceId, inc) => {
    const s = currentSession();
    if (!s) return;
    updateVote(s.id, choiceId, inc);
  };


  // ---------- Start ----------
  wire();
  render();
  load();
})();