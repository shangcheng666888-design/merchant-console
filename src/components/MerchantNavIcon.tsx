import navHome from '../assets/nav-home.png'
import navHomeActive from '../assets/nav-home-active.png'
import navOrders from '../assets/nav-orders.png'
import navOrdersActive from '../assets/nav-orders-active.png'
import navWarehouse from '../assets/nav-warehouse.png'
import navWarehouseActive from '../assets/nav-warehouse-active.png'
import navSettings from '../assets/nav-settings.png'
import navSettingsActive from '../assets/nav-settings-active.png'
import navPlus from '../assets/nav-plus.png'

type NavIconName = 'home' | 'orders' | 'plus' | 'warehouse' | 'settings'

const NAV_ICON_ASSETS: Record<
  Exclude<NavIconName, 'plus'>,
  { default: string; active: string }
> = {
  home: { default: navHome, active: navHomeActive },
  orders: { default: navOrders, active: navOrdersActive },
  warehouse: { default: navWarehouse, active: navWarehouseActive },
  settings: { default: navSettings, active: navSettingsActive },
}

function PlusIcon({ className }: { className?: string }) {
  const iconClassName = ['mc-bottom-nav-icon-img', 'mc-bottom-nav-icon-img--fab', className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <img
      src={navPlus}
      alt=""
      className={iconClassName}
      width={30}
      height={30}
      decoding="async"
      aria-hidden="true"
    />
  )
}

export function MerchantNavIcon({
  name,
  className,
  active,
}: {
  name: NavIconName
  className?: string
  active?: boolean
}) {
  if (name === 'plus') {
    return <PlusIcon className={className} />
  }

  const assets = NAV_ICON_ASSETS[name]
  const iconClassName = [
    'mc-bottom-nav-icon-img',
    active ? 'mc-bottom-nav-icon-img--active' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <img
      src={active ? assets.active : assets.default}
      alt=""
      className={iconClassName}
      width={28}
      height={28}
      decoding="async"
      aria-hidden="true"
    />
  )
}
