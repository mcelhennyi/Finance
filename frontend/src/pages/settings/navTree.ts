/** Settings sidebar: hierarchical tree-shaped nav data (visual nesting only). */

export type SettingsNavId = 'general-overview' | 'merchants-outstanding' | 'merchants-all'

export type SettingsTreeNode =
  | { kind: 'group'; key: string; label: string; children: SettingsTreeNode[] }
  | { kind: 'leaf'; id: SettingsNavId; label: string }

export const SETTINGS_TREE: SettingsTreeNode[] = [
  {
    kind: 'group',
    key: 'general',
    label: 'General',
    children: [{ kind: 'leaf', id: 'general-overview', label: 'Overview' }],
  },
  {
    kind: 'group',
    key: 'transactions',
    label: 'Transactions',
    children: [
      {
        kind: 'group',
        key: 'merchants',
        label: 'Merchant display',
        children: [
          { kind: 'leaf', id: 'merchants-outstanding', label: 'Outstanding' },
          { kind: 'leaf', id: 'merchants-all', label: 'All merchants' },
        ],
      },
    ],
  },
]

export const DEFAULT_SETTINGS_NAV_ID: SettingsNavId = 'merchants-outstanding'
