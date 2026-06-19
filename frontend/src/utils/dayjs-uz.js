import dayjs from 'dayjs';

const uzLatn = {
  name: 'uz-latn',
  months: 'Yanvar_Fevral_Mart_Aprel_May_Iyun_Iyul_Avgust_Sentabr_Oktabr_Noyabr_Dekabr'.split('_'),
  monthsShort: 'Yan_Fev_Mar_Apr_May_Iyu_Iyu_Avg_Sen_Okt_Noy_Dek'.split('_'),
  weekdays: 'Yakshanba_Dushanba_Seshanba_Chorshanba_Payshanba_Juma_Shanba'.split('_'),
  weekdaysShort: 'Yak_Dush_Sesh_Chor_Pay_Jum_Shan'.split('_'),
  weekdaysMin: 'Ya_Du_Se_Ch_Pa_Ju_Sh'.split('_'),
  weekStart: 1,
  formats: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'DD.MM.YYYY',
    LL: 'D MMMM YYYY',
    LLL: 'D MMMM YYYY HH:mm',
    LLLL: 'D MMMM YYYY, dddd HH:mm',
  },
  relativeTime: {
    future: '%s ichida',
    past: '%s oldin',
    s: 'bir necha soniya',
    m: 'bir daqiqa',
    mm: '%d daqiqa',
    h: 'bir soat',
    hh: '%d soat',
    d: 'bir kun',
    dd: '%d kun',
    M: 'bir oy',
    MM: '%d oy',
    y: 'bir yil',
    yy: '%d yil',
  },
  ordinal: (n) => `${n}`,
};

dayjs.locale(uzLatn, null, true);

export default uzLatn;
