import { executeSql } from '../services/database';

// Define the structure of the translation strings
export interface Translation {
  // WelcomeScreen
  welcome: string;
  selectLanguage: string;
  english: string;
  pidgin: string;
  continue: string;

  // LoginScreen
  welcomeOga: string;
  welcomeBack: string;
  loginSubtitle: string;
  phoneNumber: string;
  shopName: string;
  newShopQuestion: string;
  getCode: string;
  termsAgreement: string;
  terms: string;
  privacyPolicy: string;
  requiredTitle: string;
  phoneNumberRequired: string;
  errorTitle: string;
  hausa: string;
  yoruba: string;
  igbo: string;

  // OTP Screen
  verifyCodeTitle: string;
  otpSubtitle: string;
  otpEnter6DigitError: string;
  otpVerificationFailedError: string;
  otpVerifiedTitle: string;
  otpVerifiedSubtitle: string;
  otpResendFailedError: string;
  verifying: string;
  verify: string;
  clear: string;
  resendIn: string;
  resendCode: string;
  otpHelperText: string;

  // HomeScreen
  goodMorning: string;
  overview: string;
  viewReports: string;
  quickActions: string;
  recentSales: string;
  todaysSales: string;
  lowStock: string;
  totalItems: string;
  items: string;
  newSale: string;
  recordTransaction: string;
  inventory: string;
  manageStock: string;
  aiInsights: string;
  smartPredictions: string;
  allSales: string;
  viewSalesHistory: string;
  aiCreditScore: string;
  loanReadyInsights: string;
  taxInsights: string;
  quickTaxReports: string;
  sale: string;
  plusItems: string;
  report: string;
  businessAnalytics: string;

  // Inventory Screen
  searchPlaceholder: string;
  noProductsFound: string;
  allItems: string;
  beverages: string;
  pantry: string;
  snacks: string;
  quantity: string;
  addItem: string;
  productDetails: string;
  noSalesFound: string;
  inStock: string;
  sold: string;

  // All Sales Screen
  dailySales: string;
  businessAssistant: string;
  assistantMessage: string;
  taxRisk: string;
  medium: string;
  estimatedTaxableRevenue: string;
  vatCollected: string;
  potentialLoss: string;
  totalRevenueToday: string;
  searchReceiptPlaceholder: string;
  today: string;
  paymentMethod: string;
  status: string;
  yesterday: string;
  paid: string;
  pending: string;
  cash: string;
  pos: string;
  transfer: string;
  sell: string;

  // Settings Screen
  logOut: string;
  logOutConfirmation: string;
  cancel: string;
  couldNotLogOut: string;
  settings: string;
  standardPlan: string;
  editProfile: string;
  general: string;
  shopProfile: string;
  shopProfileSubtitle: string;
  manageStaff: string;
  manageStaffSubtitle: string;
  appPreferences: string;
  appTheme: string;
  appThemeSubtitle: string;
  dark: string;
  light: string;
  language: string;
  languageSubtitle: string;
  notifications: string;
  notificationsSubtitle: string;
  dataManagement: string;
  exportSalesData: string;
  exportSalesDataSubtitle: string;
  appVersion: string;

  // sellscan Screen
  scannedItems: string;
  cart: string;
  category: string;
  price: string;
  stockStatus: string;
  salesAnalysis: string;
  sellingPrice: string;
  costPrice: string;
  currentStock: string;
  totalSold: string;
  revenue: string;
  salesHistory: string;
  editProduct: string;
  saveChanges: string;
  suggest: string;
  units: string;
  week: string;
  month: string;
  all: string;
  productNotFound: string;
  goBack: string;

  // Categories
  softDrinks?: string;
  bottledWater?: string;
  alcoholicDrinks?: string;
  energyDrinks?: string;
  juices?: string;
  milkAndDairy?: string;
  yogurt?: string;
  teaAndCoffee?: string;
  biscuits?: string;
  chocolates?: string;
  candy?: string;
  noodlesAndPasta?: string;
  riceAndGrains?: string;
  flour?: string;
  sugar?: string;
  cookingOil?: string;
  cannedFoods?: string;
  breakfastCereals?: string;
  spicesAndSeasoning?: string;
  frozenFoods?: string;
  breadAndBakery?: string;
  eggs?: string;
  fruits?: string;
  vegetables?: string;
  meat?: string;
  fish?: string;
  condiments?: string;
  sauces?: string;
  instantFoods?: string;
  babyFood?: string;
  babyCare?: string;
  cleaningSupplies?: string;
  laundryDetergent?: string;
  dishwashingLiquid?: string;
  disinfectants?: string;
  airFresheners?: string;
  toiletries?: string;
  soap?: string;
  shampoo?: string;
  toothpaste?: string;
  toiletPaper?: string;
  sanitaryProducts?: string;
  maleGrooming?: string;
  skincare?: string;
  hairCare?: string;
  cosmetics?: string;
  stationery?: string;
  batteries?: string;
  electronicsAccessories?: string;
  phoneAccessories?: string;
  lightBulbs?: string;
  cookingGasAccessories?: string;
  kitchenware?: string;
  plastics?: string;
  utensils?: string;
  potsAndPans?: string;
  homeStorage?: string;
  petFood?: string;
  petCare?: string;
  medicinesOTC?: string;
  vitaminsAndSupplements?: string;
  firstAid?: string;
  herbalProducts?: string;
  insecticides?: string;
  pestControl?: string;
  carAccessories?: string;
  automotiveFluids?: string;
  buildingMaterialsSmall?: string;
  toolsAndHardware?: string;
  gardenSupplies?: string;
  seedsAndFertilizer?: string;
  smallAppliances?: string;
  clothingEssentials?: string;
  footwear?: string;
  underwear?: string;
  socks?: string;
  bags?: string;
  schoolSupplies?: string;
  toys?: string;
  games?: string;
  giftItems?: string;
  religiousItems?: string;
  candlesAndMatches?: string;
  partySupplies?: string;
  decorations?: string;
  seasonalItems?: string;
  iceCream?: string;
  chilledDrinks?: string;
  powderedMilk?: string;
  grainsAndLegumes?: string;
  snailLocalProteins?: string;
  beautyFragrances?: string;
  sportsDrinks?: string;
  healthDrinks?: string;
  cigarettes?: string;
  matchesAndLighters?: string;
  rechargeCards?: string;
  posFintechItems?: string;
  others?: string;
}

// Define the available languages and their translations
const translations: { [key: string]: Translation } = {
  en: {
    welcome: 'Welcome to Supamart',
    selectLanguage: 'Please select your language',
    english: 'English',
    pidgin: 'Nigerian Pidgin',
    continue: 'Continue',
    // LoginScreen
    welcomeOga: 'Welcome, Oga! 👋',
    welcomeBack: 'Welcome back,',
    loginSubtitle: "Let's get your shop running. Enter your details to start tracking sales.",
    phoneNumber: 'Phone Number',
    shopName: 'Shop Name',
    newShopQuestion: 'New Shop?',
    getCode: 'Get Code',
    termsAgreement: 'By tapping "Get Code", you agree to our ',
    terms: 'Terms',
    privacyPolicy: 'Privacy Policy',
    requiredTitle: 'Required',
    phoneNumberRequired: 'Please enter your phone number.',
    errorTitle: 'Error',
    hausa: 'Hausa',
    yoruba: 'Yoruba',
    igbo: 'Igbo',
    // OTP Screen
    verifyCodeTitle: 'Verify Code',
    otpSubtitle: 'Enter the 6-digit code sent to ',
    otpEnter6DigitError: 'Enter the 6-digit code sent to your phone.',
    otpVerificationFailedError: 'Verification failed. Try again.',
    otpVerifiedTitle: 'Verified',
    otpVerifiedSubtitle: 'OTP verified — continue.',
    otpResendFailedError: 'Could not resend. Try again later.',
    verifying: 'Verifying...',
    verify: 'Verify',
    clear: 'Clear',
    resendIn: 'Resend in {cooldown}s',
    resendCode: 'Resend code',
    otpHelperText:
      'Didn\'t receive the code? Check your messages or tap "Resend code". For security, codes expire quickly.',
    // HomeScreen
    goodMorning: 'Good Morning,',
    overview: 'Overview',
    viewReports: 'View Reports',
    quickActions: 'Quick Actions',
    recentSales: 'Recent Sales',
    todaysSales: "Today's Sales",
    lowStock: 'Low Stock',
    totalItems: 'Total Items',
    items: 'Items',
    newSale: 'New Sale',
    recordTransaction: 'Record transaction',
    inventory: 'Inventory',
    manageStock: 'Manage stock',
    aiInsights: 'AI Insights',
    smartPredictions: 'Smart predictions',
    allSales: 'All Sales',
    viewSalesHistory: 'View sales history',
    aiCreditScore: 'AI Credit Score',
    loanReadyInsights: 'Loan ready insights',
    taxInsights: 'Tax Insights',
    quickTaxReports: 'Quick tax reports',
    sale: 'Sale',
    plusItems: ' + {count} items',
    report: 'Report',
    businessAnalytics: 'Business Analytics',

    // Inventory Screen
    searchPlaceholder: 'Search products (e.g., Indomie)...',
    noProductsFound: 'No products found',
    allItems: 'All Items',
    beverages: 'Beverages',
    pantry: 'Pantry',
    snacks: 'Snacks',
    quantity: 'Qty',
    addItem: 'Add Item',
    productDetails: 'Product details',
    noSalesFound: 'No sales found',
    inStock: 'In Stock',
    sold: 'Sold',

    // All Sales Screen
    dailySales: 'Daily Sales',
    businessAssistant: 'Business Assistant',
    assistantMessage:
      "Sales are up 12% today. You're approaching the VAT threshold—current monthly revenue suggests a liability of ₦45k soon.",
    taxRisk: 'Tax Risk',
    medium: 'Medium',
    estimatedTaxableRevenue: 'Est. Taxable Rev',
    vatCollected: 'VAT Collected',
    potentialLoss: 'Potential Loss',
    totalRevenueToday: 'Total Revenue (Today)',
    searchReceiptPlaceholder: 'Search receipt or item...',
    today: 'Today',
    paymentMethod: 'Payment Method',
    status: 'Status',
    yesterday: 'Yesterday',
    paid: 'Paid',
    pending: 'Pending',
    cash: 'Cash',
    pos: 'POS',
    transfer: 'Transfer',
    sell: 'Sell',

    // Settings Screen
    logOut: 'Log Out',
    logOutConfirmation: 'Are you sure you want to log out?',
    cancel: 'Cancel',
    couldNotLogOut: 'Could not log out',
    settings: 'Settings',
    standardPlan: 'Standard Plan',
    editProfile: 'Edit Profile',
    general: 'General',
    shopProfile: 'Shop Profile',
    shopProfileSubtitle: 'Address, contact, & details',
    manageStaff: 'Manage Staff',
    manageStaffSubtitle: 'Add or remove shop assistants',
    appPreferences: 'App Preferences',
    appTheme: 'App Theme',
    appThemeSubtitle: 'Light / Dark mode',
    language: 'Language',
    languageSubtitle: 'Change app language',
    dark: 'Dark',
    light: 'Light',
    notifications: 'Notifications',
    notificationsSubtitle: 'Sales alerts & updates',
    dataManagement: 'Data Management',
    exportSalesData: 'Export Sales Data',
    exportSalesDataSubtitle: 'Download Excel / PDF report',
    appVersion: 'App Version {version} (Build {build})',
    // Sellscan Screen
    scannedItems: 'Scanned Items',
    cart: 'Cart',
    category: 'Category',
    price: 'Price',
    stockStatus: 'Stock Status',
    salesAnalysis: 'Sales Analysis',
    sellingPrice: 'Selling Price',
    costPrice: 'Cost Price',
    currentStock: 'Current Stock',
    totalSold: 'Total Sold',
    revenue: 'Revenue',
    salesHistory: 'Sales History',
    editProduct: 'Edit Product',
    saveChanges: 'Save Changes',
    suggest: 'Suggest',
    units: 'Units',
    week: 'Week',
    month: 'Month',
    all: 'All',
    productNotFound: 'Product Not Found',
    goBack: 'Go Back',

    // Categories
    softDrinks: 'Soft Drinks',
    bottledWater: 'Bottled Water',
    alcoholicDrinks: 'Alcoholic Drinks',
    energyDrinks: 'Energy Drinks',
    juices: 'Juices',
    milkAndDairy: 'Milk & Dairy',
    yogurt: 'Yogurt',
    teaAndCoffee: 'Tea & Coffee',
    biscuits: 'Biscuits',
    chocolates: 'Chocolates',
    candy: 'Candy',
    noodlesAndPasta: 'Noodles & Pasta',
    riceAndGrains: 'Rice & Grains',
    flour: 'Flour',
    sugar: 'Sugar',
    cookingOil: 'Cooking Oil',
    cannedFoods: 'Canned Foods',
    breakfastCereals: 'Breakfast Cereals',
    spicesAndSeasoning: 'Spices & Seasoning',
    frozenFoods: 'Frozen Foods',
    breadAndBakery: 'Bread & Bakery',
    eggs: 'Eggs',
    fruits: 'Fruits',
    vegetables: 'Vegetables',
    meat: 'Meat',
    fish: 'Fish',
    condiments: 'Condiments',
    sauces: 'Sauces',
    instantFoods: 'Instant Foods',
    babyFood: 'Baby Food',
    babyCare: 'Baby Care',
    cleaningSupplies: 'Cleaning Supplies',
    laundryDetergent: 'Laundry Detergent',
    dishwashingLiquid: 'Dishwashing Liquid',
    disinfectants: 'Disinfectants',
    airFresheners: 'Air Fresheners',
    toiletries: 'Toiletries',
    soap: 'Soap',
    shampoo: 'Shampoo',
    toothpaste: 'Toothpaste',
    toiletPaper: 'Toilet Paper',
    sanitaryProducts: 'Sanitary Products',
    maleGrooming: 'Male Grooming',
    skincare: 'Skincare',
    hairCare: 'Hair Care',
    cosmetics: 'Cosmetics',
    stationery: 'Stationery',
    batteries: 'Batteries',
    electronicsAccessories: 'Electronics Accessories',
    phoneAccessories: 'Phone Accessories',
    lightBulbs: 'Light Bulbs',
    cookingGasAccessories: 'Cooking Gas Accessories',
    kitchenware: 'Kitchenware',
    plastics: 'Plastics',
    utensils: 'Utensils',
    potsAndPans: 'Pots & Pans',
    homeStorage: 'Home Storage',
    petFood: 'Pet Food',
    petCare: 'Pet Care',
    medicinesOTC: 'Medicines (OTC)',
    vitaminsAndSupplements: 'Vitamins & Supplements',
    firstAid: 'First Aid',
    herbalProducts: 'Herbal Products',
    insecticides: 'Insecticides',
    pestControl: 'Pest Control',
    carAccessories: 'Car Accessories',
    automotiveFluids: 'Automotive Fluids',
    buildingMaterialsSmall: 'Building Materials (Small)',
    toolsAndHardware: 'Tools & Hardware',
    gardenSupplies: 'Garden Supplies',
    seedsAndFertilizer: 'Seeds & Fertilizer',
    smallAppliances: 'Small Appliances',
    clothingEssentials: 'Clothing Essentials',
    footwear: 'Footwear',
    underwear: 'Underwear',
    socks: 'Socks',
    bags: 'Bags',
    schoolSupplies: 'School Supplies',
    toys: 'Toys',
    games: 'Games',
    giftItems: 'Gift Items',
    religiousItems: 'Religious Items',
    candlesAndMatches: 'Candles & Matches',
    partySupplies: 'Party Supplies',
    decorations: 'Decorations',
    seasonalItems: 'Seasonal Items',
    iceCream: 'Ice Cream',
    chilledDrinks: 'Chilled Drinks',
    powderedMilk: 'Powdered Milk',
    grainsAndLegumes: 'Grains & Legumes',
    snailLocalProteins: 'Snail / Local Proteins',
    beautyFragrances: 'Beauty Fragrances',
    sportsDrinks: 'Sports Drinks',
    healthDrinks: 'Health Drinks',
    cigarettes: 'Cigarettes',
    matchesAndLighters: 'Matches & Lighters',
    rechargeCards: 'Recharge Cards',
    posFintechItems: 'POS/Fintech Items',
    others: 'Others',
  },
  pcm: {
    welcome: 'Welcome to Supamart',
    selectLanguage: 'Abeg, choose your language',
    english: 'English',
    pidgin: 'Nigerian Pidgin',
    continue: 'Continue',
    // LoginScreen
    welcomeOga: 'Welcome, Oga! 👋',
    welcomeBack: 'You don return,',
    loginSubtitle:
      'Make we set up your shop. Put your details make you fit begin track your sales.',
    phoneNumber: 'Your Phone Number',
    shopName: 'Name of your Shop',
    newShopQuestion: 'Na New Shop?',
    getCode: 'Get Code',
    termsAgreement: 'If you tap "Get Code", e mean say you gree to our ',
    terms: 'Rules',
    privacyPolicy: 'Privacy Policy',
    requiredTitle: 'E dey important',
    phoneNumberRequired: 'Abeg, enter your phone number.',
    errorTitle: 'Wahala',
    hausa: 'Hausa',
    yoruba: 'Yoruba',
    igbo: 'Igbo',
    // OTP Screen
    verifyCodeTitle: 'Confirm Code',
    otpSubtitle: 'Enter the 6-digit code wey we send go ',
    otpEnter6DigitError: 'Enter the 6-digit code wey dem send to your phone.',
    otpVerificationFailedError: 'E no gree verify. Abeg try again.',
    otpVerifiedTitle: 'E don work',
    otpVerifiedSubtitle: 'Code don correct — you fit continue.',
    otpResendFailedError: 'We no fit resend am. Try again later.',
    verifying: 'Dey verify...',
    verify: 'Verify',
    clear: 'Clear',
    resendIn: 'Resend in {cooldown}s',
    resendCode: 'Resend code',
    otpHelperText:
      'You no receive the code? Check your message or tap "Resend code". For your own good, the code go expire sharp sharp.',
    // HomeScreen
    goodMorning: 'U don wake,',
    overview: 'How far',
    viewReports: 'See Reports',
    quickActions: 'Sharp Sharp',
    recentSales: 'Recent Sales',
    todaysSales: 'Sales for Today',
    lowStock: 'Stock don dey finish',
    totalItems: 'All your Items',
    items: 'Items',
    newSale: 'New Sale',
    recordTransaction: 'Write transaction',
    inventory: 'Inventory',
    manageStock: 'Manage your stock',
    aiInsights: 'AI Tok',
    smartPredictions: 'Smart predictions',
    allSales: 'All Sales',
    viewSalesHistory: 'See all your sales',
    aiCreditScore: 'AI Credit Score',
    loanReadyInsights: 'Loan tins',
    taxInsights: 'Tax Tok',
    quickTaxReports: 'Sharp sharp tax report',
    sale: 'Sale',
    plusItems: ' + {count} items',
    // Inventory Screen
    searchPlaceholder: 'Find products (e.g., Indomie)...',
    noProductsFound: 'We no see any product',
    allItems: 'All Items',
    beverages: 'Drinks',
    pantry: 'For House',
    snacks: 'Chop-chop',
    quantity: 'Qty',
    // All Sales Screen
    dailySales: 'Sales for Today',
    businessAssistant: 'Business Assistant',
    assistantMessage:
      'Sales don increase by 12% today. You dey near VAT threshold—your monthly revenue show say you fit pay liability of ₦45k soon.',
    taxRisk: 'Tax Risk',
    medium: 'Medium',
    estimatedTaxableRevenue: 'Est. Taxable Rev',
    vatCollected: 'VAT wey you collect',
    potentialLoss: 'Fit Loss',
    totalRevenueToday: 'Total Revenue (Today)',
    searchReceiptPlaceholder: 'Find receipt or item...',
    today: 'Today',
    paymentMethod: 'How dem pay',
    status: 'Status',
    yesterday: 'Yesterday',
    paid: 'Paid',
    pending: 'Pending',
    cash: 'Cash',
    pos: 'POS',
    transfer: 'Transfer',
    // Settings Screen
    logOut: 'Log Out',
    logOutConfirmation: 'You sure say you wan log out?',
    cancel: 'Cancel',
    couldNotLogOut: 'E no gree log out',
    settings: 'Settings',
    standardPlan: 'Standard Plan',
    editProfile: 'Edit Profile',
    general: 'General',
    shopProfile: 'Your Shop Profile',
    shopProfileSubtitle: 'Address, contact, & details',
    manageStaff: 'Manage your workers',
    manageStaffSubtitle: 'Add or comot shop assistants',
    appPreferences: 'App Preferences',
    appTheme: 'App Theme',
    appThemeSubtitle: 'Light / Dark mode',
    language: 'Language',
    languageSubtitle: 'Change app language',
    dark: 'Dark',
    light: 'Light',
    notifications: 'Notifications',
    notificationsSubtitle: 'Sales alerts & updates',
    dataManagement: 'Data Management',
    exportSalesData: 'Export Sales Data',
    exportSalesDataSubtitle: 'Download Excel / PDF report',
    appVersion: 'App Version {version} (Build {build})',
    productDetails: 'Product Details',
    category: 'Category',
    price: 'Price',
    stockStatus: 'Stock Status',
    salesAnalysis: 'Sales Analysis',
    sellingPrice: 'Selling Price',
    costPrice: 'Cost Price',
    currentStock: 'Current Stock',
    totalSold: 'Total Sold',
    revenue: 'Revenue',
    salesHistory: 'Sales History',
    editProduct: 'Edit Product',
    saveChanges: 'Save Changes',
    suggest: 'Suggest',
    units: 'Units',
    week: 'Week',
    month: 'Month',
    all: 'All',
    productNotFound: 'Product Not Found',
    goBack: 'Go Back',
  },
  hausa: {
    welcome: 'Barka da zuwa Supamart',
    selectLanguage: 'Da fatan za a zaɓi yarenku',
    english: 'English',
    pidgin: 'Nigerian Pidgin',
    continue: 'Ci gaba',
    // LoginScreen
    welcomeOga: 'Barka da zuwa, Oga! 👋',
    welcomeBack: 'Barka da dawowa,',
    loginSubtitle:
      'Bari mu saita shagon ku. Shigar da bayananku don fara bin diddigin tallace-tallace.',
    phoneNumber: 'Lambar Waya',
    shopName: 'Sunan Shago',
    newShopQuestion: 'Sabon Shago?',
    getCode: 'Samo Lambar',
    termsAgreement: 'Ta danna "Samo Lambar", kun yarda da ',
    terms: 'Sharuddanmu',
    privacyPolicy: 'Tsarin Sirri',
    requiredTitle: 'Ana buƙata',
    phoneNumberRequired: 'Da fatan za a shigar da lambar wayarku.',
    errorTitle: 'Kuskure',
    hausa: 'Hausa',
    yoruba: 'Yoruba',
    igbo: 'Igbo',
    // OTP Screen
    verifyCodeTitle: 'Tabbatar da Lambar',
    otpSubtitle: 'Shigar da lambobi 6 da aka aiko zuwa ',
    otpEnter6DigitError: 'Shigar da lambobi 6 da aka aiko zuwa wayarka.',
    otpVerificationFailedError: 'Tabbatarwa ta gaza. Sake gwadawa.',
    otpVerifiedTitle: 'An tabbatar',
    otpVerifiedSubtitle: 'OTP an tabbatar — ci gaba.',
    otpResendFailedError: 'Ba a iya sake aikawa ba. Sake gwadawa daga baya.',
    verifying: 'Ana tabbatarwa...',
    verify: 'Tabbatar',
    clear: 'Soke',
    resendIn: 'Sake aikawa a cikin {cooldown}s',
    resendCode: 'Sake aiko lambar',
    otpHelperText:
      'Ba ku karɓi lambar ba? Bincika saƙonninku ko danna "Sake aiko lambar". Don tsaro, lambobi suna karewa da sauri.',
    // HomeScreen
    goodMorning: 'Barka da Safiya,',
    overview: 'Dubawa',
    viewReports: 'Duba Rahotanni',
    quickActions: 'Ayyuka Masu Saurin',
    recentSales: 'Tallace-tallace na baya-bayan nan',
    todaysSales: 'Tallace-tallace na Yau',
    lowStock: 'Kusan ƙarewa',
    totalItems: 'Jimlar Kayayyaki',
    items: 'Kayayyaki',
    newSale: 'Sabon Talla',
    recordTransaction: "Rubuta ma'amala",
    inventory: 'Kayan Ajiya',
    manageStock: 'Sarrafa Kayan Ajiya',
    aiInsights: 'Hankali na AI',
    smartPredictions: 'Hasashe masu wayo',
    allSales: 'Duk Tallace-tallace',
    viewSalesHistory: 'Duba Tarihin Tallace-tallace',
    aiCreditScore: 'AI Credit Score',
    loanReadyInsights: 'Bayanan shirye-shiryen bashi',
    taxInsights: 'Bayanan Haraji',
    quickTaxReports: 'Rahotannin haraji na gaggawa',
    sale: 'Talla',
    plusItems: ' + {count} kayayyaki',
    // Inventory Screen
    searchPlaceholder: 'Bincika kayayyaki (misali, Indomie)...',
    noProductsFound: 'Ba a sami kayayyaki ba',
    allItems: 'Duk Kayayyaki',
    beverages: 'Abubuwan Sha',
    pantry: "Ma'ajiyar Abinci",
    snacks: 'Abubuwan Ciye-ciye',
    quantity: 'Yawa',
    // All Sales Screen
    dailySales: 'Tallace-tallace na Kullum',
    businessAssistant: 'Mataimakin Kasuwanci',
    assistantMessage:
      'Tallace-tallace sun tashi da kashi 12% a yau. Kuna gab da kai iyakar VAT—kudin shiga na wata-wata na yanzu yana nuna cewa za ku iya biyan bashin ₦45k nan ba da jimawa ba.',
    taxRisk: 'Hadarin Haraji',
    medium: 'Matsakaici',
    estimatedTaxableRevenue: 'Kudin Shiga Mai Haraji',
    vatCollected: 'VAT da aka tattara',
    potentialLoss: 'Hasara Mai Yiwuwa',
    totalRevenueToday: 'Jimlar Kudin Shiga (Yau)',
    searchReceiptPlaceholder: 'Bincika rasit ko abu...',
    today: 'Yau',
    paymentMethod: 'Hanyar Biyan Kuɗi',
    status: 'Matsayi',
    yesterday: 'Jiya',
    paid: 'An biya',
    pending: 'Ana jira',
    cash: 'Tsabar kudi',
    pos: 'POS',
    transfer: 'Canja wuri',
    // Settings Screen
    logOut: 'Fita',
    logOutConfirmation: 'Kun tabbata kuna son fita?',
    cancel: 'Soke',
    couldNotLogOut: 'Ba a iya fita ba',
    settings: 'Saituna',
    standardPlan: 'Tsarin Standard',
    editProfile: 'Shirya Bayanan Martaba',
    general: 'Gaba ɗaya',
    shopProfile: 'Bayanan Shago',
    shopProfileSubtitle: 'Adireshin, lambar sadarwa, & cikakkun bayanai',
    manageStaff: "Sarrafa Ma'aikata",
    manageStaffSubtitle: 'Ƙara ko cire mataimakan shago',
    appPreferences: 'Zaɓuɓɓukan App',
    appTheme: 'Jigon App',
    appThemeSubtitle: 'Yanayin Haske / Duhu',
    language: 'Yare',
    languageSubtitle: 'Canja yaren app',
    dark: 'Duhu',
    light: 'Haske',
    notifications: 'Sanarwa',
    notificationsSubtitle: 'Sanarwar tallace-tallace & sabuntawa',
    dataManagement: 'Gudanar da Bayanai',
    exportSalesData: 'Fitar da Bayanan Tallace-tallace',
    exportSalesDataSubtitle: 'Zazzage rahoton Excel / PDF',
    appVersion: 'Sigar App {version} (Gina {build})',
    productDetails: 'Bayanin Samfura',
    category: 'Kashi',
    price: 'Farashi',
    stockStatus: 'Matsayin Kaya',
    salesAnalysis: 'Binciken Tallace-tallace',
    sellingPrice: 'Farashin Siyarwa',
    costPrice: 'Farashin Sayayya',
    currentStock: 'Hannun Jari na Yanzu',
    totalSold: 'Jimlar da aka Sayar',
    revenue: 'Kudin Shiga',
    salesHistory: 'Tarihin Tallace-tallace',
    editProduct: 'Gyara Samfura',
    saveChanges: 'Ajiye Canje-canje',
    suggest: 'Ba da Shawara',
    units: "Raka'a",
    week: 'Mako',
    month: 'Wata',
    all: 'Duka',
    productNotFound: 'Ba a Sami Samfur ba',
    goBack: 'Koma Baya',
  },
  yoruba: {
    welcome: 'Kaabo si Supamart',
    selectLanguage: 'Jọwọ yan ede rẹ',
    english: 'English',
    pidgin: 'Nigerian Pidgin',
    continue: 'Tẹsiwaju',
    // LoginScreen
    welcomeOga: 'Kaabo, Oga! 👋',
    welcomeBack: 'Kaabo pada,',
    loginSubtitle: 'Jẹ ki a ṣeto ile itaja rẹ. Fi awọn alaye rẹ sii lati bẹrẹ titọpa tita.',
    phoneNumber: 'Nọmba Foonu',
    shopName: 'Orukọ Ile-itaja',
    newShopQuestion: 'Ile-itaja Tuntun?',
    getCode: 'Gba Koodu',
    termsAgreement: 'Nipa titẹ "Gba Koodu", o gba si ',
    terms: 'Awọn Ofin Wa',
    privacyPolicy: 'Eto Ikọkọ',
    requiredTitle: 'Nilo',
    phoneNumberRequired: 'Jọwọ tẹ nọmba foonu rẹ sii.',
    errorTitle: 'Aṣiṣe',
    hausa: 'Hausa',
    yoruba: 'Yoruba',
    igbo: 'Igbo',
    // OTP Screen
    verifyCodeTitle: 'Ṣayẹwo Koodu',
    otpSubtitle: 'Tẹ koodu nọmba 6 ti a firanṣẹ si ',
    otpEnter6DigitError: 'Tẹ koodu nọmba 6 ti a firanṣẹ si foonu rẹ.',
    otpVerificationFailedError: 'Ijẹrisi kuna. Gbiyanju lẹẹkansi.',
    otpVerifiedTitle: 'Ti ṣayẹwo',
    otpVerifiedSubtitle: 'OTP ti ṣayẹwo — tẹsiwaju.',
    otpResendFailedError: 'Ko le firanṣẹ lẹẹkansi. Gbiyanju nigbamii.',
    verifying: 'Nṣayẹwo...',
    verify: 'Ṣayẹwo',
    clear: 'Paarẹ',
    resendIn: 'Firanṣẹ lẹẹkansi ni {cooldown}s',
    resendCode: 'Firanṣẹ koodu lẹẹkansi',
    otpHelperText:
      'Ko gba koodu naa? Ṣayẹwo awọn ifiranṣẹ rẹ tabi tẹ "Firanṣẹ koodu lẹẹkansi". Fun aabo, awọn koodu n pari ni kiakia.',
    // HomeScreen
    goodMorning: 'Ẹ kaarọ,',
    overview: 'Akopọ',
    viewReports: 'Wo Awọn Ijabọ',
    quickActions: 'Awọn Iṣe Iyara',
    recentSales: 'Awọn Tita Tuntun',
    todaysSales: 'Awọn Tita Loni',
    lowStock: 'Ọja Kekere',
    totalItems: 'Lapapọ Awọn Ohun kan',
    items: 'Awọn ohun kan',
    newSale: 'Tita Tuntun',
    recordTransaction: 'Gba iṣowo silẹ',
    inventory: 'Akojọpọ',
    manageStock: 'Ṣakoso ọja',
    aiInsights: 'Awọn Imọ AI',
    smartPredictions: 'Awọn asọtẹlẹ ọlọgbọn',
    allSales: 'Gbogbo Awọn Tita',
    viewSalesHistory: 'Wo itan-akọọlẹ tita',
    aiCreditScore: 'AI Credit Score',
    loanReadyInsights: 'Awọn oye ti o ṣetan fun awin',
    taxInsights: 'Awọn Imọ Owo-ori',
    quickTaxReports: 'Awọn ijabọ owo-ori iyara',
    sale: 'Tita',
    plusItems: ' + {count} awọn ohun kan',
    // Inventory Screen
    searchPlaceholder: 'Wa awọn ọja (fun apẹẹrẹ, Indomie)...',
    noProductsFound: 'Ko si awọn ọja ti a ri',
    allItems: 'Gbogbo Awọn Ohun kan',
    beverages: 'Awọn ohun mimu',
    pantry: 'Ile-ifunni',
    snacks: 'Awọn ipanu',
    quantity: 'Oye',
    // All Sales Screen
    dailySales: 'Awọn Tita Ojoojumọ',
    businessAssistant: 'Oluranlọwọ Iṣowo',
    assistantMessage:
      'Awọn tita ti pọ si nipasẹ 12% loni. O n sunmọ opin VAT—owo-wiwọle oṣooṣu lọwọlọwọ n tọka si layabiliti ti ₦45k laipẹ.',
    taxRisk: 'Ewu Owo-ori',
    medium: 'Alabọde',
    estimatedTaxableRevenue: 'Iṣiro Owo-ori ti o ṣee ṣe',
    vatCollected: 'VAT ti a gba',
    potentialLoss: 'Ipadanu ti o ṣeeṣe',
    totalRevenueToday: 'Apapọ Owo-wiwọle (Loni)',
    searchReceiptPlaceholder: 'Wa iwe-ẹri tabi ohun kan...',
    today: 'Loni',
    paymentMethod: 'Ọna Isanwo',
    status: 'Ipo',
    yesterday: 'Ana',
    paid: 'Sanwo',
    pending: 'Ni isunmọtosi',
    cash: 'Owo',
    pos: 'POS',
    transfer: 'Gbe',
    // Settings Screen
    logOut: 'Jade',
    logOutConfirmation: 'Ṣe o da ọ loju pe o fẹ jade?',
    cancel: 'Fagilee',
    couldNotLogOut: 'Ko le jade',
    settings: 'Awọn Eto',
    standardPlan: 'Eto Standard',
    editProfile: 'Ṣatunṣe Profaili',
    general: 'Gbogbogbo',
    shopProfile: 'Profaili Ile-itaja',
    shopProfileSubtitle: 'Adirẹsi, olubasọrọ, & awọn alaye',
    manageStaff: 'Ṣakoso Awọn Oṣiṣẹ',
    manageStaffSubtitle: 'Fi tabi yọ awọn oluranlọwọ ile itaja kuro',
    appPreferences: 'Awọn Aṣayan App',
    appTheme: 'Akori App',
    appThemeSubtitle: 'Ipo Imọlẹ / Dudu',
    language: 'Ede',
    languageSubtitle: 'Yi ede app pada',
    dark: 'Dudu',
    light: 'Imọlẹ',
    notifications: 'Awọn iwifunni',
    notificationsSubtitle: 'Awọn titaniji tita & awọn imudojuiwọn',
    dataManagement: 'Isakoso Data',
    exportSalesData: 'Jade Awọn Data Tita',
    exportSalesDataSubtitle: 'Ṣe igbasilẹ ijabọ Excel / PDF',
    appVersion: 'Ẹya App {version} (Kọ {build})',
    productDetails: 'Awọn alaye ọja',
    category: 'Ẹka',
    price: 'Iye',
    stockStatus: 'Ipo Ọja',
    salesAnalysis: 'Itupalẹ Tita',
    sellingPrice: 'Iye Tita',
    costPrice: 'Iye rira',
    currentStock: 'Ọja ti o wa lọwọ',
    totalSold: 'Lapapọ tita',
    revenue: 'Owo-wiwọle',
    salesHistory: 'Itan-akọọlẹ Tita',
    editProduct: 'Ṣatunṣe Ọja',
    saveChanges: 'Fi Awọn Iyipada Pamọ',
    suggest: 'Daba',
    units: 'Awọn ohun kan',
    week: 'Ọsẹ',
    month: 'Oṣu',
    all: 'Gbogbo rẹ',
    productNotFound: 'A ko ri ọja',
    goBack: 'Pada sẹhin',
  },
  igbo: {
    welcome: 'Nnọọ na Supamart',
    selectLanguage: 'Biko họrọ asụsụ gị',
    english: 'English',
    pidgin: 'Nigerian Pidgin',
    continue: "Gaa n'ihu",
    // LoginScreen
    welcomeOga: 'Nnọọ, Oga! 👋',
    welcomeBack: 'Nnọọ lọghachi,',
    loginSubtitle: 'Ka anyị hazie ụlọ ahịa gị. Tinye nkọwa gị ka ịmalite ịdekọ ahịa.',
    phoneNumber: 'Nọmba Ekwentị',
    shopName: 'Aha Ụlọ Ahịa',
    newShopQuestion: 'Ụlọ Ahịa Ọhụrụ?',
    getCode: 'Nweta Koodu',
    termsAgreement: 'Site na ịpị "Nweta Koodu", ị kwenyere na ',
    terms: 'Usoro Anyị',
    privacyPolicy: 'Amụma Nzuzo',
    requiredTitle: 'Achọrọ',
    phoneNumberRequired: 'Biko tinye nọmba ekwentị gị.',
    errorTitle: 'Njehie',
    hausa: 'Hausa',
    yoruba: 'Yoruba',
    igbo: 'Igbo',
    // OTP Screen
    verifyCodeTitle: 'Nyochaa Koodu',
    otpSubtitle: 'Tinye koodu nọmba isii ezigara na ',
    otpEnter6DigitError: 'Tinye koodu nọmba isii ezigara na ekwentị gị.',
    otpVerificationFailedError: 'Nyocha ezughị ezu. Biko gbalịa ọzọ.',
    otpVerifiedTitle: 'Enyochala',
    otpVerifiedSubtitle: "OTP enyochala — gaa n'ihu.",
    otpResendFailedError: 'Enweghị ike izighachi. Biko gbalịa ọzọ ma emechaa.',
    verifying: 'Na-enyocha...',
    verify: 'Nyochaa',
    clear: 'Kpochapụ',
    resendIn: 'Zighachi na {cooldown}s',
    resendCode: 'Zighachi koodu',
    otpHelperText:
      'Ịnataghị koodu ahụ? Lelee ozi gị ma ọ bụ pịa "Zighachi koodu". Maka nchekwa, koodu na-agwụ ngwa ngwa.',
    // HomeScreen
    goodMorning: 'Ututu ọma,',
    overview: 'Nchịkọta',
    viewReports: 'Lelee Akụkọ',
    quickActions: 'Omume Ngwa Ngwa',
    recentSales: 'Ahịa Na-adịbeghị Anya',
    todaysSales: 'Ahịa Taa',
    lowStock: 'Ngwaahịa Dị Obere',
    totalItems: 'Ngụkọta Ihe',
    items: 'Ihe',
    newSale: 'Ahịa Ọhụrụ',
    recordTransaction: 'Dekọọ azụmahịa',
    inventory: 'Ndekọ Ngwaahịa',
    manageStock: 'Jikwaa ngwaahịa',
    aiInsights: 'Nghọta AI',
    smartPredictions: 'Amụma mara mma',
    allSales: 'Ahịa Niile',
    viewSalesHistory: 'Lelee akụkọ ahịa',
    aiCreditScore: 'Akara Ebe E Si Nweta AI',
    loanReadyInsights: 'Nghọta dị njikere maka mbinye ego',
    taxInsights: 'Nghọta Ụtụ Isi',
    quickTaxReports: 'Akụkọ ụtụ isi ngwa ngwa',
    sale: 'Ahịa',
    plusItems: ' + {count} ihe',
    // Inventory Screen
    searchPlaceholder: 'Chọọ ngwaahịa (dịka, Indomie)...',
    noProductsFound: 'Enweghị ngwaahịa achọtara',
    allItems: 'Ihe Niile',
    beverages: 'Ihe ọṅụṅụ',
    pantry: 'Ụlọ nri',
    snacks: 'Nri ngwa ngwa',
    quantity: 'Ọnụ ọgụgụ',
    // All Sales Screen
    dailySales: 'Ahịa Kwa Ụbọchị',
    businessAssistant: 'Onye Enyemaka Azụmahịa',
    assistantMessage:
      "Ahịa arịgoro 12% taa. Ị na-eru nso n'ọnụ ụzọ VAT—ego a na-enweta kwa ọnwa na-egosi ụgwọ ₦45k n'oge na-adịghị anya.",
    taxRisk: 'Ihe ize ndụ ụtụ isi',
    medium: 'Ọkara',
    estimatedTaxableRevenue: 'Ego a na-atụ anya ịkwụ ụtụ isi',
    vatCollected: 'VAT anakọtara',
    potentialLoss: 'Mfu Nwere Ike',
    totalRevenueToday: 'Ngụkọta ego a na-enweta (taa)',
    searchReceiptPlaceholder: 'Chọọ nnata ma ọ bụ ihe...',
    today: 'Taa',
    paymentMethod: 'Ụzọ ịkwụ ụgwọ',
    status: 'Ọnọdụ',
    yesterday: 'Ụnyaahụ',
    paid: 'Akụrụla',
    pending: 'Na-echere',
    cash: 'Ego',
    pos: 'POS',
    transfer: 'Nyefee',
    // Settings Screen
    logOut: 'Wepụ',
    logOutConfirmation: "Ị ji n'aka na ịchọrọ ịpụ?",
    cancel: 'Kagbuo',
    couldNotLogOut: 'Enweghị ike ịpụ',
    settings: 'Ntọala',
    standardPlan: 'Atụmatụ ọkọlọtọ',
    editProfile: 'Dezie Profaịlụ',
    general: "N'ozuzu",
    shopProfile: 'Profaịlụ Ụlọ Ahịa',
    shopProfileSubtitle: 'Adreesị, kọntaktị, & nkọwa',
    manageStaff: 'Jikwaa Ndị Ọrụ',
    manageStaffSubtitle: 'Tinye ma ọ bụ wepu ndị enyemaka ụlọ ahịa',
    appPreferences: 'Mmasị Ngwa',
    appTheme: 'Isiokwu Ngwa',
    appThemeSubtitle: 'Ọnọdụ Ọkụ / Ọchịchịrị',
    language: 'Asụsụ',
    languageSubtitle: 'Gbanwee asụsụ ngwa',
    dark: 'Ọchịchịrị',
    light: 'Ọkụ',
    notifications: 'Ọkwa',
    notificationsSubtitle: 'Nkwupụta ahịa & mmelite',
    dataManagement: 'Njikwa Data',
    exportSalesData: 'Mbupu Data Ahịa',
    exportSalesDataSubtitle: 'Budata akụkọ Excel / PDF',
    appVersion: 'Ụdị Ngwa {version} (Wuo {build})',
    productDetails: 'Nkọwa Ngwaahịa',
    category: 'Ụdị',
    price: 'Ọnụ ego',
    stockStatus: 'Ọnọdụ Ngwaahịa',
    salesAnalysis: 'Ntụle Ahịa',
    sellingPrice: 'Ọnụ Ahịa Ọrịre',
    costPrice: 'Ọnụ Ahịa Ịzụ Ahịa',
    currentStock: 'Ngwaahịa Dị Ugbu A',
    totalSold: 'Ngụkọta Erere',
    revenue: 'Ego a nwetara',
    salesHistory: 'Akụkọ Ahịa',
    editProduct: 'Dezie Ngwaahịa',
    saveChanges: 'Chekwaa Mgbanwe',
    suggest: 'Tụọ aro',
    units: 'Ihe',
    week: 'Izu',
    month: 'Ọnwa',
    all: 'Niile',
    productNotFound: 'Achọtaghị Ngwaahịa',
    goBack: 'Gaa azụ',
  },
};

// The key for storing the selected language in the database
const LANGUAGE_KEY = 'user_language';

let currentLanguage = 'en'; // Default language
let currentTranslations = translations[currentLanguage];

export const localizationService = {
  /**
   * Initialize the localization service by loading the saved language
   */
  initialize: async (): Promise<void> => {
    try {
      const savedLanguage = await localizationService.getLanguage();
      if (savedLanguage && translations[savedLanguage]) {
        currentLanguage = savedLanguage;
        currentTranslations = translations[savedLanguage];
      }
    } catch (error) {
      console.error('Failed to initialize localization:', error);
    }
  },

  /**
   * Set the current language and save it to local storage.
   * @param languageCode The language code (e.g., 'en', 'pcm')
   */
  setLanguage: async (languageCode: string): Promise<void> => {
    if (translations[languageCode]) {
      currentLanguage = languageCode;
      currentTranslations = translations[languageCode];
      try {
        await executeSql('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
          LANGUAGE_KEY,
          languageCode,
        ]);
      } catch (error) {
        console.error('Failed to save language setting:', error);
        throw error;
      }
    } else {
      console.warn(`Language '${languageCode}' not found.`);
    }
  },

  /**
   * Retrieve the saved language from local storage.
   */
  getLanguage: async (): Promise<string | null> => {
    try {
      const result = await executeSql('SELECT value FROM settings WHERE key = ?', [LANGUAGE_KEY]);

      if (result.rows.length > 0) {
        return result.rows.item(0).value;
      }
      return null;
    } catch (error) {
      console.error('Failed to get language setting:', error);
      return null;
    }
  },

  /**
   * Get the translated string for a given key.
   * @param key The key of the translation string
   */
  t: (key: keyof Translation): string => {
    return currentTranslations[key] || translations.en[key] || key;
  },

  /**
   * Get the current language code.
   */
  getCurrentLanguage: (): string => {
    return currentLanguage;
  },
};

// Initialize the service when the module is loaded
localizationService.initialize();

export const t = localizationService.t;
