import React from 'react'
import payBinance from '../assets/binance.png'
import payHuobi from '../assets/Huobi.png'
import payOkx from '../assets/okx.png'
import payKraken from '../assets/KraKen.png'
import payCoinbase from '../assets/Coinbase.png'
import payMetamask from '../assets/MetaMask.png'
import payKucoin from '../assets/KuCoin.png'
import payBitfinex from '../assets/Bitfinex.png'
import { useLang } from '../context/LangContext'
import { tr } from '../i18n'

const WALLETS = [
  { name: 'Binance', logo: payBinance, url: 'https://www.binance.com' },
  { name: 'Huobi', logo: payHuobi, url: 'https://www.huobi.com' },
  { name: 'OKX', logo: payOkx, url: 'https://www.okx.com' },
  { name: 'KraKen', logo: payKraken, url: 'https://www.kraken.com' },
  { name: 'Coinbase', logo: payCoinbase, url: 'https://www.coinbase.com' },
  { name: 'MetaMask', logo: payMetamask, url: 'https://metamask.io' },
  { name: 'KuCoin', logo: payKucoin, url: 'https://www.kucoin.com' },
  { name: 'Bitfinex', logo: payBitfinex, url: 'https://www.bitfinex.com' },
] as const

const WalletPaymentBadges: React.FC = () => {
  const { lang } = useLang()

  const title = tr(lang, {
    zh: '推荐交易所/钱包',
    en: 'Recommended exchanges / wallets',
    de: 'Empfohlene Börsen / Wallets',
    ja: 'おすすめの取引所・ウォレット',
    ko: '추천 거래소/지갑',
    es: 'Exchanges y carteras recomendadas', it: 'Exchange / portafogli consigliati', vi: 'Sàn giao dịch / ví được đề xuất',
  })
  const listLabel = tr(lang, {
    zh: '支持的交易所与钱包',
    en: 'Supported exchanges and wallets',
    de: 'Unterstützte Börsen und Wallets',
    ja: '対応取引所・ウォレット',
    ko: '지원 거래소 및 지갑',
    es: 'Exchanges y carteras compatibles', it: 'Exchange e portafogli supportati', vi: 'Sàn giao dịch và ví được hỗ trợ',
  })

  return (
    <div className="merchant-wallet-form-wallets">
      <div className="merchant-wallet-form-wallets-title">{title}</div>
      <div className="merchant-wallet-form-wallets-logos" aria-label={listLabel}>
        {WALLETS.map((w) => (
          <a
            key={w.name}
            href={w.url}
            target="_blank"
            rel="noreferrer"
            className="merchant-wallet-form-wallets-badge"
            aria-label={w.name}
          >
            <img src={w.logo} alt="" className="merchant-wallet-form-wallets-logo" />
            <span className="merchant-wallet-form-wallets-name">{w.name}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

export default WalletPaymentBadges
