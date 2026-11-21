import type { Category, TransactionType } from '../types/ledger';
import type { CurrencyCode } from '../utils/formatters';

export type LanguageCode = 'my' | 'en';

export interface Translations {
  app: {
    name: string;
    subtitle: string;
    skipToContent: string;
  };
  nav: {
    primaryLabel: string;
    home: string;
    ledger: string;
    analytics: string;
    settings: string;
    collapseSidebar: string;
    expandSidebar: string;
    addEntry: string;
  };
  periods: {
    groupLabel: string;
    today: string;
    week: string;
    month: string;
  };
  currencies: Record<CurrencyCode, string>;
  paymentMethods: {
    Cash: string;
    KBZPay: string;
    WavePay: string;
    'Bank Transfer': string;
    Card: string;
  };
  home: {
    title: string;
    subtitle: string;
    quickActionsTitle: string;
    addNewIncome: string;
    addNewExpense: string;
    openLedger: string;
    openAnalytics: string;
    recentTransactions: string;
    viewAll: string;
    noRecent: string;
    topCategoriesTitle: string;
    cashFlowPulseTitle: string;
    expenseRatio: string;
    incomeShare: string;
    expenseShare: string;
    welcomeTitle: string;
    welcomeDesc: string;
    addFirstEntry: string;
    loadSampleData: string;
    loadingSample: string;
  };
  kpi: {
    sectionLabel: string;
    totalIncome: string;
    totalExpense: string;
    netBalance: string;
    newPeriod: string;
    vsPrevious: string;
    surplus: string;
    deficit: string;
  };
  analytics: {
    title: string;
    subtitle: string;
    cashFlowTitle: string;
    cashFlowSubtitle: string;
    incomeLabel: string;
    expenseLabel: string;
    netLabel: string;
    loadingCashFlow: string;
    categoriesTitle: string;
    categoriesSubtitle: string;
    loadingBreakdown: string;
    noCategoryEntries: (typeLabel: string) => string;
    totalExpenseCenter: string;
    totalIncomeCenter: string;
  };
  ledger: {
    title: string;
    subtitle: string;
    showingCount: (shown: number, total: number) => string;
    importCsv: string;
    exportCsv: string;
    searchPlaceholder: string;
    searchLabel: string;
    allTypes: string;
    incomeType: string;
    expenseType: string;
    allCategories: string;
    sortNewest: string;
    sortOldest: string;
    sortHighest: string;
    sortLowest: string;
    colDate: string;
    colCategory: string;
    colNote: string;
    colMethod: string;
    colType: string;
    colAmount: string;
    colActions: string;
    loading: string;
    emptyFiltered: string;
    noNote: string;
    pageInfo: (page: number, totalPages: number) => string;
    previous: string;
    next: string;
    editAria: (label: string) => string;
    deleteAria: (label: string) => string;
    expandAria: string;
    collapseAria: string;
    editBtn: string;
    deleteBtn: string;
  };
  entry: {
    addTitle: string;
    editTitle: string;
    subtitle: string;
    closeAria: string;
    typeLegend: string;
    expense: string;
    income: string;
    amountLabel: (symbol: string) => string;
    amountHint: (example: string) => string;
    amountInvalidMsg: string;
    amountSubmitError: string;
    categoryMissingError: string;
    categoryLabel: string;
    dateLabel: string;
    paymentLabel: string;
    noteLabel: string;
    notePlaceholder: string;
    saving: string;
    save: string;
    update: string;
    saveAndAnother: string;
    saveFailed: string;
  };
  dialogs: {
    deleteTitle: string;
    deleteBody: (label: string, formattedAmount: string) => string;
    keepEntry: string;
    deleting: string;
    deleteConfirm: string;
    restoreTitle: string;
    restoreBody: (fileName: string, existingCount: number) => string;
    cancel: string;
    restoring: string;
    restoreConfirm: string;
    clearLegacyTitle: string;
    clearLegacyBody: (count: number) => string;
    keepCopy: string;
    clearing: string;
    clearOldCopy: string;
  };
  csvImport: {
    title: string;
    subtitleDefault: string;
    closeAria: string;
    summaryTitle: string;
    importedNew: string;
    updated: string;
    skippedDuplicates: string;
    invalidIgnored: string;
    createdCategories: (count: number) => string;
    done: string;
    totalRows: string;
    validRows: string;
    duplicateRows: string;
    invalidRows: string;
    duplicateLegend: (count: number) => string;
    skipDuplicates: string;
    skipDuplicatesDesc: string;
    updateExisting: string;
    updateExistingDesc: string;
    importAsNew: string;
    importAsNewDesc: string;
    validationErrorsTitle: (count: number) => string;
    moreInvalidRows: (count: number) => string;
    colRow: string;
    colStatus: string;
    statusNew: string;
    statusDuplicate: string;
    statusInvalid: string;
    previewLimitNote: (shown: number, total: number, importable: number) => string;
    cancel: string;
    close: string;
    importing: string;
    importRows: (count: number) => string;
    rowPrefix: (rowNum: number) => string;
  };
  settings: {
    title: string;
    subtitle: string;
    appearanceTitle: string;
    appearanceDesc: string;
    themeLabel: string;
    lightMode: string;
    darkMode: string;
    languageTitle: string;
    languageDesc: string;
    languageLabel: string;
    burmeseLabel: string;
    englishLabel: string;
    currencyTitle: string;
    currencyDesc: string;
    currencyLabel: string;
    storageTitle: string;
    storageDesc: string;
    engineLabel: string;
    engineIndexedDb: (version: number) => string;
    engineLocalStorage: string;
    engineApi: string;
    persistenceLabel: string;
    persistedGranted: string;
    persistedBestEffort: string;
    persistedBrowserManaged: string;
    quotaLabel: string;
    recordsCountLabel: string;
    localOnlyNotice: string;
    backupJson: string;
    restoreJson: string;
    clearOldLocalStorage: (count: number) => string;
    retryApi: string;
    checkingApi: string;
    useLocalMode: string;
    installApp: string;
    quotaWarning: (percent: number | null) => string;
    corruptedNotice: (key: string) => string;
    dismiss: string;
  };
  toasts: {
    entrySaved: string;
    entryUpdated: string;
    entryDeleted: string;
    sampleLoaded: string;
    csvExported: string;
    csvImported: (inserted: number, updated: number) => string;
    backupDownloaded: string;
    backupRestored: (count: number) => string;
    legacyCleared: string;
    appInstalled: string;
  };
  errors: {
    genericLoad: string;
    deleteFailed: string;
    sampleFailed: string;
    csvExportFailed: string;
    backupDownloadFailed: string;
    invalidBackupFile: string;
    restoreFailed: string;
    clearLegacyFailed: string;
    csvParseFailed: string;
    csvImportFailed: string;
    installFailed: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  my: {
    app: {
      name: 'နေ့စဉ် စာရင်း',
      subtitle: 'နေ့စဉ် ဝင်ငွေ/ထွက်ငွေ စီမံခန့်ခွဲမှု',
      skipToContent: 'အဓိကအကြောင်းအရာသို့ ကျော်သွားရန်',
    },
    nav: {
      primaryLabel: 'အဓိက လမ်းညွှန်မီနူး',
      home: 'ပင်မ',
      ledger: 'စာရင်း',
      analytics: 'ခွဲခြမ်း',
      settings: 'ဆက်တင်',
      collapseSidebar: 'ဘေးဘား ကျုံ့ရန်',
      expandSidebar: 'ဘေးဘား ချဲ့ရန်',
      addEntry: 'စာရင်းသစ်',
    },
    periods: {
      groupLabel: 'ရက်စွဲအပိုင်းအခြား ရွေးချယ်ရန်',
      today: 'ယနေ့',
      week: '၇ ရက်',
      month: 'ဤလ',
    },
    currencies: {
      MMK: 'မြန်မာကျပ် (Ks)',
      KRW: 'ကိုရီးယားဝမ် (₩)',
      JPY: 'ဂျပန်ယန်း (¥)',
    },
    paymentMethods: {
      Cash: 'ငွေသား',
      KBZPay: 'KBZPay',
      WavePay: 'WavePay',
      'Bank Transfer': 'ဘဏ်လွှဲ',
      Card: 'ကတ်',
    },
    home: {
      title: 'ပင်မ အကျဉ်းချုပ်',
      subtitle: 'လက်ရှိကာလ ငွေကြေးအခြေအနေ အကျဉ်း',
      quickActionsTitle: 'အမြန်လုပ်ဆောင်ချက်များ',
      addNewIncome: 'ဝင်ငွေသစ် ထည့်ရန်',
      addNewExpense: 'ထွက်ငွေသစ် ထည့်ရန်',
      openLedger: 'စာရင်းအပြည့်အစုံ ကြည့်ရန်',
      openAnalytics: 'ဂရပ်အပြည့်အစုံ ကြည့်ရန်',
      recentTransactions: 'နောက်ဆုံး စာရင်းများ',
      viewAll: 'အားလုံးကြည့်ရန်',
      noRecent: 'ဤကာလအတွင်း စာရင်းမရှိသေးပါ။',
      topCategoriesTitle: 'ထိပ်တန်း အမျိုးအစားများ',
      cashFlowPulseTitle: 'ဝင်ငွေနှင့် ထွက်ငွေ အချိုး',
      expenseRatio: 'သုံးစွဲမှုအချိုး',
      incomeShare: 'ဝင်ငွေ',
      expenseShare: 'ထွက်ငွေ',
      welcomeTitle: 'မင်္ဂလာပါ — နေ့စဉ် စာရင်းမှ ကြိုဆိုပါသည်',
      welcomeDesc:
        'သင့်စာရင်းစာအုပ် အသင့်ဖြစ်နေပါပြီ။ ပထမဆုံး ဝင်ငွေ သို့မဟုတ် ထွက်ငွေကို စက္ကန့်ပိုင်းအတွင်း မှတ်တမ်းတင်နိုင်သလို နမူနာစာရင်းများဖြင့်လည်း စမ်းသပ်ကြည့်နိုင်ပါသည်။',
      addFirstEntry: 'ပထမဆုံး စာရင်းထည့်ရန်',
      loadSampleData: 'နမူနာ စာရင်းများ ထည့်ရန်',
      loadingSample: 'ထည့်သွင်းနေသည်...',
    },
    kpi: {
      sectionLabel: 'အဓိက ငွေကြေးအချက်အလက်များ',
      totalIncome: 'စုစုပေါင်း ဝင်ငွေ',
      totalExpense: 'စုစုပေါင်း ထွက်ငွေ',
      netBalance: 'လက်ကျန်ငွေ',
      newPeriod: 'ကာလအသစ်',
      vsPrevious: 'ယခင်ကာလနှင့် နှိုင်းယှဉ်ချက်',
      surplus: 'ပိုငွေ ရှိနေသည်',
      deficit: 'လိုငွေ ဖြစ်နေသည်',
    },
    analytics: {
      title: 'ငွေကြေး ခွဲခြမ်းစိတ်ဖြာမှု',
      subtitle: 'နေ့စဉ် ငွေစီးဆင်းမှုနှင့် ကဏ္ဍအလိုက် သုံးစွဲမှုဂရပ်များ',
      cashFlowTitle: 'ငွေစီးဆင်းမှု',
      cashFlowSubtitle: 'ရွေးချယ်ထားသော ကာလအတွင်း နေ့စဉ် ဝင်ငွေနှင့် ထွက်ငွေ',
      incomeLabel: 'ဝင်ငွေ',
      expenseLabel: 'ထွက်ငွေ',
      netLabel: 'အသားတင်',
      loadingCashFlow: 'ငွေစီးဆင်းမှု ဂရပ်ဖတ်နေသည်...',
      categoriesTitle: 'ကဏ္ဍခွဲခြမ်းစိတ်ဖြာမှု',
      categoriesSubtitle: 'အမျိုးအစားအလိုက် ရာခိုင်နှုန်း',
      loadingBreakdown: 'ခွဲခြမ်းစိတ်ဖြာမှု ဖတ်နေသည်...',
      noCategoryEntries: (typeLabel) => `ဤကာလအတွင်း ${typeLabel} စာရင်း မရှိသေးပါ။`,
      totalExpenseCenter: 'စုစုပေါင်း ထွက်ငွေ',
      totalIncomeCenter: 'စုစုပေါင်း ဝင်ငွေ',
    },
    ledger: {
      title: 'စာရင်းစာရွက်',
      subtitle: 'စာရင်းအားလုံး ရှာဖွေခြင်း၊ စစ်ထုတ်ခြင်းနှင့် CSV ထုတ်/သွင်းခြင်း',
      showingCount: (shown, total) => `စုစုပေါင်း ${total} ခုအနက် ${shown} ခု ပြသနေသည်`,
      importCsv: 'CSV သွင်းမည်',
      exportCsv: 'CSV ထုတ်မည်',
      searchPlaceholder: 'မှတ်ချက်၊ အမျိုးအစား၊ နည်းလမ်း ရှာရန်...',
      searchLabel: 'စာရင်းများ ရှာဖွေရန်',
      allTypes: 'အမျိုးအစား အားလုံး',
      incomeType: 'ဝင်ငွေ',
      expenseType: 'ထွက်ငွေ',
      allCategories: 'ကဏ္ဍ အားလုံး',
      sortNewest: 'နောက်ဆုံးရက်စွဲ အရင်',
      sortOldest: 'အစောဆုံးရက်စွဲ အရင်',
      sortHighest: 'ပမာဏ အများဆုံး',
      sortLowest: 'ပမာဏ အနည်းဆုံး',
      colDate: 'ရက်စွဲ',
      colCategory: 'အမျိုးအစား',
      colNote: 'မှတ်ချက်',
      colMethod: 'ငွေပေးချေမှု',
      colType: 'အမျိုးအစားခွဲ',
      colAmount: 'ပမာဏ',
      colActions: 'လုပ်ဆောင်ချက်',
      loading: 'စာရင်းများ ဖတ်နေသည်...',
      emptyFiltered: 'လက်ရှိ စစ်ထုတ်မှုနှင့် ကိုက်ညီသော စာရင်းမရှိပါ။',
      noNote: 'မှတ်ချက်မရှိ',
      pageInfo: (page, totalPages) => `စာမျက်နှာ ${page} / ${totalPages}`,
      previous: 'အရှေ့',
      next: 'အနောက်',
      editAria: (label) => `${label} စာရင်းကို ပြင်ဆင်ရန်`,
      deleteAria: (label) => `${label} စာရင်းကို ဖျက်ရန်`,
      expandAria: 'အသေးစိတ် ဖွင့်ကြည့်ရန်',
      collapseAria: 'အသေးစိတ် ပြန်ပိတ်ရန်',
      editBtn: 'ပြင်ဆင်မည်',
      deleteBtn: 'ဖျက်မည်',
    },
    entry: {
      addTitle: 'စာရင်းသစ် ထည့်ရန်',
      editTitle: 'စာရင်း ပြင်ဆင်ရန်',
      subtitle: 'စာရင်းထဲသို့ တိုက်ရိုက်သိမ်းဆည်းပြီး စုစုပေါင်းကို တွက်ချက်ပေးပါမည်',
      closeAria: 'စာရင်းဖောင် ပိတ်ရန်',
      typeLegend: 'စာရင်းအမျိုးအစား',
      expense: 'ထွက်ငွေ',
      income: 'ဝင်ငွေ',
      amountLabel: (symbol) => `ပမာဏ (${symbol})`,
      amountHint: (example) => `ဂဏန်းသီးသန့် ရိုက်ထည့်ပါ (ဥပမာ - ${example})`,
      amountInvalidMsg: '0 ထက်ကြီးသော ပမာဏကို မှန်ကန်စွာ ထည့်ပါ။',
      amountSubmitError: 'ကျေးဇူးပြု၍ 0 ထက်ကြီးသော ပမာဏ ထည့်ပေးပါ။',
      categoryMissingError: 'ကျေးဇူးပြု၍ အမျိုးအစား တစ်ခု ရွေးချယ်ပါ။',
      categoryLabel: 'အမျိုးအစား',
      dateLabel: 'ရက်စွဲ',
      paymentLabel: 'ငွေပေးချေမှု နည်းလမ်း',
      noteLabel: 'မှတ်ချက် (မထည့်လည်းရသည်)',
      notePlaceholder: 'ဥပမာ - နေ့လယ်စာ၊ ဆိုင်ရောင်းရငွေ',
      saving: 'သိမ်းဆည်းနေသည်...',
      save: 'သိမ်းမည်',
      update: 'ပြင်ဆင်မှု သိမ်းမည်',
      saveAndAnother: 'သိမ်းပြီး နောက်တစ်ခု ထပ်ထည့်မည်',
      saveFailed: 'စာရင်းသိမ်းဆည်း၍ မရပါ။',
    },
    dialogs: {
      deleteTitle: 'စာရင်း ဖျက်မည်လား',
      deleteBody: (label, formattedAmount) =>
        `“${label}” (${formattedAmount}) စာရင်းကို အပြီးတိုင် ဖျက်လိုက်ပါမည်။`,
      keepEntry: 'မဖျက်တော့ပါ',
      deleting: 'ဖျက်နေသည်...',
      deleteConfirm: 'ဖျက်မည်',
      restoreTitle: 'Backup ပြန်သွင်းမည်လား',
      restoreBody: (fileName, existingCount) =>
        existingCount > 0
          ? `“${fileName}” ဖိုင်ကို ပြန်သွင်းပါက လက်ရှိ စာရင်း ${existingCount} ခုနေရာတွင် အစားထိုးသွားပါမည်။ လိုအပ်ပါက အရင် Backup သိမ်းထားပါ။`
          : `“${fileName}” ဖိုင်မှ စာရင်းများကို ပြန်သွင်းပါမည်။`,
      cancel: 'မလုပ်တော့ပါ',
      restoring: 'ပြန်သွင်းနေသည်...',
      restoreConfirm: 'Backup ပြန်သွင်းမည်',
      clearLegacyTitle: 'localStorage အဟောင်း ရှင်းမည်လား',
      clearLegacyBody: (count) =>
        `သင့်စာရင်း ${count} ခုကို IndexedDB ထဲသို့ ကူးယူပြီး ဖြစ်ပါသည်။ localStorage အဟောင်းကို ရှင်းလိုက်ပါက ပြန်ယူ၍မရပါ။`,
      keepCopy: 'ဆက်ထားမည်',
      clearing: 'ရှင်းနေသည်...',
      clearOldCopy: 'အဟောင်းကို ရှင်းမည်',
    },
    csvImport: {
      title: 'CSV စာရင်းသွင်းရန်',
      subtitleDefault: 'Database ထဲသို့ မသိမ်းမီ စာရင်းများကို စစ်ဆေးပါ',
      closeAria: 'CSV သွင်းသည့် မျက်နှာပြင် ပိတ်ရန်',
      summaryTitle: 'CSV စာရင်းသွင်းခြင်း ပြီးစီးပါပြီ',
      importedNew: 'အသစ်သွင်းပြီး',
      updated: 'ပြင်ဆင်ပြီး',
      skippedDuplicates: 'တူနေ၍ ကျော်ခဲ့သည်',
      invalidIgnored: 'မှားနေ၍ ချန်ခဲ့သည်',
      createdCategories: (count) => `CSV မှ ကဏ္ဍအသစ် ${count} ခု ထပ်တိုးပေးပြီးပါပြီ။`,
      done: 'ပြီးပါပြီ',
      totalRows: 'စုစုပေါင်း အတန်း',
      validRows: 'မှန်ကန်သော အတန်း',
      duplicateRows: 'တူညီနေသော အတန်း',
      invalidRows: 'အမှားပါသော အတန်း',
      duplicateLegend: (count) => `တူညီနေသော စာရင်း (${count}) ခုကို ကိုင်တွယ်ပုံ`,
      skipDuplicates: 'တူနေသည်များ ကျော်သွားမည် (လက်ရှိစာရင်း မပြောင်းပါ)',
      skipDuplicatesDesc: 'ရှိပြီးသား စာရင်းများကို မထိခိုက်စေဘဲ အသစ်များကိုသာ သွင်းပါမည်။',
      updateExisting: 'ရှိပြီးသား စာရင်းများကို ပြင်ဆင်မည်',
      updateExistingDesc: 'ID သို့မဟုတ် အချက်အလက် တူနေသော စာရင်းဟောင်းများကို အစားထိုးပြင်ဆင်ပါမည်။',
      importAsNew: 'စာရင်းသစ်အဖြစ် ထပ်ထည့်မည်',
      importAsNewDesc: 'ID အသစ်များဖြင့် မူလစာရင်းများ မပျက်ဘဲ အသစ်ထပ်ပေါင်းပါမည်။',
      validationErrorsTitle: (count) => `အမှားစစ်ဆေးတွေ့ရှိချက် (${count} တန်းကို ချန်လှပ်ပါမည်)`,
      moreInvalidRows: (count) => `နောက်ထပ် အမှား ${count} တန်း ကျန်ရှိသေးသည်။`,
      colRow: 'အတန်း',
      colStatus: 'အခြေအနေ',
      statusNew: 'အသစ်',
      statusDuplicate: 'တူနေသည်',
      statusInvalid: 'အမှား',
      previewLimitNote: (shown, total, importable) =>
        `စုစုပေါင်း ${total} တန်းအနက် ပထမ ${shown} တန်းကို နမူနာပြထားပါသည်။ စာရင်း ${importable} ခုကို တစ်ပြိုင်နက် သွင်းပေးပါမည်။`,
      cancel: 'မလုပ်တော့ပါ',
      close: 'ပိတ်မည်',
      importing: 'သွင်းနေသည်...',
      importRows: (count) => `${count} ခု သွင်းမည်`,
      rowPrefix: (rowNum) => `အတန်း ${rowNum}:`,
    },
    settings: {
      title: 'ဆက်တင်နှင့် ဒေတာစီမံခန့်ခွဲမှု',
      subtitle: 'အသွင်အပြင်၊ ဘာသာစကား၊ ငွေကြေးနှင့် Browser Database စီမံရန်',
      appearanceTitle: 'အသွင်အပြင် (Theme)',
      appearanceDesc: 'မျက်စိအေးသက်သာစေရန် အလင်း သို့မဟုတ် အမှောင်ပုံစံကို ရွေးချယ်ပါ',
      themeLabel: 'Theme ရွေးချယ်မှု',
      lightMode: 'အလင်းပုံစံ',
      darkMode: 'အမှောင်ပုံစံ',
      languageTitle: 'ဘာသာစကား',
      languageDesc: 'အသုံးပြုမည့် ဘာသာစကားကို ရွေးချယ်ပါ (သင်ရိုက်ထည့်ထားသော မှတ်ချက်များ မပြောင်းလဲပါ)',
      languageLabel: 'ဘာသာစကား ရွေးချယ်မှု',
      burmeseLabel: 'မြန်မာ',
      englishLabel: 'English',
      currencyTitle: 'ငွေကြေးယူနစ်',
      currencyDesc: 'စာရင်းများ ပြသမည့် ငွေကြေးပုံစံကို ရွေးချယ်ပါ',
      currencyLabel: 'ငွေကြေး ရွေးချယ်မှု',
      storageTitle: 'ဒေတာသိုလှောင်မှုနှင့် Backup',
      storageDesc: 'သင့်စာရင်းများကို ဤစက်၏ Browser ထဲတွင်သာ သိမ်းဆည်းထားပြီး Device များကြား အလိုအလျောက် Sync မဖြစ်ပါ။',
      engineLabel: 'လက်ရှိ Database စနစ်',
      engineIndexedDb: (version) => `IndexedDB (ဗားရှင်း ${version})`,
      engineLocalStorage: 'Local Storage (အရန်စနစ်)',
      engineApi: 'PostgreSQL API ဆာဗာ',
      persistenceLabel: 'Persistence အခြေအနေ',
      persistedGranted: 'ခွင့်ပြုထားပြီး',
      persistedBestEffort: 'Browser စီမံခန့်ခွဲမှု',
      persistedBrowserManaged: 'Browser ပုံမှန်',
      quotaLabel: 'သိုလှောင်မှု ပမာဏ',
      recordsCountLabel: 'သိမ်းဆည်းထားသော စာရင်း',
      localOnlyNotice:
        'iPhone Safari တွင် ၇ ရက်အတွင်း မဖွင့်ပါက Browser data ရှင်းထုတ်ခံရနိုင်သဖြင့် Home Screen App အဖြစ် ထည့်သုံးခြင်းနှင့် Backup JSON သိမ်းထားခြင်းကို အကြံပြုပါသည်။',
      backupJson: 'JSON Backup သိမ်းမည်',
      restoreJson: 'JSON Backup ပြန်သွင်းမည်',
      clearOldLocalStorage: (count) => `localStorage အဟောင်းရှင်းမည် (${count})`,
      retryApi: 'API ပြန်ချိတ်ကြည့်မည်',
      checkingApi: 'စစ်ဆေးနေသည်...',
      useLocalMode: 'Local IndexedDB သုံးမည်',
      installApp: 'App အဖြစ် Install လုပ်မည်',
      quotaWarning: (percent) =>
        `Browser သိုလှောင်မှု ${percent ?? 80}% ကျော်နေပါပြီ။ JSON Backup သိမ်းပြီး စာရင်းဟောင်းအချို့ ရှင်းလင်းသင့်ပါသည်။`,
      corruptedNotice: (key) =>
        `ပျက်စီးနေသော ဒေတာအချို့ကို တွေ့ရှိ၍ “${key}” အောက်တွင် လုံခြုံစွာ ခွဲထားပေးပါသည်။`,
      dismiss: 'ပိတ်မည်',
    },
    toasts: {
      entrySaved: 'စာရင်းသစ် သိမ်းဆည်းပြီးပါပြီ',
      entryUpdated: 'စာရင်း ပြင်ဆင်ပြီးပါပြီ',
      entryDeleted: 'စာရင်း ဖျက်ပြီးပါပြီ',
      sampleLoaded: 'နမူနာ စာရင်းများ ထည့်သွင်းပြီးပါပြီ',
      csvExported: 'CSV ဖိုင် ထုတ်ယူပြီးပါပြီ',
      csvImported: (inserted, updated) =>
        `CSV သွင်းပြီးပါပြီ (အသစ် ${inserted} ခု၊ ပြင်ဆင် ${updated} ခု)`,
      backupDownloaded: 'Backup JSON သိမ်းဆည်းပြီးပါပြီ',
      backupRestored: (count) => `Backup မှ စာရင်း ${count} ခု ပြန်သွင်းပြီးပါပြီ`,
      legacyCleared: 'localStorage အဟောင်းကို ရှင်းလင်းပြီးပါပြီ',
      appInstalled: 'App ကို Install လုပ်ပြီးပါပြီ',
    },
    errors: {
      genericLoad: 'စာရင်းဒေတာများ ဖတ်ယူ၍ မရပါ။',
      deleteFailed: 'စာရင်း ဖျက်၍ မရပါ။',
      sampleFailed: 'နမူနာ စာရင်း ထည့်၍ မရပါ။',
      csvExportFailed: 'CSV ထုတ်ယူရာတွင် အမှားဖြစ်ပေါ်ပါသည်။',
      backupDownloadFailed: 'Backup သိမ်းဆည်းရာတွင် အမှားဖြစ်ပေါ်ပါသည်။',
      invalidBackupFile: 'Backup ဖိုင်ပုံစံ မှားယွင်းနေပါသည်။',
      restoreFailed: 'Backup ပြန်သွင်းရာတွင် အမှားဖြစ်ပေါ်ပါသည်။',
      clearLegacyFailed: 'localStorage အဟောင်း ရှင်းလင်း၍ မရပါ။',
      csvParseFailed: 'CSV ဖိုင်ကို ဖတ်ရှု၍ မရပါ။',
      csvImportFailed: 'CSV စာရင်းသွင်းရာတွင် အမှားဖြစ်ပေါ်ပါသည်။',
      installFailed: 'App Install စတင်၍ မရပါ။',
    },
  },
  en: {
    app: {
      name: 'Daily Ledger',
      subtitle: 'Calm, clear personal cash-flow management',
      skipToContent: 'Skip to main content',
    },
    nav: {
      primaryLabel: 'Primary navigation',
      home: 'Home',
      ledger: 'Ledger',
      analytics: 'Analytics',
      settings: 'Settings',
      collapseSidebar: 'Collapse sidebar',
      expandSidebar: 'Expand sidebar',
      addEntry: 'Add Entry',
    },
    periods: {
      groupLabel: 'Dashboard date range',
      today: 'Today',
      week: '7 Days',
      month: 'This Month',
    },
    currencies: {
      MMK: 'Myanmar Kyat (Ks)',
      KRW: 'South Korean Won (₩)',
      JPY: 'Japanese Yen (¥)',
    },
    paymentMethods: {
      Cash: 'Cash',
      KBZPay: 'KBZPay',
      WavePay: 'WavePay',
      'Bank Transfer': 'Bank Transfer',
      Card: 'Card',
    },
    home: {
      title: 'Home Overview',
      subtitle: 'Concise summary for your selected period',
      quickActionsTitle: 'Quick Actions',
      addNewIncome: 'Record Income',
      addNewExpense: 'Record Expense',
      openLedger: 'Open Full Ledger',
      openAnalytics: 'Explore Charts',
      recentTransactions: 'Recent Activity',
      viewAll: 'View All',
      noRecent: 'No entries recorded in this period yet.',
      topCategoriesTitle: 'Top Expense Categories',
      cashFlowPulseTitle: 'Income vs Expense Balance',
      expenseRatio: 'Expense ratio',
      incomeShare: 'Income',
      expenseShare: 'Expense',
      welcomeTitle: 'Welcome to Daily Ledger',
      welcomeDesc:
        'Your ledger is ready. Log your first income or expense in seconds, or load sample entries to explore charts immediately.',
      addFirstEntry: 'Add Your First Entry',
      loadSampleData: 'Load Sample Data',
      loadingSample: 'Loading...',
    },
    kpi: {
      sectionLabel: 'Key financial indicators',
      totalIncome: 'Total Income',
      totalExpense: 'Total Expense',
      netBalance: 'Net Balance',
      newPeriod: 'New period',
      vsPrevious: 'vs previous period',
      surplus: 'Surplus in period',
      deficit: 'Deficit in period',
    },
    analytics: {
      title: 'Financial Analytics',
      subtitle: 'Animated daily cash-flow trends and category shares',
      cashFlowTitle: 'Cash Flow',
      cashFlowSubtitle: 'Daily income vs expense over selected period',
      incomeLabel: 'Income',
      expenseLabel: 'Expense',
      netLabel: 'Net',
      loadingCashFlow: 'Loading cash flow...',
      categoriesTitle: 'Category Breakdown',
      categoriesSubtitle: 'Share by category',
      loadingBreakdown: 'Loading breakdown...',
      noCategoryEntries: (typeLabel) => `No ${typeLabel} entries in this period yet.`,
      totalExpenseCenter: 'Total Expense',
      totalIncomeCenter: 'Total Income',
    },
    ledger: {
      title: 'Ledger Transactions',
      subtitle: 'Search, filter, inspect, and import or export your entries',
      showingCount: (shown, total) => `Showing ${shown} of ${total} entries in selected period`,
      importCsv: 'Import CSV',
      exportCsv: 'Export CSV',
      searchPlaceholder: 'Search note, category, method...',
      searchLabel: 'Search transactions',
      allTypes: 'All Types',
      incomeType: 'Income',
      expenseType: 'Expense',
      allCategories: 'All Categories',
      sortNewest: 'Newest First',
      sortOldest: 'Oldest First',
      sortHighest: 'Highest Amount',
      sortLowest: 'Lowest Amount',
      colDate: 'Date',
      colCategory: 'Category',
      colNote: 'Note',
      colMethod: 'Method',
      colType: 'Type',
      colAmount: 'Amount',
      colActions: 'Actions',
      loading: 'Loading ledger entries...',
      emptyFiltered: 'No matching entries found for the current filters.',
      noNote: 'No note',
      pageInfo: (page, totalPages) => `Page ${page} of ${totalPages}`,
      previous: 'Previous',
      next: 'Next',
      editAria: (label) => `Edit entry ${label}`,
      deleteAria: (label) => `Delete entry ${label}`,
      expandAria: 'Expand transaction details',
      collapseAria: 'Collapse transaction details',
      editBtn: 'Edit',
      deleteBtn: 'Delete',
    },
    entry: {
      addTitle: 'Add Entry',
      editTitle: 'Edit Entry',
      subtitle: 'Saves directly to your ledger and updates totals',
      closeAria: 'Close entry form',
      typeLegend: 'Transaction type',
      expense: 'Expense',
      income: 'Income',
      amountLabel: (symbol) => `Amount (${symbol})`,
      amountHint: (example) => `Numbers only, e.g. ${example}`,
      amountInvalidMsg: 'Enter an amount greater than 0.',
      amountSubmitError: 'Please enter a valid positive amount greater than 0.',
      categoryMissingError: 'Please select a category.',
      categoryLabel: 'Category',
      dateLabel: 'Date',
      paymentLabel: 'Payment Method',
      noteLabel: 'Note (Optional)',
      notePlaceholder: 'e.g., Lunch, Daily shop sales',
      saving: 'Saving...',
      save: 'Save Entry',
      update: 'Update Entry',
      saveAndAnother: 'Save & Add Another',
      saveFailed: 'Unable to save entry.',
    },
    dialogs: {
      deleteTitle: 'Delete Entry?',
      deleteBody: (label, formattedAmount) =>
        `This will permanently remove "${label}" (${formattedAmount}) from your ledger.`,
      keepEntry: 'Keep Entry',
      deleting: 'Deleting...',
      deleteConfirm: 'Delete',
      restoreTitle: 'Restore Backup?',
      restoreBody: (fileName, existingCount) =>
        existingCount > 0
          ? `Restoring "${fileName}" will replace your current ${existingCount} local entries. Consider downloading a backup first if you want to keep existing entries.`
          : `Restoring "${fileName}" into your local ledger database.`,
      cancel: 'Cancel',
      restoring: 'Restoring...',
      restoreConfirm: 'Restore Backup',
      clearLegacyTitle: 'Clear Legacy Copy?',
      clearLegacyBody: (count) =>
        `Your ${count} entries are already safely copied into IndexedDB. Clearing the old localStorage copy frees space and cannot be undone without a backup.`,
      keepCopy: 'Keep Copy',
      clearing: 'Clearing...',
      clearOldCopy: 'Clear Old Copy',
    },
    csvImport: {
      title: 'Import CSV',
      subtitleDefault: 'Review rows before saving to database',
      closeAria: 'Close CSV import dialog',
      summaryTitle: 'Import Summary',
      importedNew: 'Imported (New)',
      updated: 'Updated',
      skippedDuplicates: 'Skipped Duplicates',
      invalidIgnored: 'Invalid Rows Ignored',
      createdCategories: (count) => `Created ${count} new custom category(ies) from CSV.`,
      done: 'Done',
      totalRows: 'Total Rows',
      validRows: 'Valid Rows',
      duplicateRows: 'Duplicate Rows',
      invalidRows: 'Invalid Rows',
      duplicateLegend: (count) => `Duplicate Handling (${count})`,
      skipDuplicates: 'Skip duplicates',
      skipDuplicatesDesc: 'Keep existing records untouched and import only new rows.',
      updateExisting: 'Update existing records',
      updateExistingDesc: 'Overwrite matching existing records with values from the CSV.',
      importAsNew: 'Import as new records',
      importAsNewDesc: 'Insert duplicate rows with fresh IDs without modifying existing records.',
      validationErrorsTitle: (count) =>
        `Validation Errors (${count} invalid row${count === 1 ? '' : 's'} will be skipped):`,
      moreInvalidRows: (count) => `...and ${count} more invalid rows.`,
      colRow: 'Row',
      colStatus: 'Status',
      statusNew: 'New',
      statusDuplicate: 'Duplicate',
      statusInvalid: 'Invalid',
      previewLimitNote: (shown, total, importable) =>
        `Showing first ${shown} of ${total} rows in preview. All ${importable} valid rows will be imported atomically.`,
      cancel: 'Cancel',
      close: 'Close',
      importing: 'Importing...',
      importRows: (count) => `Import ${count} Row${count === 1 ? '' : 's'}`,
      rowPrefix: (rowNum) => `Row ${rowNum}:`,
    },
    settings: {
      title: 'Settings & Data',
      subtitle: 'Customize appearance, language, currency, and browser database',
      appearanceTitle: 'Appearance',
      appearanceDesc: 'Choose Light Mode or Dark Mode across all pages',
      themeLabel: 'Theme selection',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode',
      languageTitle: 'Language',
      languageDesc: 'Switch interface language (your personal notes and custom names stay unchanged)',
      languageLabel: 'Language selection',
      burmeseLabel: 'မြန်မာ',
      englishLabel: 'English',
      currencyTitle: 'Display Currency',
      currencyDesc: 'Select the currency format for summaries, charts, and exports',
      currencyLabel: 'Currency selection',
      storageTitle: 'Storage & Backups',
      storageDesc:
        'Your records are stored locally in this browser sandbox and do not automatically sync across devices.',
      engineLabel: 'Active Database Engine',
      engineIndexedDb: (version) => `IndexedDB (v${version})`,
      engineLocalStorage: 'Local Storage (Fallback)',
      engineApi: 'PostgreSQL API Server',
      persistenceLabel: 'Persistence Status',
      persistedGranted: 'Granted',
      persistedBestEffort: 'Best-effort',
      persistedBrowserManaged: 'Browser-managed',
      quotaLabel: 'Storage Usage',
      recordsCountLabel: 'Local Entries',
      localOnlyNotice:
        'On iPhone Safari, browser storage may be evicted after prolonged inactivity unless installed to Home Screen or backed up via JSON/CSV.',
      backupJson: 'Backup JSON',
      restoreJson: 'Restore JSON',
      clearOldLocalStorage: (count) => `Clear Old localStorage (${count})`,
      retryApi: 'Retry API',
      checkingApi: 'Checking...',
      useLocalMode: 'Use IndexedDB Mode',
      installApp: 'Install App',
      quotaWarning: (percent) =>
        `Browser storage usage is above 80% (${percent ?? 80}%). Please download a JSON backup and remove older records if needed.`,
      corruptedNotice: (key) =>
        `Malformed browser records were quarantined safely under "${key}".`,
      dismiss: 'Dismiss',
    },
    toasts: {
      entrySaved: 'Entry saved',
      entryUpdated: 'Entry updated',
      entryDeleted: 'Entry removed',
      sampleLoaded: 'Sample data loaded',
      csvExported: 'CSV exported',
      csvImported: (inserted, updated) => `Imported ${inserted}, updated ${updated}`,
      backupDownloaded: 'Backup JSON downloaded',
      backupRestored: (count) => `Restored ${count} entries from backup`,
      legacyCleared: 'Legacy localStorage copy cleared',
      appInstalled: 'App installed',
    },
    errors: {
      genericLoad: 'Unable to load ledger data.',
      deleteFailed: 'Unable to delete entry.',
      sampleFailed: 'Unable to load sample data.',
      csvExportFailed: 'CSV export failed.',
      backupDownloadFailed: 'Backup download failed.',
      invalidBackupFile: 'Invalid backup file.',
      restoreFailed: 'Failed to restore backup.',
      clearLegacyFailed: 'Unable to clear legacy data.',
      csvParseFailed: 'Unable to parse CSV file.',
      csvImportFailed: 'CSV import failed.',
      installFailed: 'Unable to start app installation.',
    },
  },
};

const MYANMAR_MONTHS_SHORT = [
  'ဇန်',
  'ဖေ',
  'မတ်',
  'ဧပြီ',
  'မေ',
  'ဇွန်',
  'ဇူ',
  'ဩ',
  'စက်',
  'အောက်',
  'နို',
  'ဒီ',
];

const MYANMAR_MONTHS_LONG = [
  'ဇန်နဝါရီ',
  'ဖေဖော်ဝါရီ',
  'မတ်',
  'ဧပြီ',
  'မေ',
  'ဇွန်',
  'ဇူလိုင်',
  'ဩဂုတ်',
  'စက်တင်ဘာ',
  'အောက်တိုဘာ',
  'နိုဝင်ဘာ',
  'ဒီဇင်ဘာ',
];

export function formatLocalizedShortDate(dateStr: string, lang: LanguageCode): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (lang === 'my') {
    const monthLabel = MYANMAR_MONTHS_SHORT[(m - 1) % 12] ?? '';
    return `${monthLabel} ${d}`;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatLocalizedFullDate(dateStr: string, lang: LanguageCode): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (lang === 'my') {
    const monthLabel = MYANMAR_MONTHS_LONG[(m - 1) % 12] ?? '';
    return `${monthLabel} ${d}, ${y}`;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Returns strict single-language label for built-in categories while preserving user-created names verbatim.
 */
export function getCategoryLabel(
  category: Pick<Category, 'name' | 'nameMy' | 'isDefault'>,
  lang: LanguageCode
): string {
  if (category.isDefault === false) {
    return category.name;
  }
  if (lang === 'my') {
    return category.nameMy?.trim() || category.name;
  }
  return category.name;
}

export function getPaymentMethodLabel(method: string, lang: LanguageCode): string {
  if (lang === 'my') {
    const map = TRANSLATIONS.my.paymentMethods as Record<string, string>;
    return map[method] ?? method;
  }
  return method;
}

export function getTypeLabel(type: TransactionType, lang: LanguageCode): string {
  return type === 'income' ? TRANSLATIONS[lang].entry.income : TRANSLATIONS[lang].entry.expense;
}
