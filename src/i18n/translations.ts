import type { Category, TransactionType } from '../types/ledger';
import type { CurrencyCode } from '../utils/formatters';

export type LanguageCode = 'my' | 'en' | 'ko' | 'ja';

export const SUPPORTED_LANGUAGES: readonly LanguageCode[] = ['my', 'en', 'ko', 'ja'];

export function isLanguageCode(value: string | null | undefined): value is LanguageCode {
  return value === 'my' || value === 'en' || value === 'ko' || value === 'ja';
}

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
    backAria: string;
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
  voice: {
    sectionLabel: string;
    startBtn: string;
    tapHint: string;
    stopBtn: string;
    cancelBtn: string;
    listening: string;
    interimPlaceholder: string;
    speechLangLabel: string;
    heardLabel: string;
    confirmSaveBtn: string;
    clearTranscriptAria: string;
    unsupportedNotice: string;
    errNotAllowed: string;
    errNoSpeech: string;
    errNetwork: string;
    errAudioCapture: string;
    errGeneric: string;
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
    koreanLabel: string;
    japaneseLabel: string;
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
      backAria: 'ပင်မစာမျက်နှာသို့ ပြန်သွားရန်',
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
      saveAndAnother: 'သိမ်းပြီး ထပ်ထည့်မည်',
      saveFailed: 'စာရင်းသိမ်းဆည်း၍ မရပါ။',
    },
    voice: {
      sectionLabel: 'အသံဖြင့် စာရင်းသွင်းရန်',
      startBtn: 'အသံဖြင့် ထည့်ရန်',
      tapHint: 'မိုက်ခလုတ်ကို နှိပ်ပြီး “Lunch 5000” ကဲ့သို့ ပြောပါ',
      stopBtn: 'ပြီးပါပြီ',
      cancelBtn: 'မလုပ်တော့ပါ',
      listening: 'နားထောင်နေသည်...',
      interimPlaceholder: 'အကြောင်းအရာနှင့် ပမာဏကို ပြောပါ...',
      speechLangLabel: 'အသံဖမ်း ဘာသာစကား',
      heardLabel: 'ဖမ်းယူရရှိသည့် စာသား',
      confirmSaveBtn: 'အမြန်သိမ်းမည်',
      clearTranscriptAria: 'အသံစာသား ရှင်းရန်',
      unsupportedNotice:
        'ဤ Browser တွင် အသံဖြင့် ထည့်သွင်းမှု မပံ့ပိုးပါ။ အောက်တွင် လက်ဖြင့် ရိုက်ထည့်ပေးပါ။',
      errNotAllowed:
        'မိုက်ခရိုဖုန်း ခွင့်ပြုချက် ပိတ်ထားပါသည်။ Browser ဆက်တင်တွင် ဖွင့်ပါ သို့မဟုတ် လက်ဖြင့် ထည့်ပါ။',
      errNoSpeech: 'အသံမကြားရပါ။ မိုက်ခလုတ်ကို ပြန်နှိပ်၍ ထပ်ပြောကြည့်ပါ။',
      errNetwork: 'အသံဖမ်းစနစ်အတွက် အင်တာနက် ချိတ်ဆက်မှု လိုအပ်ပါသည်။',
      errAudioCapture: 'ဤစက်တွင် မိုက်ခရိုဖုန်း ရှာမတွေ့ပါ။',
      errGeneric: 'အသံဖမ်း၍ မရပါ။ ထပ်မံကြိုးစားပါ သို့မဟုတ် လက်ဖြင့် ထည့်ပါ။',
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
      koreanLabel: '한국어',
      japaneseLabel: '日本語',
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
      backAria: 'Back to Home',
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
    voice: {
      sectionLabel: 'Voice entry input',
      startBtn: 'Voice Entry',
      tapHint: 'Tap mic and say e.g. "Lunch 5000 by KBZPay"',
      stopBtn: 'Done',
      cancelBtn: 'Cancel',
      listening: 'Listening...',
      interimPlaceholder: 'Speak item, amount, and optional method...',
      speechLangLabel: 'Voice recognition language',
      heardLabel: 'Heard',
      confirmSaveBtn: 'Quick Save',
      clearTranscriptAria: 'Dismiss recognized transcript',
      unsupportedNotice:
        'Voice input is unavailable in this browser. You can enter details below.',
      errNotAllowed:
        'Microphone permission was denied. Enable mic access in browser settings or enter manually.',
      errNoSpeech: 'No speech detected. Tap the mic and try speaking clearly.',
      errNetwork: 'Speech recognition needs a network connection on this browser.',
      errAudioCapture: 'No microphone was detected on this device.',
      errGeneric: 'Voice recognition could not complete. Try again or type manually.',
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
      koreanLabel: '한국어',
      japaneseLabel: '日本語',
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
  ko: {
    app: {
      name: '데일리 가계부',
      subtitle: '간편하고 명확한 일일 현금 흐름 관리',
      skipToContent: '본문으로 건너뛰기',
    },
    nav: {
      primaryLabel: '주 탐색 메뉴',
      home: '홈',
      ledger: '내역',
      analytics: '분석',
      settings: '설정',
      collapseSidebar: '사이드바 접기',
      expandSidebar: '사이드바 펼치기',
      addEntry: '새 항목',
    },
    periods: {
      groupLabel: '조회 기간 선택',
      today: '오늘',
      week: '7일',
      month: '이번 달',
    },
    currencies: {
      MMK: '미얀마 짯 (Ks)',
      KRW: '대한민국 원 (₩)',
      JPY: '일본 엔 (¥)',
    },
    paymentMethods: {
      Cash: '현금',
      KBZPay: 'KBZPay',
      WavePay: 'WavePay',
      'Bank Transfer': '계좌이체',
      Card: '카드',
    },
    home: {
      title: '홈 요약',
      subtitle: '선택한 기간의 재무 현황 요약',
      quickActionsTitle: '빠른 실행',
      addNewIncome: '수입 기록',
      addNewExpense: '지출 기록',
      openLedger: '전체 내역 보기',
      openAnalytics: '상세 차트 보기',
      recentTransactions: '최근 거래 내역',
      viewAll: '전체 보기',
      noRecent: '선택한 기간에 등록된 거래가 없습니다.',
      topCategoriesTitle: '주요 지출 카테고리',
      cashFlowPulseTitle: '수입 대비 지출 비율',
      expenseRatio: '지출 비율',
      incomeShare: '수입',
      expenseShare: '지출',
      welcomeTitle: '데일리 가계부에 오신 것을 환영합니다',
      welcomeDesc:
        '장부가 준비되었습니다. 첫 수입이나 지출을 바로 기록하거나, 샘플 데이터를 불러와 차트를 즉시 확인해 보세요.',
      addFirstEntry: '첫 번째 항목 추가',
      loadSampleData: '샘플 데이터 불러오기',
      loadingSample: '불러오는 중...',
    },
    kpi: {
      sectionLabel: '핵심 재무 지표',
      totalIncome: '총 수입',
      totalExpense: '총 지출',
      netBalance: '순 잔액',
      newPeriod: '신규 기간',
      vsPrevious: '이전 기간 대비',
      surplus: '흑자 상태',
      deficit: '적자 상태',
    },
    analytics: {
      title: '재무 분석',
      subtitle: '일별 현금 흐름 추이와 카테고리별 비중',
      cashFlowTitle: '현금 흐름',
      cashFlowSubtitle: '선택한 기간의 일별 수입 및 지출',
      incomeLabel: '수입',
      expenseLabel: '지출',
      netLabel: '순이익',
      loadingCashFlow: '현금 흐름 차트를 불러오는 중...',
      categoriesTitle: '카테고리별 분석',
      categoriesSubtitle: '카테고리별 비중',
      loadingBreakdown: '분석 데이터를 불러오는 중...',
      noCategoryEntries: (typeLabel) => `이 기간에 등록된 ${typeLabel} 내역이 없습니다.`,
      totalExpenseCenter: '총 지출',
      totalIncomeCenter: '총 수입',
    },
    ledger: {
      title: '거래 내역',
      subtitle: '모든 거래를 검색, 필터링하고 CSV로 내보내거나 가져오기',
      showingCount: (shown, total) => `총 ${total}건 중 ${shown}건 표시`,
      importCsv: 'CSV 가져오기',
      exportCsv: 'CSV 내보내기',
      searchPlaceholder: '메모, 카테고리, 결제수단 검색...',
      searchLabel: '거래 내역 검색',
      allTypes: '전체 유형',
      incomeType: '수입',
      expenseType: '지출',
      allCategories: '전체 카테고리',
      sortNewest: '최신순',
      sortOldest: '오래된순',
      sortHighest: '금액 높은순',
      sortLowest: '금액 낮은순',
      colDate: '날짜',
      colCategory: '카테고리',
      colNote: '메모',
      colMethod: '결제수단',
      colType: '구분',
      colAmount: '금액',
      colActions: '작업',
      loading: '거래 내역을 불러오는 중...',
      emptyFiltered: '현재 조건과 일치하는 거래 내역이 없습니다.',
      noNote: '메모 없음',
      pageInfo: (page, totalPages) => `${page} / ${totalPages} 페이지`,
      previous: '이전',
      next: '다음',
      editAria: (label) => `${label} 항목 수정`,
      deleteAria: (label) => `${label} 항목 삭제`,
      expandAria: '상세 정보 펼치기',
      collapseAria: '상세 정보 접기',
      editBtn: '수정',
      deleteBtn: '삭제',
    },
    entry: {
      addTitle: '새 항목 추가',
      editTitle: '항목 수정',
      subtitle: '장부에 바로 저장되고 합계가 자동으로 업데이트됩니다',
      closeAria: '입력 화면 닫기',
      backAria: '홈으로 돌아가기',
      typeLegend: '거래 구분',
      expense: '지출',
      income: '수입',
      amountLabel: (symbol) => `금액 (${symbol})`,
      amountHint: (example) => `숫자만 입력하세요 (예: ${example})`,
      amountInvalidMsg: '0보다 큰 올바른 금액을 입력하세요.',
      amountSubmitError: '0보다 큰 올바른 금액을 입력해 주세요.',
      categoryMissingError: '카테고리를 선택해 주세요.',
      categoryLabel: '카테고리',
      dateLabel: '날짜',
      paymentLabel: '결제수단',
      noteLabel: '메모 (선택 사항)',
      notePlaceholder: '예: 점심 식사, 매장 매출',
      saving: '저장 중...',
      save: '저장',
      update: '수정 저장',
      saveAndAnother: '저장 후 계속 추가',
      saveFailed: '항목을 저장할 수 없습니다.',
    },
    voice: {
      sectionLabel: '음성으로 내역 입력',
      startBtn: '음성 입력',
      tapHint: '마이크를 누르고 예: "점심 5000원"처럼 말씀하세요',
      stopBtn: '완료',
      cancelBtn: '취소',
      listening: '듣고 있습니다...',
      interimPlaceholder: '내용과 금액을 말씀해 주세요...',
      speechLangLabel: '음성 인식 언어',
      heardLabel: '인식된 내용',
      confirmSaveBtn: '바로 저장',
      clearTranscriptAria: '음성 인식 텍스트 닫기',
      unsupportedNotice:
        '이 브라우저에서는 음성 입력을 지원하지 않습니다. 아래에 직접 입력해 주세요.',
      errNotAllowed:
        '마이크 권한이 거부되었습니다. 브라우저 설정에서 허용하거나 직접 입력해 주세요.',
      errNoSpeech: '음성이 감지되지 않았습니다. 마이크를 다시 눌러 말씀해 주세요.',
      errNetwork: '이 브라우저의 음성 인식에는 인터넷 연결이 필요합니다.',
      errAudioCapture: '기기에서 마이크를 찾을 수 없습니다.',
      errGeneric: '음성 인식을 완료하지 못했습니다. 다시 시도하거나 직접 입력해 주세요.',
    },
    dialogs: {
      deleteTitle: '항목을 삭제할까요?',
      deleteBody: (label, formattedAmount) =>
        `장부에서 "${label}" (${formattedAmount}) 항목을 영구적으로 삭제합니다.`,
      keepEntry: '유지하기',
      deleting: '삭제 중...',
      deleteConfirm: '삭제',
      restoreTitle: '백업을 복원할까요?',
      restoreBody: (fileName, existingCount) =>
        existingCount > 0
          ? `"${fileName}" 파일을 복원하면 현재 저장된 ${existingCount}건의 데이터가 대체됩니다. 필요시 먼저 백업을 다운로드하세요.`
          : `"${fileName}" 파일에서 거래 데이터를 복원합니다.`,
      cancel: '취소',
      restoring: '복원 중...',
      restoreConfirm: '백업 복원',
      clearLegacyTitle: '기존 localStorage 데이터를 삭제할까요?',
      clearLegacyBody: (count) =>
        `기존 ${count}건의 항목이 이미 IndexedDB에 안전하게 복사되었습니다. 오래된 localStorage 사본을 삭제하면 복구할 수 없습니다.`,
      keepCopy: '사본 유지',
      clearing: '정리 중...',
      clearOldCopy: '이전 사본 삭제',
    },
    csvImport: {
      title: 'CSV 가져오기',
      subtitleDefault: '데이터베이스에 저장하기 전에 항목을 검토하세요',
      closeAria: 'CSV 가져오기 창 닫기',
      summaryTitle: 'CSV 가져오기 완료',
      importedNew: '신규 추가',
      updated: '업데이트됨',
      skippedDuplicates: '중복 건너뜀',
      invalidIgnored: '오류 행 제외',
      createdCategories: (count) => `CSV에서 새 사용자 정의 카테고리 ${count}개를 생성했습니다.`,
      done: '완료',
      totalRows: '전체 행',
      validRows: '유효한 행',
      duplicateRows: '중복 행',
      invalidRows: '오류 행',
      duplicateLegend: (count) => `중복 항목 처리 방법 (${count}건)`,
      skipDuplicates: '중복 건너뛰기',
      skipDuplicatesDesc: '기존 내역을 변경하지 않고 새 항목만 추가합니다.',
      updateExisting: '기존 항목 업데이트',
      updateExistingDesc: '일치하는 기존 항목을 CSV 내용으로 덮어씁니다.',
      importAsNew: '새 항목으로 추가',
      importAsNewDesc: '기존 내역은 그대로 두고 새 ID로 중복 항목을 추가합니다.',
      validationErrorsTitle: (count) => `유효성 검사 오류 (${count}개 행 건너뜀)`,
      moreInvalidRows: (count) => `외 ${count}개의 오류 행이 더 있습니다.`,
      colRow: '행',
      colStatus: '상태',
      statusNew: '신규',
      statusDuplicate: '중복',
      statusInvalid: '오류',
      previewLimitNote: (shown, total, importable) =>
        `전체 ${total}개 행 중 처음 ${shown}개 행을 미리 봅니다. 유효한 ${importable}개 행이 일괄 저장됩니다.`,
      cancel: '취소',
      close: '닫기',
      importing: '가져오는 중...',
      importRows: (count) => `${count}건 가져오기`,
      rowPrefix: (rowNum) => `${rowNum}행:`,
    },
    settings: {
      title: '설정 및 데이터',
      subtitle: '화면 테마, 언어, 통화 및 브라우저 저장소 관리',
      appearanceTitle: '화면 테마',
      appearanceDesc: '모든 화면에 적용할 라이트 모드 또는 다크 모드를 선택하세요',
      themeLabel: '테마 선택',
      lightMode: '라이트 모드',
      darkMode: '다크 모드',
      languageTitle: '언어 설정',
      languageDesc: '표시 언어를 변경합니다 (직접 입력한 메모와 사용자 카테고리는 변경되지 않습니다)',
      languageLabel: '언어 선택',
      burmeseLabel: 'မြန်မာ',
      englishLabel: 'English',
      koreanLabel: '한국어',
      japaneseLabel: '日本語',
      currencyTitle: '표시 통화',
      currencyDesc: '요약, 차트 및 내보내기에 사용할 통화 단위를 선택하세요',
      currencyLabel: '통화 선택',
      storageTitle: '저장소 및 백업',
      storageDesc:
        '데이터는 현재 기기의 브라우저 저장소에 보관되며 기기 간 자동 동기화는 지원되지 않습니다.',
      engineLabel: '활성 데이터베이스 엔진',
      engineIndexedDb: (version) => `IndexedDB (v${version})`,
      engineLocalStorage: 'Local Storage (대체 모드)',
      engineApi: 'PostgreSQL API 서버',
      persistenceLabel: '영구 저장 상태',
      persistedGranted: '허용됨',
      persistedBestEffort: '최선 노력(브라우저 관리)',
      persistedBrowserManaged: '브라우저 기본 관리',
      quotaLabel: '저장 용량',
      recordsCountLabel: '로컬 저장 항목',
      localOnlyNotice:
        'iPhone Safari에서는 장기간 접속하지 않으면 브라우저 데이터가 정리될 수 있으므로 홈 화면에 앱으로 설치하거나 JSON/CSV 백업을 권장합니다.',
      backupJson: 'JSON 백업',
      restoreJson: 'JSON 복원',
      clearOldLocalStorage: (count) => `이전 localStorage 정리 (${count})`,
      retryApi: 'API 다시 연결',
      checkingApi: '확인 중...',
      useLocalMode: 'IndexedDB 모드 사용',
      installApp: '앱 설치',
      quotaWarning: (percent) =>
        `브라우저 저장소 사용량이 ${percent ?? 80}%를 초과했습니다. JSON 백업을 내려받고 오래된 기록을 정리해 주세요.`,
      corruptedNotice: (key) =>
        `손상된 브라우저 데이터를 "${key}" 위치에 안전하게 격리했습니다.`,
      dismiss: '닫기',
    },
    toasts: {
      entrySaved: '항목이 저장되었습니다',
      entryUpdated: '항목이 수정되었습니다',
      entryDeleted: '항목이 삭제되었습니다',
      sampleLoaded: '샘플 데이터를 불러왔습니다',
      csvExported: 'CSV 파일을 내보냈습니다',
      csvImported: (inserted, updated) => `신규 ${inserted}건 추가, ${updated}건 업데이트 완료`,
      backupDownloaded: 'JSON 백업을 다운로드했습니다',
      backupRestored: (count) => `백업에서 ${count}건의 항목을 복원했습니다`,
      legacyCleared: '이전 localStorage 사본을 정리했습니다',
      appInstalled: '앱이 설치되었습니다',
    },
    errors: {
      genericLoad: '가계부 데이터를 불러올 수 없습니다.',
      deleteFailed: '항목을 삭제할 수 없습니다.',
      sampleFailed: '샘플 데이터를 불러올 수 없습니다.',
      csvExportFailed: 'CSV 내보내기에 실패했습니다.',
      backupDownloadFailed: '백업 다운로드에 실패했습니다.',
      invalidBackupFile: '올바르지 않은 백업 파일입니다.',
      restoreFailed: '백업 복원에 실패했습니다.',
      clearLegacyFailed: '이전 데이터를 정리할 수 없습니다.',
      csvParseFailed: 'CSV 파일을 읽을 수 없습니다.',
      csvImportFailed: 'CSV 가져오기에 실패했습니다.',
      installFailed: '앱 설치를 시작할 수 없습니다.',
    },
  },
  ja: {
    app: {
      name: 'デイリー家計簿',
      subtitle: '日々の収支をシンプルかつ正確に管理',
      skipToContent: 'メインコンテンツへスキップ',
    },
    nav: {
      primaryLabel: 'メインナビゲーション',
      home: 'ホーム',
      ledger: '明細',
      analytics: '分析',
      settings: '設定',
      collapseSidebar: 'サイドバーを折りたたむ',
      expandSidebar: 'サイドバーを展開',
      addEntry: '新規入力',
    },
    periods: {
      groupLabel: '集計期間の選択',
      today: '今日',
      week: '7日間',
      month: '今月',
    },
    currencies: {
      MMK: 'ミャンマー・チャット (Ks)',
      KRW: '韓国ウォン (₩)',
      JPY: '日本円 (¥)',
    },
    paymentMethods: {
      Cash: '現金',
      KBZPay: 'KBZPay',
      WavePay: 'WavePay',
      'Bank Transfer': '銀行振込',
      Card: 'カード',
    },
    home: {
      title: 'ホーム概要',
      subtitle: '選択した期間の収支サマリー',
      quickActionsTitle: 'クイック操作',
      addNewIncome: '収入を記録',
      addNewExpense: '支出を記録',
      openLedger: 'すべての明細を見る',
      openAnalytics: 'グラフを見る',
      recentTransactions: '最近の取引',
      viewAll: 'すべて見る',
      noRecent: 'この期間の取引記録はまだありません。',
      topCategoriesTitle: '主な支出カテゴリ',
      cashFlowPulseTitle: '収入と支出のバランス',
      expenseRatio: '支出比率',
      incomeShare: '収入',
      expenseShare: '支出',
      welcomeTitle: 'デイリー家計簿へようこそ',
      welcomeDesc:
        '家計簿の準備が整いました。最初の収入・支出をすぐに記録するか、サンプルデータを読み込んでグラフを試すことができます。',
      addFirstEntry: '最初の取引を追加',
      loadSampleData: 'サンプルデータを読み込む',
      loadingSample: '読み込み中...',
    },
    kpi: {
      sectionLabel: '主要財務指標',
      totalIncome: '収入合計',
      totalExpense: '支出合計',
      netBalance: '収支残高',
      newPeriod: '新規期間',
      vsPrevious: '前期間比',
      surplus: '黒字',
      deficit: '赤字',
    },
    analytics: {
      title: '収支分析',
      subtitle: '日別のキャッシュフロー推移とカテゴリ別の内訳',
      cashFlowTitle: 'キャッシュフロー',
      cashFlowSubtitle: '選択期間における日別の収入と支出',
      incomeLabel: '収入',
      expenseLabel: '支出',
      netLabel: '差引',
      loadingCashFlow: 'グラフを読み込み中...',
      categoriesTitle: 'カテゴリ別内訳',
      categoriesSubtitle: 'カテゴリごとの割合',
      loadingBreakdown: '内訳を読み込み中...',
      noCategoryEntries: (typeLabel) => `この期間の${typeLabel}データはまだありません。`,
      totalExpenseCenter: '支出合計',
      totalIncomeCenter: '収入合計',
    },
    ledger: {
      title: '帳簿明細',
      subtitle: '取引の検索、絞り込み、CSVインポート・エクスポート',
      showingCount: (shown, total) => `${total}件中 ${shown}件を表示`,
      importCsv: 'CSV取込',
      exportCsv: 'CSV出力',
      searchPlaceholder: 'メモ、カテゴリ、支払方法で検索...',
      searchLabel: '取引を検索',
      allTypes: 'すべての区分',
      incomeType: '収入',
      expenseType: '支出',
      allCategories: 'すべてのカテゴリ',
      sortNewest: '新しい順',
      sortOldest: '古い順',
      sortHighest: '金額が高い順',
      sortLowest: '金額が低い順',
      colDate: '日付',
      colCategory: 'カテゴリ',
      colNote: 'メモ',
      colMethod: '支払方法',
      colType: '区分',
      colAmount: '金額',
      colActions: '操作',
      loading: '明細を読み込み中...',
      emptyFiltered: '現在の条件に一致する取引が見つかりません。',
      noNote: 'メモなし',
      pageInfo: (page, totalPages) => `${page} / ${totalPages} ページ`,
      previous: '前へ',
      next: '次へ',
      editAria: (label) => `${label} の明細を編集`,
      deleteAria: (label) => `${label} の明細を削除`,
      expandAria: '詳細を展開',
      collapseAria: '詳細を折りたたむ',
      editBtn: '編集',
      deleteBtn: '削除',
    },
    entry: {
      addTitle: '新規入力',
      editTitle: '明細を編集',
      subtitle: '帳簿に直接保存され、合計金額が即時更新されます',
      closeAria: '入力画面を閉じる',
      backAria: 'ホームに戻る',
      typeLegend: '取引区分',
      expense: '支出',
      income: '収入',
      amountLabel: (symbol) => `金額 (${symbol})`,
      amountHint: (example) => `数字のみ入力してください (例: ${example})`,
      amountInvalidMsg: '0より大きい正しい金額を入力してください。',
      amountSubmitError: '0より大きい有効な金額を入力してください。',
      categoryMissingError: 'カテゴリを選択してください。',
      categoryLabel: 'カテゴリ',
      dateLabel: '日付',
      paymentLabel: '支払方法',
      noteLabel: 'メモ (任意)',
      notePlaceholder: '例: ランチ、店舗売上',
      saving: '保存中...',
      save: '保存',
      update: '変更を保存',
      saveAndAnother: '保存して続けて追加',
      saveFailed: '保存に失敗しました。',
    },
    voice: {
      sectionLabel: '音声入力',
      startBtn: '音声で入力',
      tapHint: 'マイクを押して例:「ランチ 1200円」と話してください',
      stopBtn: '完了',
      cancelBtn: 'キャンセル',
      listening: '聞き取り中...',
      interimPlaceholder: '内容と金額をお話しください...',
      speechLangLabel: '音声認識の言語',
      heardLabel: '認識結果',
      confirmSaveBtn: 'このまま保存',
      clearTranscriptAria: '認識テキストを閉じる',
      unsupportedNotice:
        'このブラウザは音声入力に対応していません。下のフォームに直接入力してください。',
      errNotAllowed:
        'マイクへのアクセスが拒否されました。ブラウザ設定で許可するか手動で入力してください。',
      errNoSpeech: '音声が検出されませんでした。マイクを押してもう一度お話しください。',
      errNetwork: '音声認識にはインターネット接続が必要です。',
      errAudioCapture: 'この端末でマイクが見つかりませんでした。',
      errGeneric: '音声入力を完了できませんでした。再試行するか手動で入力してください。',
    },
    dialogs: {
      deleteTitle: '明細を削除しますか？',
      deleteBody: (label, formattedAmount) =>
        `「${label}」(${formattedAmount}) を帳簿から完全に削除します。`,
      keepEntry: '残す',
      deleting: '削除中...',
      deleteConfirm: '削除する',
      restoreTitle: 'バックアップを復元しますか？',
      restoreBody: (fileName, existingCount) =>
        existingCount > 0
          ? `「${fileName}」を復元すると、現在の${existingCount}件のローカルデータが置き換わります。必要に応じて先にバックアップを保存してください。`
          : `「${fileName}」から取引データを復元します。`,
      cancel: 'キャンセル',
      restoring: '復元中...',
      restoreConfirm: 'バックアップを復元',
      clearLegacyTitle: '古い localStorage データを削除しますか？',
      clearLegacyBody: (count) =>
        `${count}件のデータはすでに IndexedDB にコピー済みです。古い localStorage データを削除すると元に戻せません。`,
      keepCopy: '保持する',
      clearing: '削除中...',
      clearOldCopy: '古いコピーを削除',
    },
    csvImport: {
      title: 'CSVインポート',
      subtitleDefault: '保存する前にインポート内容を確認してください',
      closeAria: 'CSV取込画面を閉じる',
      summaryTitle: 'CSVインポート完了',
      importedNew: '新規登録',
      updated: '更新済み',
      skippedDuplicates: '重複スキップ',
      invalidIgnored: 'エラー除外',
      createdCategories: (count) => `CSVから${count}件のカスタムカテゴリを新規作成しました。`,
      done: '完了',
      totalRows: '総行数',
      validRows: '有効行',
      duplicateRows: '重複数',
      invalidRows: 'エラー行',
      duplicateLegend: (count) => `重複データの処理方法 (${count}件)`,
      skipDuplicates: '重複をスキップ',
      skipDuplicatesDesc: '既存データを変更せず、新規レコードのみを取り込みます。',
      updateExisting: '既存データを更新',
      updateExistingDesc: '一致する既存レコードをCSVの内容で上書き更新します。',
      importAsNew: '新規として追加',
      importAsNewDesc: '既存データを残したまま新しいIDで追加します。',
      validationErrorsTitle: (count) => `入力チェックエラー (${count}行をスキップ)`,
      moreInvalidRows: (count) => `ほか ${count}件のエラー行があります。`,
      colRow: '行',
      colStatus: '状態',
      statusNew: '新規',
      statusDuplicate: '重複',
      statusInvalid: 'エラー',
      previewLimitNote: (shown, total, importable) =>
        `全${total}行のうち先頭${shown}行を表示しています。有効な${importable}行が一括保存されます。`,
      cancel: 'キャンセル',
      close: '閉じる',
      importing: '取込中...',
      importRows: (count) => `${count}件を取り込む`,
      rowPrefix: (rowNum) => `${rowNum}行目:`,
    },
    settings: {
      title: '設定・データ管理',
      subtitle: 'テーマ、表示言語、通貨、ブラウザ保存領域の設定',
      appearanceTitle: '外観テーマ',
      appearanceDesc: 'すべての画面に適用するライトモード／ダークモードを選択します',
      themeLabel: 'テーマ選択',
      lightMode: 'ライト',
      darkMode: 'ダーク',
      languageTitle: '表示言語',
      languageDesc: 'UI言語を切り替えます（入力済みのメモや独自カテゴリ名は変更されません）',
      languageLabel: '言語選択',
      burmeseLabel: 'မြန်မာ',
      englishLabel: 'English',
      koreanLabel: '한국어',
      japaneseLabel: '日本語',
      currencyTitle: '表示通貨',
      currencyDesc: 'サマリー、グラフ、CSV出力で使用する通貨を選択します',
      currencyLabel: '通貨選択',
      storageTitle: 'ストレージとバックアップ',
      storageDesc:
        'データは現在のブラウザ内にローカル保存され、端末間での自動同期は行われません。',
      engineLabel: 'データベースエンジン',
      engineIndexedDb: (version) => `IndexedDB (v${version})`,
      engineLocalStorage: 'Local Storage (フォールバック)',
      engineApi: 'PostgreSQL API サーバー',
      persistenceLabel: '永続化ステータス',
      persistedGranted: '許可済み',
      persistedBestEffort: 'ベストエフォート',
      persistedBrowserManaged: 'ブラウザ標準管理',
      quotaLabel: '使用容量',
      recordsCountLabel: 'ローカル保存件数',
      localOnlyNotice:
        'iPhone Safariでは一定期間アクセスがないとデータが消去される場合があるため、ホーム画面への追加または定期的なJSON/CSVバックアップをおすすめします。',
      backupJson: 'JSONバックアップ',
      restoreJson: 'JSON復元',
      clearOldLocalStorage: (count) => `古い localStorage を削除 (${count})`,
      retryApi: 'API再接続',
      checkingApi: '確認中...',
      useLocalMode: 'IndexedDB モードを使用',
      installApp: 'アプリをインストール',
      quotaWarning: (percent) =>
        `ブラウザ容量の使用率が${percent ?? 80}%を超えています。JSONバックアップを保存して古い記録を整理してください。`,
      corruptedNotice: (key) =>
        `破損したレコードを検出し、「${key}」へ安全に隔離しました。`,
      dismiss: '閉じる',
    },
    toasts: {
      entrySaved: '取引を保存しました',
      entryUpdated: '取引を更新しました',
      entryDeleted: '取引を削除しました',
      sampleLoaded: 'サンプルデータを読み込みました',
      csvExported: 'CSVファイルを出力しました',
      csvImported: (inserted, updated) => `新規 ${inserted}件、更新 ${updated}件を取り込みました`,
      backupDownloaded: 'JSONバックアップを保存しました',
      backupRestored: (count) => `バックアップから ${count}件を復元しました`,
      legacyCleared: '古い localStorage データを削除しました',
      appInstalled: 'アプリをインストールしました',
    },
    errors: {
      genericLoad: '家計簿データを読み込めません。',
      deleteFailed: '取引を削除できませんでした。',
      sampleFailed: 'サンプルデータを読み込めませんでした。',
      csvExportFailed: 'CSV出力に失敗しました。',
      backupDownloadFailed: 'バックアップの保存に失敗しました。',
      invalidBackupFile: '無効なバックアップファイルです。',
      restoreFailed: 'バックアップの復元に失敗しました。',
      clearLegacyFailed: '古いデータを削除できませんでした。',
      csvParseFailed: 'CSVファイルを解析できません。',
      csvImportFailed: 'CSVインポートに失敗しました。',
      installFailed: 'アプリのインストールを開始できません。',
    },
  },
};

const BUILT_IN_CATEGORY_LABELS: Record<'ko' | 'ja', Record<string, string>> = {
  ko: {
    Salary: '급여',
    Sales: '매출',
    Freelance: '프리랜서',
    Investment: '투자 수익',
    'Other Income': '기타 수입',
    'Food & Dining': '식비',
    Transport: '교통비',
    'Bills & Utilities': '공과금 / 요금',
    Shopping: '쇼핑',
    Health: '건강 / 의료',
    'Home & Rent': '주거 / 생활',
    'Other Expense': '기타 지출',
  },
  ja: {
    Salary: '給与',
    Sales: '売上',
    Freelance: 'フリーランス',
    Investment: '投資',
    'Other Income': 'その他の収入',
    'Food & Dining': '食費',
    Transport: '交通費',
    'Bills & Utilities': '光熱費・請求書',
    Shopping: '買い物',
    Health: '健康・医療',
    'Home & Rent': '住居・家賃',
    'Other Expense': 'その他の支出',
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
  const locale = lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : 'en-US';
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(locale, {
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
  const locale = lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : 'en-US';
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(locale, {
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
  const isBuiltIn = category.isDefault === true || Boolean(category.nameMy?.trim());
  if (!isBuiltIn || lang === 'en') {
    return category.name;
  }
  if (lang === 'my') {
    return category.nameMy?.trim() || category.name;
  }
  return BUILT_IN_CATEGORY_LABELS[lang][category.name] ?? category.name;
}

export function getPaymentMethodLabel(method: string, lang: LanguageCode): string {
  const map = TRANSLATIONS[lang].paymentMethods as Record<string, string>;
  return map[method] ?? method;
}

export function getTypeLabel(type: TransactionType, lang: LanguageCode): string {
  return type === 'income' ? TRANSLATIONS[lang].entry.income : TRANSLATIONS[lang].entry.expense;
}
