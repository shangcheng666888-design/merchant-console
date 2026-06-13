import type { Lang } from '../i18n/lang'
import { pickLabel, tr } from '../i18n/tr'
import { toTraditional } from '../i18n/zhConvert'

export interface RegionDisplay {
  headline: string
  subtitle: string
}

/** 国家/地区名称 → 大致中心坐标（地理编码失败时的回退） */
export interface CountryCentroid {
  lat: number
  lng: number
  labelZh: string
  labelEn: string
  labelDe: string
  labelJa: string
  labelKo: string
  labelEs: string
  labelIt: string
  labelVi: string
  labelFr: string
}

export const COUNTRY_CENTROIDS: CountryCentroid[] = [
  { lat: 39.9042, lng: 116.4074, labelZh: '中国', labelEn: 'China', labelDe: 'China', labelJa: '中国', labelKo: '중국', labelEs: 'China', labelIt: 'Cina', labelVi: 'Trung Quốc', labelFr: 'Chine' },
  { lat: 38.9072, lng: -77.0369, labelZh: '美国', labelEn: 'United States', labelDe: 'Vereinigte Staaten', labelJa: 'アメリカ合衆国', labelKo: '미국', labelEs: 'Estados Unidos', labelIt: 'Stati Uniti', labelVi: 'Hoa Kỳ', labelFr: 'États-Unis' },
  { lat: 51.5074, lng: -0.1278, labelZh: '英国', labelEn: 'United Kingdom', labelDe: 'Vereinigtes Königreich', labelJa: 'イギリス', labelKo: '영국', labelEs: 'Reino Unido', labelIt: 'Regno Unito', labelVi: 'Vương quốc Anh', labelFr: 'Royaume-Uni' },
  { lat: 35.6762, lng: 139.6503, labelZh: '日本', labelEn: 'Japan', labelDe: 'Japan', labelJa: '日本', labelKo: '일본', labelEs: 'Japón', labelIt: 'Giappone', labelVi: 'Nhật Bản', labelFr: 'Japon' },
  { lat: 48.8566, lng: 2.3522, labelZh: '法国', labelEn: 'France', labelDe: 'Frankreich', labelJa: 'フランス', labelKo: '프랑스', labelEs: 'Francia', labelIt: 'Francia', labelVi: 'Pháp', labelFr: 'France' },
  { lat: 52.52, lng: 13.405, labelZh: '德国', labelEn: 'Germany', labelDe: 'Deutschland', labelJa: 'ドイツ', labelKo: '독일', labelEs: 'Alemania', labelIt: 'Germania', labelVi: 'Đức', labelFr: 'Allemagne' },
  { lat: -33.8688, lng: 151.2093, labelZh: '澳大利亚', labelEn: 'Australia', labelDe: 'Australien', labelJa: 'オーストラリア', labelKo: '호주', labelEs: 'Australia', labelIt: 'Australia', labelVi: 'Úc', labelFr: 'Australie' },
  { lat: 43.6532, lng: -79.3832, labelZh: '加拿大', labelEn: 'Canada', labelDe: 'Kanada', labelJa: 'カナダ', labelKo: '캐나다', labelEs: 'Canadá', labelIt: 'Canada', labelVi: 'Canada', labelFr: 'Canada' },
  { lat: 1.3521, lng: 103.8198, labelZh: '新加坡', labelEn: 'Singapore', labelDe: 'Singapur', labelJa: 'シンガポール', labelKo: '싱가포르', labelEs: 'Singapur', labelIt: 'Singapore', labelVi: 'Singapore', labelFr: 'Singapour' },
  { lat: 25.2048, lng: 55.2708, labelZh: '阿联酋', labelEn: 'United Arab Emirates', labelDe: 'Vereinigte Arabische Emirate', labelJa: 'アラブ首長国連邦', labelKo: '아랍에미리트', labelEs: 'Emiratos Árabes Unidos', labelIt: 'Emirati Arabi Uniti', labelVi: 'Các Tiểu vương quốc Ả Rập Thống nhất', labelFr: 'Émirats arabes unis' },
  { lat: 19.076, lng: 72.8777, labelZh: '印度', labelEn: 'India', labelDe: 'Indien', labelJa: 'インド', labelKo: '인도', labelEs: 'India', labelIt: 'India', labelVi: 'Ấn Độ', labelFr: 'Inde' },
  { lat: -23.5505, lng: -46.6333, labelZh: '巴西', labelEn: 'Brazil', labelDe: 'Brasilien', labelJa: 'ブラジル', labelKo: '브라질', labelEs: 'Brasil', labelIt: 'Brasile', labelVi: 'Brazil', labelFr: 'Brésil' },
  { lat: 55.7558, lng: 37.6173, labelZh: '俄罗斯', labelEn: 'Russia', labelDe: 'Russland', labelJa: 'ロシア', labelKo: '러시아', labelEs: 'Rusia', labelIt: 'Russia', labelVi: 'Nga', labelFr: 'Russie' },
  { lat: 37.5665, lng: 126.978, labelZh: '韩国', labelEn: 'South Korea', labelDe: 'Südkorea', labelJa: '韓国', labelKo: '대한민국', labelEs: 'Corea del Sur', labelIt: 'Corea del Sud', labelVi: 'Hàn Quốc', labelFr: 'Corée du Sud' },
  { lat: 25.033, lng: 121.5654, labelZh: '台湾', labelEn: 'Taiwan', labelDe: 'Taiwan', labelJa: '台湾', labelKo: '대만', labelEs: 'Taiwán', labelIt: 'Taiwan', labelVi: 'Đài Loan', labelFr: 'Taïwan' },
  { lat: 22.3193, lng: 114.1694, labelZh: '香港', labelEn: 'Hong Kong', labelDe: 'Hongkong', labelJa: '香港', labelKo: '홍콩', labelEs: 'Hong Kong', labelIt: 'Hong Kong', labelVi: 'Hồng Kông', labelFr: 'Hong Kong' },
  { lat: 41.9028, lng: 12.4964, labelZh: '意大利', labelEn: 'Italy', labelDe: 'Italien', labelJa: 'イタリア', labelKo: '이탈리아', labelEs: 'Italia', labelIt: 'Italia', labelVi: 'Ý', labelFr: 'Italie' },
  { lat: 40.4168, lng: -3.7038, labelZh: '西班牙', labelEn: 'Spain', labelDe: 'Spanien', labelJa: 'スペイン', labelKo: '스페인', labelEs: 'España', labelIt: 'Spagna', labelVi: 'Tây Ban Nha', labelFr: 'Espagne' },
  { lat: 52.3676, lng: 4.9041, labelZh: '荷兰', labelEn: 'Netherlands', labelDe: 'Niederlande', labelJa: 'オランダ', labelKo: '네덜란드', labelEs: 'Países Bajos', labelIt: 'Paesi Bassi', labelVi: 'Hà Lan', labelFr: 'Pays-Bas' },
  { lat: 59.3293, lng: 18.0686, labelZh: '瑞典', labelEn: 'Sweden', labelDe: 'Schweden', labelJa: 'スウェーデン', labelKo: '스웨덴', labelEs: 'Suecia', labelIt: 'Svezia', labelVi: 'Thụy Điển', labelFr: 'Suède' },
  { lat: 60.1699, lng: 24.9384, labelZh: '芬兰', labelEn: 'Finland', labelDe: 'Finnland', labelJa: 'フィンランド', labelKo: '핀란드', labelEs: 'Finlandia', labelIt: 'Finlandia', labelVi: 'Phần Lan', labelFr: 'Finlande' },
  { lat: 47.3769, lng: 8.5417, labelZh: '瑞士', labelEn: 'Switzerland', labelDe: 'Schweiz', labelJa: 'スイス', labelKo: '스위스', labelEs: 'Suiza', labelIt: 'Svizzera', labelVi: 'Thụy Sĩ', labelFr: 'Suisse' },
  { lat: 50.8503, lng: 4.3517, labelZh: '比利时', labelEn: 'Belgium', labelDe: 'Belgien', labelJa: 'ベルギー', labelKo: '벨기에', labelEs: 'Bélgica', labelIt: 'Belgio', labelVi: 'Bỉ', labelFr: 'Belgique' },
  { lat: 59.9139, lng: 10.7522, labelZh: '挪威', labelEn: 'Norway', labelDe: 'Norwegen', labelJa: 'ノルウェー', labelKo: '노르웨이', labelEs: 'Noruega', labelIt: 'Norvegia', labelVi: 'Na Uy', labelFr: 'Norvège' },
  { lat: 55.6761, lng: 12.5683, labelZh: '丹麦', labelEn: 'Denmark', labelDe: 'Dänemark', labelJa: 'デンマーク', labelKo: '덴마크', labelEs: 'Dinamarca', labelIt: 'Danimarca', labelVi: 'Đan Mạch', labelFr: 'Danemark' },
  { lat: 64.1466, lng: -21.9426, labelZh: '冰岛', labelEn: 'Iceland', labelDe: 'Island', labelJa: 'アイスランド', labelKo: '아이슬란드', labelEs: 'Islandia', labelIt: 'Islanda', labelVi: 'Iceland', labelFr: 'Islande' },
  { lat: 31.2304, lng: 121.4737, labelZh: '上海', labelEn: 'Shanghai', labelDe: 'Shanghai', labelJa: '上海', labelKo: '상하이', labelEs: 'Shanghái', labelIt: 'Shanghai', labelVi: 'Thượng Hải', labelFr: 'Shanghai' },
  { lat: 22.5431, lng: 114.0579, labelZh: '深圳', labelEn: 'Shenzhen', labelDe: 'Shenzhen', labelJa: '深圳', labelKo: '선전', labelEs: 'Shenzhen', labelIt: 'Shenzhen', labelVi: 'Thâm Quyến', labelFr: 'Shenzhen' },
  { lat: 23.1291, lng: 113.2644, labelZh: '广州', labelEn: 'Guangzhou', labelDe: 'Guangzhou', labelJa: '広州', labelKo: '광저우', labelEs: 'Cantón', labelIt: 'Guangzhou', labelVi: 'Quảng Châu', labelFr: 'Guangzhou' },
  { lat: 30.5728, lng: 104.0668, labelZh: '成都', labelEn: 'Chengdu', labelDe: 'Chengdu', labelJa: '成都', labelKo: '청두', labelEs: 'Chengdu', labelIt: 'Chengdu', labelVi: 'Thành Đô', labelFr: 'Chengdu' },
]

function normalizeCountryKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

export function lookupCountryCentroid(country: string): CountryCentroid | null {
  const key = normalizeCountryKey(country)
  if (!key) return null
  return (
    COUNTRY_CENTROIDS.find(
      (item) =>
        normalizeCountryKey(item.labelZh) === key ||
        normalizeCountryKey(toTraditional(item.labelZh)) === key ||
        normalizeCountryKey(item.labelEn) === key ||
        normalizeCountryKey(item.labelDe) === key ||
        normalizeCountryKey(item.labelJa) === key ||
        normalizeCountryKey(item.labelKo) === key ||
        normalizeCountryKey(item.labelEs) === key ||
        normalizeCountryKey(item.labelIt ?? '') === key ||
        normalizeCountryKey(item.labelVi ?? '') === key ||
        key.includes(normalizeCountryKey(item.labelZh)) ||
        key.includes(normalizeCountryKey(toTraditional(item.labelZh))) ||
        key.includes(normalizeCountryKey(item.labelEn)) ||
        key.includes(normalizeCountryKey(item.labelDe)) ||
        key.includes(normalizeCountryKey(item.labelJa)) ||
        key.includes(normalizeCountryKey(item.labelKo)) ||
        key.includes(normalizeCountryKey(item.labelEs)) ||
        key.includes(normalizeCountryKey(item.labelIt ?? '')) ||
        key.includes(normalizeCountryKey(item.labelVi ?? '')),
    ) ?? null
  )
}

export function countryCentroidLabel(item: CountryCentroid, lang: Lang): string {
  return pickLabel(lang, item)
}

/** cobe 官方算法：使目标经纬度正对镜头（phi←经度，theta←纬度） */
export function locationToGlobeAngles(lat: number, lng: number): { phi: number; theta: number } {
  const lngRad = (lng * Math.PI) / 180
  const latRad = (lat * Math.PI) / 180
  return {
    phi: Math.PI - (lngRad - Math.PI / 2),
    theta: latRad,
  }
}

/** 沿最短弧插值旋转角，避免地球绕远路转侧 */
export function lerpGlobeAngle(from: number, to: number, t: number): number {
  let diff = to - from
  const tau = Math.PI * 2
  diff = ((((diff + Math.PI) % tau) + tau) % tau) - Math.PI
  return from + diff * t
}

export function formatRegionDisplay(label: string, address: string, lang: Lang): RegionDisplay {
  const parts = label
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)

  let regionParts = parts
  if (regionParts.length > 1 && (/\d/.test(regionParts[0]) || regionParts[0].length > 28)) {
    regionParts = regionParts.slice(1)
  }

  const separator = tr(lang, { zh: ' · ', en: ', ', de: ', ', ja: ' · ', ko: ' · ', es: ', ', it: ', ', vi: ', ', fr: ', ' })
  const headline =
    regionParts.slice(0, 2).join(separator) ||
    address.trim() ||
    tr(lang, { zh: '未知区域', en: 'Unknown region', de: 'Unbekannte Region', ja: '不明な地域', ko: '알 수 없는 지역', es: 'Región desconocida', it: 'Regione sconosciuta', vi: 'Khu vực không xác định', fr: 'Région inconnue' })

  return { headline, subtitle: address.trim() }
}

export function formatLatLabel(lat: number, lang: Lang): string {
  const abs = Math.abs(lat).toFixed(1)
  return tr(lang, {
    zh: lat >= 0 ? `北纬 ${abs}°` : `南纬 ${abs}°`,
    en: lat >= 0 ? `${abs}°N` : `${abs}°S`,
    de: lat >= 0 ? `${abs}°N` : `${abs}°S`,
    ja: lat >= 0 ? `北緯 ${abs}°` : `南緯 ${abs}°`,
    ko: lat >= 0 ? `북위 ${abs}°` : `남위 ${abs}°`,
    es: lat >= 0 ? `${abs}°N` : `${abs}°S`,
    it: lat >= 0 ? `${abs}°N` : `${abs}°S`,
    vi: lat >= 0 ? `${abs}°B` : `${abs}°N`,
  })
}

export function formatLngLabel(lng: number, lang: Lang): string {
  const abs = Math.abs(lng).toFixed(1)
  return tr(lang, {
    zh: lng >= 0 ? `东经 ${abs}°` : `西经 ${abs}°`,
    en: lng >= 0 ? `${abs}°E` : `${abs}°W`,
    de: lng >= 0 ? `${abs}°E` : `${abs}°W`,
    ja: lng >= 0 ? `東経 ${abs}°` : `西経 ${abs}°`,
    ko: lng >= 0 ? `동경 ${abs}°` : `서경 ${abs}°`,
    es: lng >= 0 ? `${abs}°E` : `${abs}°O`,
    it: lng >= 0 ? `${abs}°E` : `${abs}°W`,
    vi: lng >= 0 ? `${abs}°Đ` : `${abs}°T`,
  })
}
